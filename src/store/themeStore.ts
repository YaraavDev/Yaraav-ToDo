import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  setTheme: (t) => {
    set({ theme: t });
    document.documentElement.classList.toggle("dark", t === "dark");
    window.yaraav.settings.set("theme", t);
  },
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
  hydrate: async () => {
    const settings = await window.yaraav.settings.getAll();
    const t = (settings.theme as Theme) || "dark";
    set({ theme: t });
    document.documentElement.classList.toggle("dark", t === "dark");
  },
}));
