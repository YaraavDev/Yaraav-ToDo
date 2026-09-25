-- Yaraav To Do — SQLite schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | done | archived
  due_date TEXT,                            -- ISO date
  due_time TEXT,                            -- HH:mm
  repeat_rule TEXT,                         -- none|daily|weekly|monthly|custom
  category TEXT,
  order_index INTEGER DEFAULT 0,
  notified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#71767B'
);

CREATE TABLE IF NOT EXISTS task_tags (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly', -- daily | weekly
  target_days INTEGER DEFAULT 7,
  color TEXT DEFAULT '#FFFFFF',
  created_at TEXT NOT NULL,
  archived INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id TEXT PRIMARY KEY,
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD
  done INTEGER DEFAULT 1,
  UNIQUE(habit_id, date)
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  term TEXT NOT NULL DEFAULT 'short', -- short | long
  deadline TEXT,
  progress INTEGER DEFAULT 0, -- 0-100
  status TEXT DEFAULT 'active', -- active|done|overdue
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  subject TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_seconds INTEGER DEFAULT 0,
  note TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT,
  subject TEXT,
  phone TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_date TEXT NOT NULL,
  content TEXT,
  progress_score INTEGER, -- 0-100 self-assessment for that session
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  report_date TEXT NOT NULL,
  file_name TEXT,
  payload TEXT NOT NULL, -- JSON snapshot as stored/generated
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  unlocked_at TEXT
);

CREATE TABLE IF NOT EXISTS xp_log (
  id TEXT PRIMARY KEY,
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('theme', 'dark'),
  ('lang', 'fa'),
  ('user_name', 'کاربر Yaraav'),
  ('autostart', '0'),
  ('report_encryption', '0'),
  ('xp_total', '0'),
  ('level', '1');
