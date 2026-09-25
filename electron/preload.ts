import { contextBridge, ipcRenderer } from "electron";

// Everything the renderer is allowed to call. contextIsolation is ON,
// nodeIntegration is OFF — this is the only bridge into Node/Electron APIs.
const api = {
  db: {
    list: (table: string, where?: string, params?: any[]) => ipcRenderer.invoke("db:list", table, where, params),
    get: (table: string, id: string) => ipcRenderer.invoke("db:get", table, id),
    create: (table: string, row: Record<string, any>) => ipcRenderer.invoke("db:create", table, row),
    update: (table: string, id: string, row: Record<string, any>) => ipcRenderer.invoke("db:update", table, id, row),
    delete: (table: string, id: string) => ipcRenderer.invoke("db:delete", table, id),
  },
  tasks: {
    complete: (id: string, xpAward: number) => ipcRenderer.invoke("tasks:complete", id, xpAward),
  },
  habits: {
    toggleDay: (habitId: string, date: string) => ipcRenderer.invoke("habits:toggleDay", habitId, date),
    heatmap: (habitId: string) => ipcRenderer.invoke("habits:heatmap", habitId),
  },
  study: {
    start: (subject: string) => ipcRenderer.invoke("study:start", subject),
    stop: (id: string, durationSeconds: number, note?: string) => ipcRenderer.invoke("study:stop", id, durationSeconds, note),
  },
  xp: {
    addManual: (amount: number, reason: string) => ipcRenderer.invoke("xp:addManual", amount, reason),
    onUpdated: (cb: (data: { total: number; level: number }) => void) => {
      ipcRenderer.on("xp:updated", (_e, data) => cb(data));
    },
    onBadgeUnlocked: (cb: (data: { key: string; title: string }) => void) => {
      ipcRenderer.on("badge:unlocked", (_e, data) => cb(data));
    },
  },
  settings: {
    getAll: () => ipcRenderer.invoke("settings:getAll"),
    set: (key: string, value: string) => ipcRenderer.invoke("settings:set", key, value),
  },
  notify: {
    show: (title: string, body: string) => ipcRenderer.invoke("notify:show", title, body),
  },
  report: {
    save: (json: string, name: string) => ipcRenderer.invoke("report:save", json, name),
    saveBuffer: (base64: string, name: string, ext: string) => ipcRenderer.invoke("report:saveBuffer", base64, name, ext),
    openFiles: () => ipcRenderer.invoke("report:openFiles"),
    readDropped: (filePath: string) => ipcRenderer.invoke("report:readDropped", filePath),
    persist: (date: string, name: string, payload: string) => ipcRenderer.invoke("report:persist", date, name, payload),
  },
  backup: {
    export: () => ipcRenderer.invoke("backup:export"),
  },
};

contextBridge.exposeInMainWorld("yaraav", api);

export type YaraavApi = typeof api;
