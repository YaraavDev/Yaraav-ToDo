import { create } from "zustand";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  term: "short" | "long";
  deadline?: string;
  progress: number;
  status: "active" | "done" | "overdue";
  created_at: string;
}

interface GoalState {
  goals: Goal[];
  fetchAll: () => Promise<void>;
  create: (g: Partial<Goal>) => Promise<void>;
  updateProgress: (id: string, progress: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  fetchAll: async () => {
    const rows = (await window.yaraav.db.list("goals")) as Goal[];
    set({ goals: rows });
  },
  create: async (g) => {
    await window.yaraav.db.create("goals", {
      title: g.title,
      description: g.description ?? "",
      term: g.term ?? "short",
      deadline: g.deadline ?? null,
      progress: 0,
      status: "active",
    });
    await get().fetchAll();
  },
  updateProgress: async (id, progress) => {
    const status = progress >= 100 ? "done" : "active";
    await window.yaraav.db.update("goals", id, { progress, status });
    await get().fetchAll();
  },
  remove: async (id) => {
    await window.yaraav.db.delete("goals", id);
    await get().fetchAll();
  },
}));
