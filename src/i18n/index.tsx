import React, { createContext, useContext, useMemo } from "react";
import fa from "./fa.json";
import en from "./en.json";
import { useLangStore } from "@/store/langStore";

type Dict = Record<string, string>;
const dicts: Record<"fa" | "en", Dict> = { fa, en };

interface I18nCtx {
  t: (key: string) => string;
  lang: "fa" | "en";
  dir: "rtl" | "ltr";
}

const Ctx = createContext<I18nCtx>({ t: (k) => k, lang: "fa", dir: "rtl" });

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lang = useLangStore((s) => s.lang);
  const dict = dicts[lang];
  const value = useMemo<I18nCtx>(
    () => ({
      t: (key: string) => dict[key] ?? key,
      lang,
      dir: lang === "fa" ? "rtl" : "ltr",
    }),
    [lang, dict]
  );

  return (
    <Ctx.Provider value={value}>
      <div dir={value.dir} className={lang === "fa" ? "font-fa" : "font-en"}>
        {children}
      </div>
    </Ctx.Provider>
  );
};

export const useT = () => useContext(Ctx);
