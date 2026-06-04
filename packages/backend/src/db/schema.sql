CREATE TABLE IF NOT EXISTS contracts (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL CHECK(length(name) <= 200),
  category       TEXT NOT NULL CHECK(category IN (
                   'UTILITIES','SUBSCRIPTIONS','INSURANCE','HOUSING','OTHER')),
  monthly_amount REAL NOT NULL CHECK(monthly_amount >= 0),
  status         TEXT NOT NULL DEFAULT 'ACTIVE'
                   CHECK(status IN ('ACTIVE','INACTIVE')),
  end_date       TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
