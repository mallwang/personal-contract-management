CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE CHECK(length(email) <= 320),
  display_name     TEXT NOT NULL CHECK(length(display_name) <= 100),
  password_hash    TEXT NOT NULL,
  password_salt    TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'MEMBER' CHECK(role IN ('ADMIN','MEMBER')),
  status           TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','ARCHIVED')),
  archived_at      TEXT,
  failed_attempts  INTEGER NOT NULL DEFAULT 0,
  locked_until     TEXT,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       TEXT NOT NULL,
  last_seen_at     TEXT NOT NULL,
  expires_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contracts (
  id               TEXT PRIMARY KEY,
  user_id          TEXT REFERENCES users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL CHECK(length(name) <= 200),
  category         TEXT NOT NULL CHECK(category IN (
                     'UTILITIES','SUBSCRIPTIONS','INSURANCE','HOUSING','OTHER')),
  amount           REAL NOT NULL CHECK(amount >= 0),
  billing_interval TEXT NOT NULL DEFAULT 'MONTHLY'
                     CHECK(billing_interval IN (
                       'WEEKLY','MONTHLY','QUARTERLY','YEARLY','LIFETIME')),
  status           TEXT NOT NULL DEFAULT 'ACTIVE'
                     CHECK(status IN ('ACTIVE','INACTIVE')),
  end_date                  TEXT,
  start_date                TEXT,
  details                   TEXT CHECK(details IS NULL OR length(details) <= 2000),
  service_url               TEXT,
  cancellation_period_value INTEGER,
  cancellation_period_unit  TEXT CHECK(
    cancellation_period_unit IS NULL
    OR cancellation_period_unit IN ('DAYS','WEEKS','MONTHS')
  ),
  anonymize        INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
