import React, { useEffect } from "react";
import { useT } from "@/i18n";
import { Card } from "@/components/Card";
import { ProgressBar } from "@/components/ProgressBar";
import { useTaskStore } from "@/store/taskStore";
import { useHabitStore, calcStreak } from "@/store/habitStore";
import { useGoalStore } from "@/store/goalStore";
import { useXpStore, xpForNextLevel } from "@/store/xpStore";

export const Dashboard: React.FC = () => {
  const { t } = useT();
  const { tasks, fetchAll: fetchTasks } = useTaskStore();
  const { habits, logs, fetchAll: fetchHabits } = useHabitStore();
  const { goals, fetchAll: fetchGoals } = useGoalStore();
  const { total, level, hydrate } = useXpStore();

  useEffect(() => {
    fetchTasks();
    fetchHabits();
    fetchGoals();
    hydrate();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter((tk) => tk.due_date === today && tk.status !== "archived");
  const doneToday = todayTasks.filter((tk) => tk.status === "done").length;
  const activeGoals = goals.filter((g) => g.status === "active");
  const nextLevelXp = xpForNextLevel(level);
  const levelProgress = ((total % 100) / 100) * 100;

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">{t("dashboard.welcome")} 👋</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-light-subtext dark:text-dark-subtext mb-1">{t("dashboard.level")}</p>
          <p className="text-2xl font-bold text-light-text dark:text-dark-text">{level}</p>
          <ProgressBar value={levelProgress} className="mt-2" />
        </Card>
        <Card>
          <p className="text-xs text-light-subtext dark:text-dark-subtext mb-1">{t("dashboard.xp")}</p>
          <p className="text-2xl font-bold text-light-text dark:text-dark-text">{total} XP</p>
          <p className="text-xs text-light-subtext dark:text-dark-subtext mt-2">{nextLevelXp} XP → Level {level + 1}</p>
        </Card>
        <Card>
          <p className="text-xs text-light-subtext dark:text-dark-subtext mb-1">{t("dashboard.tasksToday")}</p>
          <p className="text-2xl font-bold text-light-text dark:text-dark-text">{doneToday}/{todayTasks.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-light-subtext dark:text-dark-subtext mb-1">{t("dashboard.habitsToday")}</p>
          <p className="text-2xl font-bold text-light-text dark:text-dark-text">{habits.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-bold mb-3 text-light-text dark:text-dark-text">{t("nav.tasks")}</h3>
          {todayTasks.length === 0 && <p className="text-sm text-light-subtext dark:text-dark-subtext">{t("common.empty")}</p>}
          <ul className="space-y-2">
            {todayTasks.slice(0, 5).map((tk) => (
              <li key={tk.id} className="flex items-center justify-between text-sm">
                <span className={tk.status === "done" ? "line-through text-light-subtext dark:text-dark-subtext" : "text-light-text dark:text-dark-text"}>
                  {tk.title}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-pill bg-light-border dark:bg-dark-border">{t(`common.${tk.priority}`)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-bold mb-3 text-light-text dark:text-dark-text">{t("nav.habits")}</h3>
          {habits.length === 0 && <p className="text-sm text-light-subtext dark:text-dark-subtext">{t("empty.habits")}</p>}
          <ul className="space-y-2">
            {habits.slice(0, 5).map((h) => (
              <li key={h.id} className="flex items-center justify-between text-sm">
                <span className="text-light-text dark:text-dark-text">{h.name}</span>
                <span className="text-xs text-light-subtext dark:text-dark-subtext">🔥 {calcStreak(logs[h.id] || [])}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold mb-3 text-light-text dark:text-dark-text">{t("nav.goals")}</h3>
        {activeGoals.length === 0 && <p className="text-sm text-light-subtext dark:text-dark-subtext">{t("empty.goals")}</p>}
        <div className="space-y-3">
          {activeGoals.slice(0, 4).map((g) => (
            <div key={g.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-light-text dark:text-dark-text">{g.title}</span>
                <span className="text-light-subtext dark:text-dark-subtext">{g.progress}%</span>
              </div>
              <ProgressBar value={g.progress} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
