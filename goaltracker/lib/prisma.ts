import { PrismaClient } from "@prisma/client";
import path from "path";

// Ensure DATABASE_URL is set before PrismaClient is created.
// Next.js loads .env at the process level, but in some environments
// (especially with Turbopack) it may not be set yet at module-eval time.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
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
