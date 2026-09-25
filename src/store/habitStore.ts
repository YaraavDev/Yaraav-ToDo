import { create } from "zustand";

export interface Habit {
  id: string;
  name: string;
  frequency: "daily" | "weekly";
  target_days: number;
  color: string;
  created_at: string;
  archived: number;
}

interface HabitState {
  habits: Habit[];
  logs: Record<string, { date: string; done: number }[]>;
  fetchAll: () => Promise<void>;
  create: (name: string, frequency: "daily" | "weekly") => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleToday: (id: string) => Promise<void>;
  loadHeatmap: (id: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  logs: {},
  fetchAll: async () => {
    const rows = (await window.yaraav.db.list("habits", "archived = 0")) as Habit[];
    set({ habits: rows });
    for (const h of rows) await get().loadHeatmap(h.id);
  },
  create: async (name, frequency) => {
    await window.yaraav.db.create("habits", { name, frequency, target_days: frequency === "daily" ? 7 : 3, color: "#FFFFFF" });
    await get().fetchAll();
  },
  remove: async (id) => {
    await window.yaraav.db.delete("habits", id);
    await get().fetchAll();
  },
  toggleToday: async (id) => {
    const today = new Date().toISOString().slice(0, 10);
    await window.yaraav.habits.toggleDay(id, today);
    await get().loadHeatmap(id);
  },
  loadHeatmap: async (id) => {
    const data = await window.yaraav.habits.heatmap(id);
    set((s) => ({ logs: { ...s.logs, [id]: data } }));
  },
}));

export function calcStreak(logs: { date: string; done: number }[]): number {
  const set = new Set(logs.filter((l) => l.done).map((l) => l.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export function calcSuccessRate(logs: { date: string; done: number }[], days = 30): number {
  if (logs.length === 0) return 0;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const recent = logs.filter((l) => new Date(l.date) >= since && l.done);
  return Math.round((recent.length / days) * 100);
}
