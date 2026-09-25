import React, { useRef, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useT } from "@/i18n";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useToastStore } from "@/store/toastStore";
import {
  DailyReport,
  analyzeReport,
  buildDailyReport,
  deserializeReport,
  reportToPlainText,
  serializeReport,
  suggestedFileName,
} from "@/utils/report";

const COLORS = ["#22C55E", "#EF4444"];

export const ReportViewer: React.FC = () => {
  const { t } = useT();
  const push = useToastStore((s) => s.push);
  const reportRef = useRef<HTMLDivElement>(null);

  const [exportDate, setExportDate] = useState(new Date().toISOString().slice(0, 10));
  const [encrypt, setEncrypt] = useState(false);
  const [loaded, setLoaded] = useState<DailyReport[]>([]);
  const [dragOver, setDragOver] = useState(false);

  async function exportToday() {
    const report = await buildDailyReport(exportDate);
    const json = serializeReport(report, encrypt);
    const path = await window.yaraav.report.save(json, suggestedFileName(exportDate));
    if (path) {
      await window.yaraav.report.persist(exportDate, suggestedFileName(exportDate), json);
      push(t("toast.reportExported"), "success");
    }
  }

  async function pickFiles() {
    const files = await window.yaraav.report.openFiles();
    if (!files.length) return;
    try {
      const parsed = files.map((f) => deserializeReport(f.content));
      setLoaded(parsed);
      push(t("toast.reportImported"), "success");
    } catch (e: any) {
      push(e.message || "خطا در خواندن فایل", "error");
    }
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".yaraav"));
    if (!files.length) return;
    try {
      const texts = await Promise.all(
        files.map(
          (f) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsText(f);
            })
        )
      );
      const parsed = texts.map((txt) => deserializeReport(txt));
      setLoaded(parsed);
      push(t("toast.reportImported"), "success");
    } catch (err: any) {
      push(err.message || "خطا در خواندن فایل", "error");
    }
  }

  async function exportPdf() {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { backgroundColor: "#000000", scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    const base64 = pdf.output("datauristring").split(",")[1];
    const path = await window.yaraav.report.saveBuffer(base64, `yaraav-report-${loaded[0]?.date || "export"}.pdf`, "pdf");
    if (path) push(t("toast.reportExported"), "success");
  }

  async function exportPng() {
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, { backgroundColor: "#000000", scale: 2 });
    const base64 = canvas.toDataURL("image/png").split(",")[1];
    const path = await window.yaraav.report.saveBuffer(base64, `yaraav-report-${loaded[0]?.date || "export"}.png`, "png");
    if (path) push(t("toast.reportExported"), "success");
  }

  function copyPlainText() {
    if (!loaded.length) return;
    const text = loaded.map(reportToPlainText).join("\n\n" + "=".repeat(40) + "\n\n");
    navigator.clipboard.writeText(text);
    push("متن کپی شد ✅", "success");
  }

  const single = loaded.length === 1 ? loaded[0] : null;
  const compareMode = loaded.length > 1;

  return (
    <div className="p-6 space-y-5 animate-fadeIn">
      <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">{t("nav.reports")}</h1>

      {/* Export section */}
      <Card>
        <h3 className="font-bold mb-3 text-light-text dark:text-dark-text">{t("reports.exportDay")}</h3>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={exportDate}
            onChange={(e) => setExportDate(e.target.value)}
            className="px-3 py-2 rounded-pill bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-sm text-light-text dark:text-dark-text"
          />
          <label className="flex items-center gap-2 text-sm text-light-text dark:text-dark-text">
            <input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} />
            {t("settings.encryption")}
          </label>
          <Button onClick={exportToday}>{t("reports.exportDay")}</Button>
        </div>
      </Card>

      {/* Import section */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={pickFiles}
        className={`cursor-pointer border-dashed text-center py-10 transition-colors ${dragOver ? "border-light-accent dark:border-dark-accent" : ""}`}
      >
        <p className="text-3xl mb-2">📥</p>
        <p className="text-sm text-light-subtext dark:text-dark-subtext">{t("reports.dropHere")}</p>
      </Card>

      {loaded.length === 0 && <EmptyState message={t("empty.reports")} icon="📊" />}

      {(single || compareMode) && (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={exportPdf}>
            {t("reports.exportPdf")}
          </Button>
          <Button variant="ghost" onClick={exportPng}>
            {t("reports.exportPng")}
          </Button>
          <Button variant="ghost" onClick={copyPlainText}>
            {t("reports.copyText")}
          </Button>
        </div>
      )}

      {single && (
        <div ref={reportRef} className="bg-dark-bg p-6 rounded-card space-y-5">
          <ReportHeader report={single} />
          <ReportBody report={single} />
        </div>
      )}

      {compareMode && (
        <div ref={reportRef} className="bg-dark-bg p-6 rounded-card space-y-5">
          <h2 className="text-xl font-bold text-dark-text">{t("reports.counselorMode")}</h2>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={loaded.map((r) => ({ date: r.date, [r.userName]: r.chart.tasksCompletedPct }))}>
                <XAxis dataKey="date" stroke="#71767B" />
                <YAxis stroke="#71767B" domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#0F0F0F", border: "1px solid #1F1F1F" }} />
                <Legend />
                {loaded.map((r, i) => (
                  <Line key={i} type="monotone" dataKey={r.userName} stroke={["#FFFFFF", "#71767B", "#3B82F6"][i % 3]} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {loaded.map((r, i) => (
              <div key={i} className="border border-dark-border rounded-card p-4">
                <ReportHeader report={r} compact />
                <ReportBody report={r} compact />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ReportHeader: React.FC<{ report: DailyReport; compact?: boolean }> = ({ report, compact }) => (
  <div className="flex items-center justify-between border-b border-dark-border pb-3">
    <div>
      <h2 className={`font-bold text-dark-text ${compact ? "text-base" : "text-xl"}`}>{report.userName}</h2>
      <p className="text-xs text-dark-subtext">{report.date}</p>
    </div>
    <div className="text-right">
      <p className="text-dark-text font-bold">Lv.{report.level}</p>
      <p className="text-xs text-dark-subtext">{report.xpTotal} XP</p>
    </div>
  </div>
);

const ReportBody: React.FC<{ report: DailyReport; compact?: boolean }> = ({ report, compact }) => {
  const { strengths, improvements, suggestion } = analyzeReport(report);
  const pieData = [
    { name: "Done", value: report.tasksDone.length },
    { name: "Pending", value: report.tasksPending.length },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Tasks" value={`${report.tasksDone.length}/${report.tasksDone.length + report.tasksPending.length}`} />
        <StatBox label="Study" value={`${report.studyMinutes}m`} />
        <StatBox label="Habits" value={`${report.chart.habitsCompletedPct}%`} />
      </div>

      {!compact && (
        <div className="grid md:grid-cols-2 gap-4">
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0F0F0F", border: "1px solid #1F1F1F" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={report.studySessions}>
                <XAxis dataKey="subject" stroke="#71767B" fontSize={11} />
                <YAxis stroke="#71767B" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0F0F0F", border: "1px solid #1F1F1F" }} />
                <Bar dataKey="minutes" fill="#FFFFFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-bold text-dark-text mb-1">✅</p>
        <ul className="text-xs text-dark-subtext space-y-0.5">
          {report.tasksDone.map((t) => (
            <li key={t.id}>✅ {t.title}</li>
          ))}
          {report.tasksPending.map((t) => (
            <li key={t.id}>⏳ {t.title}</li>
          ))}
        </ul>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-bold text-dark-text mb-1">💪 Strengths</p>
          <ul className="text-xs text-dark-subtext space-y-0.5">
            {strengths.map((s, i) => (
              <li key={i}>- {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-bold text-dark-text mb-1">🔧 Improvements</p>
          <ul className="text-xs text-dark-subtext space-y-0.5">
            {improvements.map((s, i) => (
              <li key={i}>- {s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-dark-border pt-2">
        <p className="font-bold text-dark-text text-sm mb-1">🧭 Suggestion</p>
        <p className="text-xs text-dark-subtext">{suggestion}</p>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-dark-card border border-dark-border rounded-xl p-3 text-center">
    <p className="text-lg font-bold text-dark-text">{value}</p>
    <p className="text-[10px] text-dark-subtext">{label}</p>
  </div>
);
