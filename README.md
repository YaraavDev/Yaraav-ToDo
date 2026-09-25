# Yaraav To Do 🖤🤍

اپلیکیشن دسکتاپ ویندوزی، مینیمال و کاملاً آفلاین برای مدیریت تسک‌ها، عادت‌ها، اهداف، زمان مطالعه، دفترچه مشاوره و گیمیفیکیشن — با یک قابلیت خاص: **Smart Report Generator** (فایل `.yaraav`).

ساخته‌شده با: **Electron + React + TypeScript + Vite + TailwindCSS + SQLite (better-sqlite3)**
ظاهر الهام‌گرفته از X (توییتر سابق) — تم Pure Black / Pure White.

---

## ۱) پیش‌نیازها

- [Node.js](https://nodejs.org) نسخه ۱۸ یا بالاتر (LTS پیشنهاد می‌شود)
- npm (همراه Node نصب می‌شود)
- ویندوز ۱۰/۱۱ برای build نهایی EXE (build روی مک/لینوکس هم برای dev کار می‌کند، اما خروجی exe باید روی ویندوز یا با electron-builder cross-build گرفته شود)

> ⚠️ این پروژه در محیطی بدون اتصال اینترنت تولید شده، بنابراین `npm install` **روی سیستم خودتان** و با اتصال اینترنت انجام می‌شود. تمام کد منبع کامل و آماده است.

---

## ۲) نصب و راه‌اندازی (Development)

```bash
# ۱. ورود به پوشه پروژه
cd yaraav-todo

# ۲. نصب پکیج‌ها
npm install

# ۳. اجرای حالت توسعه (Vite + Electron با هم)
npm run dev
```

در حالت dev، پنجره Electron به‌صورت خودکار باز می‌شود و به Vite dev server (پورت 5173) وصل می‌شود. دیتابیس SQLite به‌صورت خودکار در پوشه userData ویندوز ساخته و migrate می‌شود.

---

## ۳) ساخت خروجی EXE (Production Build)

```bash
npm run build:win
```

این دستور به ترتیب:
1. رندرر React را با Vite build می‌کند (`dist/`)
2. کد Electron (main/preload) را با tsc کامپایل می‌کند (`dist-electron/`)
3. با `electron-builder` یک **نصب‌کننده NSIS (.exe)** و یک **نسخه Portable (.exe)** در پوشه `release/` می‌سازد — هر دو با آیکون اختصاصی لوگوی شما.

خروجی نهایی:
```
release/
├── Yaraav To Do Setup 1.0.0.exe   ← نصب‌کننده
└── YaraavToDo-Portable-1.0.0.exe  ← پرتابل، بدون نیاز به نصب
```

هر دو فایل روی ویندوز ۱۰ و ۱۱ اجرا می‌شوند، بدون نیاز به نصب Node.js یا هیچ وابستگی دیگری (همه‌چیز داخل exe پکیج شده).

---

## ۴) ساختار پروژه

```
yaraav-todo/
├── electron/
│   ├── main.ts            # پنجره اصلی، Splash، Tray
│   ├── preload.ts         # پل امن contextBridge (contextIsolation: true)
│   ├── db.ts               # اتصال SQLite + CRUD عمومی + migration
│   ├── schema.sql           # اسکیمای کامل دیتابیس
│   └── ipc/handlers.ts      # همه‌ی IPC handlerها
├── src/
│   ├── components/          # Button, Card, Modal, Sidebar, ThemeToggle, Toast, Heatmap, Pomodoro, ...
│   ├── pages/                # Dashboard, Tasks, Habits, Goals, StudyTimer, Counselor, ReportViewer, Settings
│   ├── store/                 # Zustand stores (theme, lang, tasks, habits, goals, xp, toast)
│   ├── i18n/                   # فارسی/انگلیسی + provider با RTL/LTR خودکار
│   ├── utils/report.ts          # هسته‌ی Smart Report Generator
│   ├── assets/                   # logo-dark.png, logo-light.png (لوگوی شما)
│   └── styles/index.css
├── build/icon.png            # آیکون EXE (از لوگوی شما ساخته می‌شود)
├── package.json
├── electron-builder.yml
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## ۵) قابلیت‌ها

| بخش | توضیح |
|---|---|
| **تسک‌ها** | اولویت ۴سطحی، سررسید+ساعت، تکرار، تگ/دسته، درگ‌اند‌دراپ، جست‌وجو/فیلتر، Pomodoro داخلی |
| **عادت‌ها** | Heatmap شبیه گیت‌هاب، شمارنده Streak، درصد موفقیت |
| **اهداف** | کوتاه/بلندمدت، پیشرفت با اسلایدر، Deadline |
| **تایمر مطالعه** | Start/Stop، ثبت خودکار جلسه، نمودار روزانه (Recharts) |
| **دفترچه مشاوره** | پروفایل دانش‌آموز، یادداشت هر جلسه با نمره پیشرفت، حالت مقایسه چند دانش‌آموز |
| **گیمیفیکیشن** | XP به‌ازای هر اکشن، محاسبه خودکار Level، Badge خودکار |
| **تنظیمات** | تم، زبان، بکاپ دستی (.db)، Auto-start، رمزنگاری گزارش |

### 🔥 Smart Report Generator

- **خروجی**: از سایدبار یا صفحه گزارش‌ها → انتخاب روز → تولید فایل `.yaraav` (JSON ساختاریافته، با گزینه رمزنگاری AES-256 در تنظیمات)
- **ورودی/نمایش**: Drag & Drop یا انتخاب فایل → نمایش خودکار با هدر+لوگو، کارت‌های آماری، نمودار Pie/Bar، لیست تسک‌ها با ✅/⏳، بخش «نقاط قوت»/«نقاط قابل بهبود»/«پیشنهاد مشاور» (تحلیل خودکار قانون‌محور)
- **خروجی فایل**: PDF و PNG از طریق jsPDF + html2canvas
- **خروجی تایپی**: متن Markdown/TXT تمیز، آماده کپی یا ارسال به مشاور
- **حالت مشاور**: بارگذاری همزمان چند فایل `.yaraav` و مقایسه در یک نمودار خطی

---

## ۶) نکات فنی

- ۱۰۰٪ آفلاین — هیچ درخواست شبکه‌ای در کد وجود ندارد.
- دیتابیس: `app.getPath('userData')/yaraav.db` (WAL mode + foreign keys).
- `contextIsolation: true`, `nodeIntegration: false` — امنیت استاندارد Electron رعایت شده.
- تمام فراخوانی‌های دیتابیس از renderer فقط از طریق preload API امن (`window.yaraav.*`) انجام می‌شود.
- برای افزودن مهاجرت (migration) جدید به دیتابیس در آینده، به آرایه `migrations` در `electron/db.ts` اضافه کنید.

---
