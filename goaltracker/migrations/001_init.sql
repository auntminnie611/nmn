CREATE TABLE IF NOT EXISTS "Goal" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "category"     TEXT NOT NULL DEFAULT 'General',
  "color"        TEXT NOT NULL DEFAULT '#6366f1',
  "icon"         TEXT NOT NULL DEFAULT 'target',
  "scheduleType" TEXT NOT NULL DEFAULT 'daily',
  "scheduleDays" TEXT,
  "scheduleCount" INTEGER,
  "dueDate"      TIMESTAMPTZ,
  "isActive"     BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Completion" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "goalId"    TEXT NOT NULL,
  "date"      TEXT NOT NULL,
  "note"      TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Completion_goalId_date_key" UNIQUE ("goalId", "date"),
  CONSTRAINT "Completion_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE
);
