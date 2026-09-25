import CryptoJS from "crypto-js";

// ---------------------------------------------------------------------------
// Yaraav To Do — Smart Report Generator
// Builds a structured, self-contained snapshot (.yaraav = JSON) for a given
// day: completed/pending tasks, study sessions, habit status, XP/level,
// notes, and chart-ready series. Includes optional AES-256 encryption and
// an automatic strengths/improvements/suggestion analysis.
// ---------------------------------------------------------------------------

const YARAAV_MAGIC = "YARAAV_REPORT_V1";
const ENC_PREFIX = "YARAAV_ENC::";

export interface ReportTaskEntry {
  id: string;
  title: string;
  priority: string;
  status: string;
  time?: string | null;
}

export interface DailyReport {
  magic: string;
  userName: string;
  date: string;
  generatedAt: string;
  tasksDone: ReportTaskEntry[];
  tasksPending: ReportTaskEntry[];
  studyMinutes: number;
  studySessions: { subject: string; minutes: number }[];
  habits: { name: string; done: boolean; streak: number }[];
  xpTotal: number;
  level: number;
  notes: string[];
  chart: { tasksCompletedPct: number; studyMinutes: number; habitsCompletedPct: number };
}

export async function buildDailyReport(date: string): Promise<DailyReport> {
  const settings = await window.yaraav.settings.getAll();
  const allTasks = (await window.yaraav.db.list("tasks")) as any[];
  const dayTasks = allTasks.filter((t) => t.due_date === date);
  const tasksDone: ReportTaskEntry[] = dayTasks
    .filter((t) => t.status === "done")
    .map((t) => ({ id: t.id, title: t.title, priority: t.priority, status: t.status, time: t.due_time }));
  const tasksPending: ReportTaskEntry[] = dayTasks
    .filter((t) => t.status !== "done")
    .map((t) => ({ id: t.id, title: t.title, priority: t.priority, status: t.status, time: t.due_time }));

  const sessions = ((await window.yaraav.db.list("study_sessions")) as any[]).filter((s) =>
    (s.started_at || "").slice(0, 10) === date
  );
  const studyMinutes = sessions.reduce((sum, s) => sum + Math.round((s.duration_seconds || 0) / 60), 0);
  const studySessions = sessions.map((s) => ({ subject: s.subject || "General", minutes: Math.round((s.duration_seconds || 0) / 60) }));

  const habits = (await window.yaraav.db.list("habits", "archived = 0")) as any[];
  const habitRows: DailyReport["habits"] = [];
  for (const h of habits) {
    const logs = await window.yaraav.habits.heatmap(h.id);
    const done = logs.some((l) => l.date === date && l.done);
    let streak = 0;
    const set = new Set(logs.filter((l) => l.done).map((l) => l.date));
    const d = new Date(date);
    while (set.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    habitRows.push({ name: h.name, done, streak });
  }

  const totalDayTasks = dayTasks.length || 1;
  const tasksCompletedPct = Math.round((tasksDone.length / totalDayTasks) * 100);
  const habitsCompletedPct = habits.length ? Math.round((habitRows.filter((h) => h.done).length / habits.length) * 100) : 0;

  return {
    magic: YARAAV_MAGIC,
    userName: settings.user_name || "کاربر Yaraav",
    date,
    generatedAt: new Date().toISOString(),
    tasksDone,
    tasksPending,
    studyMinutes,
    studySessions,
    habits: habitRows,
    xpTotal: parseInt(settings.xp_total || "0", 10),
    level: parseInt(settings.level || "1", 10),
    notes: [],
    chart: { tasksCompletedPct, studyMinutes, habitsCompletedPct },
  };
}

export function serializeReport(report: DailyReport, encrypt: boolean, passphrase = "yaraav-default-key"): string {
  const json = JSON.stringify(report, null, 2);
  if (!encrypt) return json;
  const cipher = CryptoJS.AES.encrypt(json, passphrase).toString();
  return ENC_PREFIX + cipher;
}

export function deserializeReport(raw: string, passphrase = "yaraav-default-key"): DailyReport {
  if (raw.startsWith(ENC_PREFIX)) {
    const cipherText = raw.slice(ENC_PREFIX.length);
    const bytes = CryptoJS.AES.decrypt(cipherText, passphrase);
    const json = bytes.toString(CryptoJS.enc.Utf8);
    if (!json) throw new Error("رمزگشایی ناموفق بود — رمز عبور اشتباه است");
    return JSON.parse(json);
  }
  return JSON.parse(raw);
}

// ---- Automatic analysis -----------------------------------------------------
export function analyzeReport(r: DailyReport): { strengths: string[]; improvements: string[]; suggestion: string } {
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (r.chart.tasksCompletedPct >= 80) strengths.push(`نرخ تکمیل تسک بالا: ${r.chart.tasksCompletedPct}٪`);
  else if (r.chart.tasksCompletedPct < 50) improvements.push(`نرخ تکمیل تسک پایین بود: ${r.chart.tasksCompletedPct}٪`);

  if (r.studyMinutes >= 90) strengths.push(`زمان مطالعه خوب: ${r.studyMinutes} دقیقه`);
  else if (r.studyMinutes < 30) improvements.push("زمان مطالعه امروز کم بود");

  if (r.chart.habitsCompletedPct >= 80) strengths.push("پایبندی عالی به عادت‌ها");
  else if (r.chart.habitsCompletedPct < 50 && r.habits.length > 0) improvements.push("عادت‌های روزانه ناقص انجام شدند");

  const criticalPending = r.tasksPending.filter((t) => t.priority === "critical" || t.priority === "high");
  if (criticalPending.length > 0) improvements.push(`${criticalPending.length} تسک با اولویت بالا هنوز باز است`);

  if (strengths.length === 0) strengths.push("شروع ثبت‌شده — ادامه بده!");
  if (improvements.length === 0) improvements.push("نکته منفی خاصی ثبت نشد 🎉");

  let suggestion = "به همین روند ادامه بده و روی تسک‌های بحرانی باز، اولویت بیشتری بگذار.";
  if (r.chart.tasksCompletedPct < 50 && r.studyMinutes < 30) {
    suggestion = "پیشنهاد می‌شود فردا را با یک بلوک ۲۵ دقیقه‌ای پومودورو شروع کنی و فقط ۲-۳ تسک مهم را هدف بگذاری.";
  } else if (r.chart.habitsCompletedPct < 50) {
    suggestion = "برای تثبیت عادت‌ها، آن‌ها را به یک زمان مشخص در روز (مثلاً صبح) گره بزن.";
  }

  return { strengths, improvements, suggestion };
}

export function reportToPlainText(r: DailyReport): string {
  const { strengths, improvements, suggestion } = analyzeReport(r);
  const lines: string[] = [];
  lines.push(`Yaraav To Do — گزارش روز`);
  lines.push(`نام: ${r.userName}`);
  lines.push(`تاریخ: ${r.date}`);
  lines.push("");
  lines.push(`سطح: ${r.level} | امتیاز کل: ${r.xpTotal} XP`);
  lines.push(`تسک‌های انجام‌شده: ${r.tasksDone.length} | باز: ${r.tasksPending.length}`);
  lines.push(`زمان مطالعه: ${r.studyMinutes} دقیقه`);
  lines.push(`عادت‌ها: ${r.habits.filter((h) => h.done).length}/${r.habits.length} انجام‌شده`);
  lines.push("");
  lines.push("✅ تسک‌های انجام‌شده:");
  r.tasksDone.forEach((t) => lines.push(`  - ${t.title} (${t.priority})`));
  lines.push("");
  lines.push("⏳ تسک‌های باز:");
  r.tasksPending.forEach((t) => lines.push(`  - ${t.title} (${t.priority})`));
  lines.push("");
  lines.push("💪 نقاط قوت:");
  strengths.forEach((s) => lines.push(`  - ${s}`));
  lines.push("");
  lines.push("🔧 نقاط قابل بهبود:");
  improvements.forEach((s) => lines.push(`  - ${s}`));
  lines.push("");
  lines.push("🧭 پیشنهاد مشاور:");
  lines.push(`  ${suggestion}`);
  return lines.join("\n");
}

export function suggestedFileName(date: string): string {
  return `yaraav-report-${date}.yaraav`;
}
