import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useT } from "@/i18n";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

interface Student {
  id: string;
  name: string;
  grade?: string;
  subject?: string;
}
interface Note {
  id: string;
  student_id: string;
  session_date: string;
  content: string;
  progress_score: number;
}

const COLORS = ["#FFFFFF", "#71767B", "#3B82F6", "#EF4444", "#22C55E", "#EAB308"];

export const Counselor: React.FC = () => {
  const { t } = useT();
  const [students, setStudents] = useState<Student[]>([]);
  const [notes, setNotes] = useState<Record<string, Note[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [noteForm, setNoteForm] = useState({ content: "", progress_score: 50 });

  async function loadAll() {
    const rows = (await window.yaraav.db.list("students")) as Student[];
    setStudents(rows);
    const notesMap: Record<string, Note[]> = {};
    for (const s of rows) {
      notesMap[s.id] = (await window.yaraav.db.list("notes", "student_id = ?", [s.id])) as Note[];
    }
    setNotes(notesMap);
    if (rows.length && !activeId) setActiveId(rows[0].id);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function addStudent() {
    if (!name.trim()) return;
    await window.yaraav.db.create("students", { name });
    setName("");
    await loadAll();
  }

  async function addNote() {
    if (!activeId || !noteForm.content.trim()) return;
    await window.yaraav.db.create("notes", {
      student_id: activeId,
      session_date: new Date().toISOString().slice(0, 10),
      content: noteForm.content,
      progress_score: noteForm.progress_score,
    });
    setNoteForm({ content: "", progress_score: 50 });
    await loadAll();
  }

  const active = students.find((s) => s.id === activeId);
  const activeNotes = activeId ? notes[activeId] || [] : [];

  const compareData = (() => {
    const dates = new Set<string>();
    students.forEach((s) => (notes[s.id] || []).forEach((n) => dates.add(n.session_date)));
    return Array.from(dates)
      .sort()
      .map((d) => {
        const row: any = { date: d };
        students.forEach((s) => {
          const n = (notes[s.id] || []).find((x) => x.session_date === d);
          if (n) row[s.name] = n.progress_score;
        });
        return row;
      });
  })();

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">{t("nav.counselor")}</h1>
        <Button variant="ghost" onClick={() => setCompareMode((c) => !c)}>
          {t("counselor.compare")}
        </Button>
      </div>

      {!compareMode ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1 space-y-3">
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("counselor.newStudent")}
                className="flex-1 px-3 py-2 rounded-pill bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-sm text-light-text dark:text-dark-text outline-none"
              />
              <Button onClick={addStudent}>+</Button>
            </div>
            <div className="space-y-1">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  className={`w-full text-start px-3 py-2 rounded-pill text-sm ${
                    activeId === s.id ? "bg-light-card dark:bg-dark-card font-bold" : "hover:bg-light-card dark:hover:bg-dark-card"
                  } text-light-text dark:text-dark-text`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </Card>

          <Card className="md:col-span-2">
            {!active ? (
              <EmptyState message={t("counselor.newStudent")} icon="📓" />
            ) : (
              <>
                <h3 className="font-bold mb-3 text-light-text dark:text-dark-text">{active.name}</h3>
                <div style={{ width: "100%", height: 180 }} className="mb-4">
                  <ResponsiveContainer>
                    <LineChart data={activeNotes.map((n) => ({ date: n.session_date.slice(5), score: n.progress_score }))}>
                      <XAxis dataKey="date" stroke="#71767B" fontSize={12} />
                      <YAxis stroke="#71767B" fontSize={12} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "#0F0F0F", border: "1px solid #1F1F1F", borderRadius: 8 }} />
                      <Line type="monotone" dataKey="score" stroke="#FFFFFF" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mb-4">
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                    placeholder={t("counselor.notes")}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-sm text-light-text dark:text-dark-text outline-none resize-none"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={noteForm.progress_score}
                      onChange={(e) => setNoteForm({ ...noteForm, progress_score: parseInt(e.target.value, 10) })}
                      className="flex-1"
                    />
                    <span className="text-sm w-10 text-light-text dark:text-dark-text">{noteForm.progress_score}%</span>
                    <Button onClick={addNote}>{t("common.save")}</Button>
                  </div>
                </div>

                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {activeNotes.map((n) => (
                    <li key={n.id} className="text-sm border-b border-light-border dark:border-dark-border pb-2">
                      <div className="flex justify-between text-xs text-light-subtext dark:text-dark-subtext mb-1">
                        <span>{n.session_date}</span>
                        <span>{n.progress_score}%</span>
                      </div>
                      <p className="text-light-text dark:text-dark-text">{n.content}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <h3 className="font-bold mb-3 text-light-text dark:text-dark-text">{t("counselor.compare")}</h3>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={compareData}>
                <XAxis dataKey="date" stroke="#71767B" fontSize={12} />
                <YAxis stroke="#71767B" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#0F0F0F", border: "1px solid #1F1F1F", borderRadius: 8 }} />
                <Legend />
                {students.map((s, i) => (
                  <Line key={s.id} type="monotone" dataKey={s.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
};
