import { PrismaClient } from "@prisma/client";

// DATABASE_URL is injected by the platform (Postgres) in production.
// In local dev, set it in .env to a postgres:// connection string,
// or the app falls back to an in-memory stub that logs a clear error.
if (!process.env.DATABASE_URL) {
  console.error(
    "[goaltracker] DATABASE_URL is not set. " +
      "Set it in .env to a postgres:// connection string for local dev."
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
