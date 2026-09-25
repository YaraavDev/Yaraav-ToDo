import { create } from "zustand";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "done" | "archived";
  due_date?: string;
  due_time?: string;
  repeat_rule?: string;
  category?: string;
  order_index?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

const XP_BY_PRIORITY: Record<Task["priority"], number> = {
  low: 5,
  medium: 10,
  high: 15,
  critical: 25,
};

interface TaskState {
  tasks: Task[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  create: (t: Partial<Task>) => Promise<void>;
  update: (id: string, t: Partial<Task>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  archive: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  fetchAll: async () => {
    set({ loading: true });
    const rows = (await window.yaraav.db.list("tasks")) as Task[];
    set({ tasks: rows, loading: false });
  },
  create: async (t) => {
    await window.yaraav.db.create("tasks", {
      title: t.title,
      description: t.description ?? "",
      priority: t.priority ?? "medium",
      status: "pending",
      due_date: t.due_date ?? null,
      due_time: t.due_time ?? null,
      repeat_rule: t.repeat_rule ?? "none",
      category: t.category ?? null,
      order_index: get().tasks.length,
    });
    await get().fetchAll();
  },
  update: async (id, t) => {
    await window.yaraav.db.update("tasks", id, t);
    await get().fetchAll();
  },
  remove: async (id) => {
    await window.yaraav.db.delete("tasks", id);
    await get().fetchAll();
  },
  toggleComplete: async (id) => {
    const task = get().tasks.find((x) => x.id === id);
    const xp = task ? XP_BY_PRIORITY[task.priority] : 10;
    await window.yaraav.tasks.complete(id, xp);
    await get().fetchAll();
  },
  archive: async (id) => {
    await window.yaraav.db.update("tasks", id, { status: "archived" });
    await get().fetchAll();
  },
}));
