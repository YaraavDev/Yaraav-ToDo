import { ipcMain, dialog, BrowserWindow, Notification, app } from "electron";
import fs from "fs";
import { v4 as uuid } from "uuid";
import {
  listAll,
  getById,
  insertRow,
  updateRow,
  deleteRow,
  getAllSettings,
  setSetting,
  getDb,
} from "../db";

// Tables reachable through the generic CRUD channel. Whitelisted for safety
// since renderer input decides the table name over IPC.
const CRUD_TABLES = new Set([
  "tasks",
  "subtasks",
  "tags",
  "habits",
  "habit_logs",
  "goals",
  "study_sessions",
  "students",
  "notes",
  "badges",
]);

function nowIso() {
  return new Date().toISOString();
}

function tableHasColumn(table: string, column: string): boolean {
  const cols = getDb()
    .prepare(`PRAGMA table_info(${table})`)
    .all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

/**
 * بعد از insert، رکورد کامل رو دوباره از دیتابیس می‌خونه
 * تا created_at / updated_at هم برگردونده بشن.
 */
function readBack(table: string, id: string | number) {
  return getDb().prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
}

export function registerIpcHandlers(mainWindow: () => BrowserWindow | null) {
  // ---- Generic CRUD -------------------------------------------------------
  ipcMain.handle("db:list", (_e, table: string, where?: string, params?: any[]) => {
    if (!CRUD_TABLES.has(table)) throw new Error("Table not allowed: " + table);
    return listAll(table, where, params ?? []);
  });

  ipcMain.handle("db:get", (_e, table: string, id: string) => {
    if (!CRUD_TABLES.has(table)) throw new Error("Table not allowed: " + table);
    return getById(table, id);
  });

  ipcMain.handle("db:create", (_e, table: string, row: Record<string, any>) => {
    if (!CRUD_TABLES.has(table)) throw new Error("Table not allowed: " + table);

    const id = row.id ?? uuid();
    const payload: Record<string, any> = { ...row, id };

    if (tableHasColumn(table, "created_at") && !payload.created_at) {
      payload.created_at = nowIso();
    }
    if (table === "tasks") {
      payload.updated_at = nowIso();
    }

    insertRow(table, payload);

    // رکورد کامل رو برمی‌گردونیم تا created_at / updated_at هم موجود باشن
    return readBack(table, id) ?? { id };
  });

  ipcMain.handle(
    "db:update",
    (_e, table: string, id: string, row: Record<string, any>) => {
      if (!CRUD_TABLES.has(table)) throw new Error("Table not allowed: " + table);

      const payload: Record<string, any> = { ...row };
      if (table === "tasks") payload.updated_at = nowIso();

      updateRow(table, id, payload);

      return readBack(table, id) ?? { id };
    }
  );

  ipcMain.handle("db:delete", (_e, table: string, id: string) => {
    if (!CRUD_TABLES.has(table)) throw new Error("Table not allowed: " + table);
    deleteRow(table, id);
    return { id };
  });

  // ---- Task completion (also drives XP) -----------------------------------
  ipcMain.handle("tasks:complete", (_e, id: string, xpAward: number) => {
    const task = getById("tasks", id) as any;
    if (!task) return null;

    const done = task.status !== "done";
    updateRow("tasks", id, {
      status: done ? "done" : "pending",
      completed_at: done ? nowIso() : null,
      updated_at: nowIso(),
    });

    if (done) addXp(xpAward, "task_complete");

    return readBack("tasks", id) ?? { id, status: done ? "done" : "pending" };
  });

  // ---- Habits: toggle a day + streak/heatmap -------------------------------
  ipcMain.handle("habits:toggleDay", (_e, habitId: string, date: string) => {
    const existing = getDb()
      .prepare("SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?")
      .get(habitId, date) as any;

    if (existing) {
      getDb().prepare("DELETE FROM habit_logs WHERE id = ?").run(existing.id);
      return { toggled: false };
    }

    const id = uuid();
    insertRow("habit_logs", { id, habit_id: habitId, date, done: 1 });
    addXp(5, "habit_check");
    return { toggled: true, row: readBack("habit_logs", id) };
  });

  ipcMain.handle("habits:heatmap", (_e, habitId: string) => {
    return getDb()
      .prepare(
        "SELECT date, done FROM habit_logs WHERE habit_id = ? ORDER BY date ASC"
      )
      .all(habitId);
  });

  // ---- Study sessions -------------------------------------------------------
  ipcMain.handle("study:start", (_e, subject: string) => {
    const id = uuid();
    insertRow("study_sessions", {
      id,
      subject,
      started_at: nowIso(),
      duration_seconds: 0,
    });
    return readBack("study_sessions", id) ?? { id };
  });

  ipcMain.handle(
    "study:stop",
    (_e, id: string, durationSeconds: number, note?: string) => {
      updateRow("study_sessions", id, {
        ended_at: nowIso(),
        duration_seconds: durationSeconds,
        note: note ?? null,
      });
      addXp(Math.min(30, Math.round(durationSeconds / 60)), "study_session");
      return readBack("study_sessions", id) ?? { id };
    }
  );

  // ---- XP / Level / Badges --------------------------------------------------
  function addXp(amount: number, reason: string) {
    getDb()
      .prepare(
        "INSERT INTO xp_log (id, amount, reason, created_at) VALUES (?,?,?,?)"
      )
      .run(uuid(), amount, reason, nowIso());

    const settings = getAllSettings();
    const total = parseInt(settings.xp_total || "0", 10) + amount;
    const level = Math.floor(total / 100) + 1;

    setSetting("xp_total", String(total));
    setSetting("level", String(level));

    checkBadges(total, level);
    mainWindow()?.webContents.send("xp:updated", { total, level });
  }

  function checkBadges(total: number, level: number) {
    const badgeDefs = [
      {
        key: "first_task",
        title: "اولین قدم",
        cond: () =>
          (getDb()
            .prepare("SELECT COUNT(*) c FROM tasks WHERE status='done'")
            .get() as any).c >= 1,
      },
      { key: "level_5", title: "Level 5", cond: () => level >= 5 },
      { key: "xp_500", title: "500 XP", cond: () => total >= 500 },
      {
        key: "habit_7",
        title: "هفت روز پیاپی",
        cond: () =>
          (getDb().prepare("SELECT COUNT(*) c FROM habit_logs").get() as any)
            .c >= 7,
      },
    ];

    for (const b of badgeDefs) {
      const existing = getDb()
        .prepare("SELECT * FROM badges WHERE key = ?")
        .get(b.key) as any;

      if (!existing) {
        insertRow("badges", {
          id: uuid(),
          key: b.key,
          title: b.title,
          description: "",
          icon: "🏅",
          unlocked_at: null,
        });
      }

      const row = getDb()
        .prepare("SELECT * FROM badges WHERE key = ?")
        .get(b.key) as any;

      if (row && !row.unlocked_at && b.cond()) {
        updateRow("badges", row.id, { unlocked_at: nowIso() });
        mainWindow()?.webContents.send("badge:unlocked", {
          key: b.key,
          title: b.title,
        });
      }
    }
  }

  ipcMain.handle("xp:addManual", (_e, amount: number, reason: string) => {
    addXp(amount, reason);
    return getAllSettings();
  });

  // ---- Settings ---------------------------------------------------------
  ipcMain.handle("settings:getAll", () => getAllSettings());

  ipcMain.handle("settings:set", (_e, key: string, value: string) => {
    setSetting(key, value);
    if (key === "autostart") {
      app.setLoginItemSettings({ openAtLogin: value === "1" });
    }
    return getAllSettings();
  });

  // ---- Notifications ------------------------------------------------------
  ipcMain.handle("notify:show", (_e, title: string, body: string) => {
    if (Notification.isSupported()) new Notification({ title, body }).show();
  });

  // ---- Report file export/import (.yaraav) --------------------------------
  ipcMain.handle(
    "report:save",
    async (_e, jsonPayload: string, suggestedName: string) => {
      const win = mainWindow();
      if (!win) return null;

      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: "خروجی گزارش Yaraav",
        defaultPath: suggestedName,
        filters: [{ name: "Yaraav Report", extensions: ["yaraav"] }],
      });
      if (canceled || !filePath) return null;

      fs.writeFileSync(filePath, jsonPayload, "utf-8");
      return filePath;
    }
  );

  ipcMain.handle(
    "report:saveBuffer",
    async (_e, base64: string, suggestedName: string, ext: string) => {
      const win = mainWindow();
      if (!win) return null;

      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: "خروجی فایل",
        defaultPath: suggestedName,
        filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
      });
      if (canceled || !filePath) return null;

      fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
      return filePath;
    }
  );

  ipcMain.handle("report:openFiles", async () => {
    const win = mainWindow();
    if (!win) return [];

    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: "بارگذاری گزارش",
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Yaraav Report", extensions: ["yaraav"] }],
    });
    if (canceled) return [];

    return filePaths.map((p) => ({
      path: p,
      content: fs.readFileSync(p, "utf-8"),
    }));
  });

  ipcMain.handle("report:readDropped", async (_e, filePath: string) => {
    return fs.readFileSync(filePath, "utf-8");
  });

  ipcMain.handle(
    "report:persist",
    (_e, reportDate: string, fileName: string, payload: string) => {
      const id = uuid();
      insertRow("reports", {
        id,
        report_date: reportDate,
        file_name: fileName,
        payload,
        created_at: nowIso(),
      });
      return readBack("reports", id) ?? { id };
    }
  );

  // ---- Backup ---------------------------------------------------------------
  ipcMain.handle("backup:export", async () => {
    const win = mainWindow();
    if (!win) return null;

    const { getDbPath } = await import("../db");
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "بکاپ کامل دیتابیس",
      defaultPath: `yaraav-backup-${Date.now()}.db`,
      filters: [{ name: "SQLite DB", extensions: ["db"] }],
    });
    if (canceled || !filePath) return null;

    fs.copyFileSync(getDbPath(), filePath);
    return filePath;
  });
}