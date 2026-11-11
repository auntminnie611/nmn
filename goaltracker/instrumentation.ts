export async function register() {
  // Run schema setup once at server boot in Node.js runtime only.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL?.startsWith("postgres")) return;

  try {
    const { prisma } = await import("./lib/prisma");

    await prisma.$executeRawUnsafe(`
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
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Completion" (
        "id"        TEXT NOT NULL PRIMARY KEY,
        "goalId"    TEXT NOT NULL,
        "date"      TEXT NOT NULL,
        "note"      TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "Completion_goalId_date_key" UNIQUE ("goalId", "date"),
        CONSTRAINT "Completion_goalId_fkey"
          FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE
      )
    `);

    console.log("[goaltracker] Schema ready");
  } catch (err) {
    console.error("[goaltracker] Schema setup failed:", err);
  }
}
