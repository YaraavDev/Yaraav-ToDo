import React from "react";
import { useT } from "@/i18n";
import { useThemeStore } from "@/store/themeStore";
import { useLangStore } from "@/store/langStore";
import { ThemeToggle } from "./ThemeToggle";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";

export type PageKey =
  | "dashboard"
  | "tasks"
  | "habits"
  | "goals"
  | "study"
  | "counselor"
  | "reports"
  | "settings";

const NAV: { key: PageKey; icon: string; labelKey: string }[] = [
  { key: "dashboard", icon: "🏠", labelKey: "nav.dashboard" },
  { key: "tasks", icon: "✅", labelKey: "nav.tasks" },
  { key: "habits", icon: "🔥", labelKey: "nav.habits" },
  { key: "goals", icon: "🎯", labelKey: "nav.goals" },
  { key: "study", icon: "⏱️", labelKey: "nav.study" },
  { key: "counselor", icon: "📓", labelKey: "nav.counselor" },
  { key: "reports", icon: "📊", labelKey: "nav.reports" },
  { key: "settings", icon: "⚙️", labelKey: "nav.settings" },
];

interface SidebarProps {
  active: PageKey;
  onNavigate: (p: PageKey) => void;
  onExportReport: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate, onExportReport }) => {
  const { t } = useT();
  const theme = useThemeStore((s) => s.theme);
  const { lang, toggle: toggleLang } = useLangStore();
  const logo = theme === "dark" ? logoLight : logoDark;

  return (
    <aside className="w-60 shrink-0 h-full border-e border-light-border dark:border-dark-border flex flex-col py-4 px-3 bg-light-bg dark:bg-dark-bg">
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Yaraav" className="w-8 h-8" />
          <span className="font-bold text-light-text dark:text-dark-text">{t("app.name")}</span>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-pill text-sm font-medium transition-colors text-start
              ${
                active === item.key
                  ? "bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text font-bold"
                  : "text-light-subtext dark:text-dark-subtext hover:bg-light-card dark:hover:bg-dark-card"
              }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={onExportReport}
        className="mt-4 w-full py-2.5 rounded-pill bg-light-accent text-light-bg dark:bg-dark-accent dark:text-dark-bg font-bold text-sm hover:opacity-90 transition-opacity"
      >
        {t("nav.exportReport")}
      </button>

      <button
        onClick={toggleLang}
        className="mt-3 text-xs text-light-subtext dark:text-dark-subtext hover:underline self-center"
      >
        {lang === "fa" ? "English" : "فارسی"}
      </button>
    </aside>
  );
};
