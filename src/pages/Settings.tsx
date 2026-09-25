import React, { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLangStore } from "@/store/langStore";
import { useToastStore } from "@/store/toastStore";

export const Settings: React.FC = () => {
  const { t } = useT();
  const { lang, toggle: toggleLang } = useLangStore();
  const push = useToastStore((s) => s.push);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    window.yaraav.settings.getAll().then(setSettings);
  }, []);

  async function updateSetting(key: string, value: string) {
    const s = await window.yaraav.settings.set(key, value);
    setSettings(s);
  }

  async function backup() {
    const path = await window.yaraav.backup.export();
    if (path) push(t("toast.backupDone"), "success");
  }

  return (
    <div className="p-6 space-y-5 animate-fadeIn max-w-2xl">
      <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">{t("nav.settings")}</h1>

      <Card className="space-y-4">
        <Row label={t("settings.theme")}>
          <ThemeToggle />
        </Row>
        <Row label={t("settings.language")}>
          <Button variant="ghost" onClick={toggleLang}>
            {lang === "fa" ? "فارسی → English" : "English → فارسی"}
          </Button>
        </Row>
        <Row label={t("settings.autostart")}>
          <input
            type="checkbox"
            checked={settings.autostart === "1"}
            onChange={(e) => updateSetting("autostart", e.target.checked ? "1" : "0")}
            className="w-5 h-5"
          />
        </Row>
        <Row label={t("settings.encryption")}>
          <input
            type="checkbox"
            checked={settings.report_encryption === "1"}
            onChange={(e) => updateSetting("report_encryption", e.target.checked ? "1" : "0")}
            className="w-5 h-5"
          />
        </Row>
        <Row label={t("settings.backup")}>
          <Button variant="ghost" onClick={backup}>
            {t("settings.backup")}
          </Button>
        </Row>
      </Card>

      <Card>
        <h3 className="font-bold mb-3 text-light-text dark:text-dark-text">{t("settings.shortcuts")}</h3>
        <ul className="text-sm text-light-subtext dark:text-dark-subtext space-y-1">
          <li><kbd className="px-1.5 py-0.5 bg-light-border dark:bg-dark-border rounded">Ctrl+N</kbd> — {t("tasks.new")}</li>
          <li><kbd className="px-1.5 py-0.5 bg-light-border dark:bg-dark-border rounded">Ctrl+F</kbd> — {t("common.search")}</li>
          <li><kbd className="px-1.5 py-0.5 bg-light-border dark:bg-dark-border rounded">Ctrl+D</kbd> — {t("settings.theme")}</li>
        </ul>
      </Card>
    </div>
  );
};

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-light-text dark:text-dark-text">{label}</span>
    {children}
  </div>
);
