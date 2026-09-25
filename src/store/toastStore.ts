import { create } from "zustand";

export interface ToastItem {
  id: string;
  message: string;
  variant?: "success" | "error" | "info";
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, variant?: ToastItem["variant"]) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant = "info") => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
