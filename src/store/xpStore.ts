import { create } from "zustand";

interface XpState {
  total: number;
  level: number;
  badges: any[];
  hydrate: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  listen: () => void;
}

export const useXpStore = create<XpState>((set, get) => ({
  total: 0,
  level: 1,
  badges: [],
  hydrate: async () => {
    const settings = await window.yaraav.settings.getAll();
    set({ total: parseInt(settings.xp_total || "0", 10), level: parseInt(settings.level || "1", 10) });
  },
  fetchBadges: async () => {
    const rows = await window.yaraav.db.list("badges");
    set({ badges: rows });
  },
  listen: () => {
    window.yaraav.xp.onUpdated(({ total, level }) => set({ total, level }));
    window.yaraav.xp.onBadgeUnlocked(() => get().fetchBadges());
  },
}));

export function xpForNextLevel(level: number): number {
  return level * 100;
}
