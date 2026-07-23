PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  green_threshold INTEGER NOT NULL DEFAULT 70,
  green_rate_goal INTEGER NOT NULL DEFAULT 75,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_batches (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  source_filename TEXT NOT NULL,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','replaced')),
  member_count INTEGER NOT NULL,
  uploaded_at TEXT NOT NULL,
  published_at TEXT,
  previous_batch_id TEXT,
  notes TEXT,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  FOREIGN KEY (previous_batch_id) REFERENCES report_batches(id),
  UNIQUE (chapter_id, period_end)
);

CREATE TABLE IF NOT EXISTS member_scores (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  light TEXT NOT NULL CHECK (light IN ('green','yellow','red','black')),
  weeks INTEGER NOT NULL DEFAULT 0,
  training_score INTEGER NOT NULL,
  absence_score INTEGER NOT NULL,
  lateness_score INTEGER NOT NULL,
  one_to_one_score INTEGER NOT NULL,
  referral_score INTEGER NOT NULL,
  biz_give_score INTEGER NOT NULL,
  visitor_score INTEGER NOT NULL,
  previous_score INTEGER,
  improvement_tips TEXT NOT NULL DEFAULT '[]',
  recap_text TEXT,
  raw_metrics TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (batch_id) REFERENCES report_batches(id) ON DELETE CASCADE,
  UNIQUE (batch_id, normalized_name)
);

CREATE TABLE IF NOT EXISTS access_sessions (
  token_hash TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member','admin')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id TEXT NOT NULL,
  batch_id TEXT,
  action TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  FOREIGN KEY (batch_id) REFERENCES report_batches(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_batches_chapter_period ON report_batches(chapter_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_scores_batch ON member_scores(batch_id);
CREATE INDEX IF NOT EXISTS idx_scores_member ON member_scores(normalized_name);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON access_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
