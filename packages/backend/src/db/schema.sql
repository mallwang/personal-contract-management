CREATE TABLE IF NOT EXISTS contracts (
  id               TEXT PRIMARY KEY,
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
