import { create } from "zustand";

type Lang = "fa" | "en";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  hydrate: () => Promise<void>;
}

export const useLangStore = create<LangState>((set, get) => ({
  lang: "fa",
  setLang: (l) => {
    set({ lang: l });
    window.yaraav.settings.set("lang", l);
  },
  toggle: () => get().setLang(get().lang === "fa" ? "en" : "fa"),
  hydrate: async () => {
    const settings = await window.yaraav.settings.getAll();
    set({ lang: (settings.lang as Lang) || "fa" });
  },
}));
