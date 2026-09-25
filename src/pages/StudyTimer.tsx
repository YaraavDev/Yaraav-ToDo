import React, { useEffect, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useT } from "@/i18n";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

interface Session {
  id: string;
  subject: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
}

export const StudyTimer: React.FC = () => {
  const { t } = useT();
  const [subject, setSubject] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadSessions() {
    const rows = (await window.yaraav.db.list("study_sessions")) as Session[];
    setSessions(rows);
  }

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  async function start() {
    const { id } = await window.yaraav.study.start(subject || "General");
    setSessionId(id);
    setSeconds(0);
    setRunning(true);
  }

  async function stop() {
    if (!sessionId) return;
    setRunning(false);
    await window.yaraav.study.stop(sessionId, seconds);
    setSessionId(null);
    setSeconds(0);
    await loadSessions();
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const byDay: Record<string, number> = {};
  for (const s of sessions) {
    const day = s.started_at.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + Math.round((s.duration_seconds || 0) / 60);
  }
  const chartData = Object.entries(byDay)
    .slice(-14)
    .map(([day, minutes]) => ({ day: day.slice(5), minutes }));

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">{t("nav.study")}</h1>

      <Card className="flex flex-col items-center gap-4 py-10">
        <input
          disabled={running}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("study.subject")}
          className="px-4 py-2 rounded-pill bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-sm text-light-text dark:text-dark-text outline-none text-center"
        />
        <div className="text-5xl font-mono font-bold text-light-text dark:text-dark-text tabular-nums">
          {mm}:{ss}
        </div>
        <div className="flex gap-3">
          {!running ? (
            <Button onClick={start}>{t("study.start")}</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setRunning(false)}>
                {t("study.pause")}
              </Button>
              <Button variant="danger" onClick={stop}>
                {t("study.stop")}
              </Button>
            </>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold mb-3 text-light-text dark:text-dark-text">📈 {t("dashboard.studyToday")}</h3>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="day" stroke="#71767B" fontSize={12} />
              <YAxis stroke="#71767B" fontSize={12} />
              <Tooltip contentStyle={{ background: "#0F0F0F", border: "1px solid #1F1F1F", borderRadius: 8 }} />
              <Bar dataKey="minutes" fill="#71767B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};
