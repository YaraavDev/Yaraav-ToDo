import React, { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Heatmap } from "@/components/Heatmap";
import { calcStreak, calcSuccessRate, useHabitStore } from "@/store/habitStore";

export const Habits: React.FC = () => {
  const { t } = useT();
  const { habits, logs, fetchAll, create, remove, toggleToday } = useHabitStore();
  const [name, setName] = useState("");
  const [freq, setFreq] = useState<"daily" | "weekly">("daily");

  useEffect(() => {
    fetchAll();
  }, []);

  async function add() {
    if (!name.trim()) return;
    await create(name, freq);
    setName("");
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">{t("nav.habits")}</h1>

      <Card className="flex flex-wrap gap-2 items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("habits.new")}
          className="flex-1 min-w-[160px] px-4 py-2 rounded-pill bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-sm text-light-text dark:text-dark-text outline-none"
        />
        <select
          value={freq}
          onChange={(e) => setFreq(e.target.value as any)}
          className="px-3 py-2 rounded-pill bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-sm text-light-text dark:text-dark-text"
        >
          <option value="daily">{t("common.daily")}</option>
          <option value="weekly">{t("common.weekly")}</option>
        </select>
        <Button onClick={add}>+ {t("common.add")}</Button>
      </Card>

      {habits.length === 0 ? (
        <EmptyState message={t("empty.habits")} icon="🔥" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.map((h) => {
            const hLogs = logs[h.id] || [];
            const streak = calcStreak(hLogs);
            const rate = calcSuccessRate(hLogs);
            const doneToday = hLogs.some((l) => l.date === today && l.done);
            return (
              <Card key={h.id}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-light-text dark:text-dark-text">{h.name}</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => remove(h.id)} className="text-light-subtext dark:text-dark-subtext hover:text-red-500">
                      🗑
                    </button>
                    <button
                      onClick={() => toggleToday(h.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                        doneToday ? "bg-light-accent dark:bg-dark-accent border-light-accent dark:border-dark-accent" : "border-light-border dark:border-dark-border"
                      }`}
                    >
                      {doneToday && <span className="text-light-bg dark:text-dark-bg text-xs">✓</span>}
                    </button>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-light-subtext dark:text-dark-subtext mb-3">
                  <span>🔥 {streak} {t("habits.streak")}</span>
                  <span>📈 {rate}% {t("habits.successRate")}</span>
                </div>
                <Heatmap logs={hLogs} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
