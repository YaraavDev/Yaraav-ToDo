export {};

interface YaraavApi {
  db: {
    list: (table: string, where?: string, params?: any[]) => Promise<any[]>;
    get: (table: string, id: string) => Promise<any>;
    create: (table: string, row: Record<string, any>) => Promise<any>;
    update: (table: string, id: string, row: Record<string, any>) => Promise<any>;
    delete: (table: string, id: string) => Promise<any>;
  };
  tasks: {
    complete: (id: string, xpAward: number) => Promise<{ id: string; status: string } | null>;
  };
  habits: {
    toggleDay: (habitId: string, date: string) => Promise<{ toggled: boolean }>;
    heatmap: (habitId: string) => Promise<{ date: string; done: number }[]>;
  };
  study: {
    start: (subject: string) => Promise<{ id: string }>;
    stop: (id: string, durationSeconds: number, note?: string) => Promise<{ id: string }>;
  };
  xp: {
    addManual: (amount: number, reason: string) => Promise<Record<string, string>>;
    onUpdated: (cb: (data: { total: number; level: number }) => void) => void;
    onBadgeUnlocked: (cb: (data: { key: string; title: string }) => void) => void;
  };
  settings: {
    getAll: () => Promise<Record<string, string>>;
    set: (key: string, value: string) => Promise<Record<string, string>>;
  };
  notify: {
    show: (title: string, body: string) => Promise<void>;
  };
  report: {
    save: (json: string, name: string) => Promise<string | null>;
    saveBuffer: (base64: string, name: string, ext: string) => Promise<string | null>;
    openFiles: () => Promise<{ path: string; content: string }[]>;
    readDropped: (filePath: string) => Promise<string>;
    persist: (date: string, name: string, payload: string) => Promise<void>;
  };
  backup: {
    export: () => Promise<string | null>;
  };
}

declare global {
  interface Window {
    yaraav: YaraavApi;
  }
}
