import React, { useEffect, useState } from "react";
import { useT } from "@/i18n";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import { useGoalStore } from "@/store/goalStore";

export const Goals: React.FC = () => {
  const { t } = useT();
  const { goals, fetchAll, create, updateProgress, remove } = useGoalStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", term: "short" as "short" | "long", deadline: "" });

  useEffect(() => {
    fetchAll();
  }, []);

  async function save() {
    if (!form.title.trim()) return;
    await create(form);
    setForm({ title: "", description: "", term: "short", deadline: "" });
    setOpen(false);
  }

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">{t("nav.goals")}</h1>
        <Button onClick={() => setOpen(true)}>+ {t("goals.new")}</Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState message={t("empty.goals")} icon="🎯" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => (
            <Card key={g.id}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-light-text dark:text-dark-text">{g.title}</h3>
                <button onClick={() => remove(g.id)} className="text-light-subtext dark:text-dark-subtext hover:text-red-500">
                  🗑
                </button>
              </div>
              <p className="text-xs text-light-subtext dark:text-dark-subtext mb-2">
                {g.term === "short" ? t("goals.short") : t("goals.long")} {g.deadline ? `· ${g.deadline}` : ""}
              </p>
              {g.description && <p className="text-sm text-light-text dark:text-dark-text mb-3">{g.description}</p>}
              <ProgressBar value={g.progress} className="mb-2" />
              <input
                type="range"
                min={0}
                max={100}
                value={g.progress}
                onChange={(e) => updateProgress(g.id, parseInt(e.target.value, 10))}
                className="w-full"
              />
              <p className="text-xs text-right text-light-subtext dark:text-dark-subtext">{g.progress}%</p>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("goals.new")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={save}>{t("common.save")}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <input
            autoFocus
            placeholder={t("common.title")}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text outline-none"
          />
          <textarea
            placeholder={t("common.description")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text outline-none resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value as any })}
              className="px-3 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
            >
              <option value="short">{t("goals.short")}</option>
              <option value="long">{t("goals.long")}</option>
            </select>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="px-3 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
