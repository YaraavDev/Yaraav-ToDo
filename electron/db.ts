import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { app } from "electron";

// ---------------------------------------------------------------------------
// Yaraav To Do — SQLite database layer (main process only)
// Fully offline. DB file lives in the OS user-data folder.
// ---------------------------------------------------------------------------

let db: Database.Database;

export function getDbPath(): string {
  const userData = app.getPath("userData");
  if (!fs.existsSync(userData)) fs.mkdirSync(userData, { recursive: true });
  return path.join(userData, "yaraav.db");
}

export function initDatabase(): Database.Database {
  const dbPath = getDbPath();
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // In dev, tsc compiles electron/*.ts to dist-electron/ but does not copy
  // .sql files, so we fall back to the source path. In production the file
  // is copied next to the compiled main.js via the package.json "files"/
  // electron-builder "extraResources"-equivalent copy step below.
  const devSchemaPath = path.join(__dirname, "../electron/schema.sql");
  const prodSchemaPath = path.join(__dirname, "schema.sql");
  const schemaPath = app.isPackaged
    ? prodSchemaPath
    : fs.existsSync(path.join(__dirname, "schema.sql"))
    ? path.join(__dirname, "schema.sql")
    : devSchemaPath;

  const schema = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schema);
  runMigrations();
  return db;
}

// Simple forward-only migration ledger for future schema changes.
function runMigrations() {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TEXT)`);
  const applied = new Set(
    (db.prepare("SELECT id FROM _migrations").all() as { id: string }[]).map((r) => r.id)
  );
  const migrations: { id: string; run: () => void }[] = [
    // Example future migration pattern:
    // { id: '2026-01-add-column-x', run: () => db.exec('ALTER TABLE tasks ADD COLUMN x TEXT') },
  ];
  for (const m of migrations) {
    if (!applied.has(m.id)) {
      m.run();
      db.prepare("INSERT INTO _migrations (id, applied_at) VALUES (?, ?)").run(m.id, new Date().toISOString());
    }
  }
}

export function getDb(): Database.Database {
  if (!db) throw new Error("Database not initialized");
  return db;
}

// ---------------------------------------------------------------------------
// Generic CRUD factory — keeps IPC handlers small & consistent per table.
// Only whitelisted tables/columns are reachable (see ipc/handlers.ts).
// ---------------------------------------------------------------------------
export function listAll(table: string, where?: string, params: any[] = []) {
  const sql = `SELECT * FROM ${table} ${where ? `WHERE ${where}` : ""} ORDER BY rowid DESC`;
  return getDb().prepare(sql).all(...params);
}

export function getById(table: string, id: string) {
  return getDb().prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
}

export function insertRow(table: string, row: Record<string, any>) {
  const cols = Object.keys(row);
  const placeholders = cols.map(() => "?").join(",");
  const sql = `INSERT INTO ${table} (${cols.join(",")}) VALUES (${placeholders})`;
  getDb().prepare(sql).run(...cols.map((c) => row[c]));
  return row;
}

export function updateRow(table: string, id: string, row: Record<string, any>) {
  const cols = Object.keys(row);
  const setClause = cols.map((c) => `${c} = ?`).join(",");
  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  getDb().prepare(sql).run(...cols.map((c) => row[c]), id);
  return { id, ...row };
}

export function deleteRow(table: string, id: string) {
  getDb().prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  return { id };
}

export function getSetting(key: string): string | undefined {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
