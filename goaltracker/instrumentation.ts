export async function register() {
  // Only run in Node.js runtime (not Edge), and only when a real Postgres URL is present.
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.DATABASE_URL?.startsWith("postgres")
  ) {
    try {
      const { execSync } = await import("child_process");
      execSync("npx prisma db push --accept-data-loss --skip-generate", {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      console.log("[goaltracker] Schema synced");
    } catch (err) {
      // Log but don't crash the server — tables may already exist.
      console.error("[goaltracker] Schema sync failed:", err);
    }
  }
}
