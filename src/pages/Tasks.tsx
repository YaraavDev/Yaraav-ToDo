import React, { useEffect, useMemo, useState } from "react";
import { useT } from "@/i18n";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";
import { Pomodoro } from "@/components/Pomodoro";
import { Task, useTaskStore } from "@/store/taskStore";
import { useToastStore } from "@/store/toastStore";

const PRIORITY_COLOR: Record<Task["priority"], string> = {
  low: "bg-emerald-500/20 text-emerald-500",
  medium: "bg-sky-500/20 text-sky-500",
  high: "bg-amber-500/20 text-amber-500",
  critical: "bg-red-500/20 text-red-500",
};

export const Tasks: React.FC = () => {
  const { t } = useT();
  const { tasks, fetchAll, create, update, remove, toggleComplete } = useTaskStore();
  const push = useToastStore((s) => s.push);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [query, setQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [dragId, setDragId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    due_date: "",
    due_time: "",
    repeat_rule: "none",
    category: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const visibleTasks = useMemo(() => {
    return tasks
      .filter((tk) => tk.status !== "archived")
      .filter((tk) => (filterPriority === "all" ? true : tk.priority === filterPriority))
      .filter((tk) => tk.title.toLowerCase().includes(query.toLowerCase()));
  }, [tasks, query, filterPriority]);

  function openNew() {
    setEditing(null);
    setForm({ title: "", description: "", priority: "medium", due_date: "", due_time: "", repeat_rule: "none", category: "" });
    setModalOpen(true);
  }

  function openEdit(tk: Task) {
    setEditing(tk);
    setForm({
      title: tk.title,
      description: tk.description ?? "",
      priority: tk.priority,
      due_date: tk.due_date ?? "",
      due_time: tk.due_time ?? "",
      repeat_rule: tk.repeat_rule ?? "none",
      category: tk.category ?? "",
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.title.trim()) return;
    if (editing) {
      await update(editing.id, form);
    } else {
      await create(form);
    }
    push(t("toast.taskSaved"), "success");
    setModalOpen(false);
  }

  async function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = visibleTasks.map((t2) => t2.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await Promise.all(ids.map((id, idx) => update(id, { order_index: idx } as any)));
    setDragId(null);
  }

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">{t("nav.tasks")}</h1>
        <Button onClick={openNew}>+ {t("tasks.new")}</Button>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-light-text dark:text-dark-text">{t("tasks.pomodoro")}</span>
        </div>
        <Pomodoro />
      </Card>

      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.search")}
          className="flex-1 min-w-[180px] px-4 py-2 rounded-pill bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-sm text-light-text dark:text-dark-text outline-none"
        />
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 rounded-pill bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-sm text-light-text dark:text-dark-text outline-none"
        >
          <option value="all">{t("common.priority")}: All</option>
          {(["low", "medium", "high", "critical"] as const).map((p) => (
            <option key={p} value={p}>
              {t(`common.${p}`)}
            </option>
          ))}
        </select>
      </div>

      {visibleTasks.length === 0 ? (
        <EmptyState message={t("empty.tasks")} icon="✅" />
      ) : (
        <div className="space-y-2">
          {visibleTasks.map((tk) => (
            <Card
              key={tk.id}
              draggable
              onDragStart={() => setDragId(tk.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(tk.id)}
              className="flex items-center gap-3 cursor-grab"
            >
              <button
                onClick={() => toggleComplete(tk.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                  ${tk.status === "done" ? "bg-light-accent dark:bg-dark-accent border-light-accent dark:border-dark-accent" : "border-light-border dark:border-dark-border"}`}
              >
                {tk.status === "done" && <span className="text-light-bg dark:text-dark-bg text-xs">✓</span>}
              </button>

              <div className="flex-1 min-w-0" onClick={() => openEdit(tk)}>
                <p className={`text-sm font-medium truncate ${tk.status === "done" ? "line-through text-light-subtext dark:text-dark-subtext" : "text-light-text dark:text-dark-text"}`}>
                  {tk.title}
                </p>
                {(tk.due_date || tk.category) && (
                  <p className="text-xs text-light-subtext dark:text-dark-subtext mt-0.5">
                    {tk.due_date} {tk.due_time} {tk.category ? `· ${tk.category}` : ""}
                  </p>
                )}
              </div>

              <span className={`text-xs px-2 py-1 rounded-pill font-medium ${PRIORITY_COLOR[tk.priority]}`}>{t(`common.${tk.priority}`)}</span>
              <button onClick={() => remove(tk.id)} className="text-light-subtext dark:text-dark-subtext hover:text-red-500 px-1">
                🗑
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t("common.edit") : t("tasks.new")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
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
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
              className="px-3 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
            >
              {(["low", "medium", "high", "critical"] as const).map((p) => (
                <option key={p} value={p}>
                  {t(`common.${p}`)}
                </option>
              ))}
            </select>
            <select
              value={form.repeat_rule}
              onChange={(e) => setForm({ ...form, repeat_rule: e.target.value })}
              className="px-3 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
            >
              <option value="none">{t("common.none")}</option>
              <option value="daily">{t("common.daily")}</option>
              <option value="weekly">{t("common.weekly")}</option>
              <option value="monthly">{t("common.monthly")}</option>
              <option value="custom">{t("common.custom")}</option>
            </select>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="px-3 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
            />
            <input
              type="time"
              value={form.due_time}
              onChange={(e) => setForm({ ...form, due_time: e.target.value })}
              className="px-3 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text"
            />
          </div>
          <input
            placeholder={t("common.category")}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text outline-none"
          />
        </div>
      </Modal>
    </div>
  );
};
