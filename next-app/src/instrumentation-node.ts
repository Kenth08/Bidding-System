// Node.js-only start-up: starts the cron scheduler (see src/lib/scheduler.ts).
// Never blocks or crashes server start-up. The scheduler is imported only after
// checking DATABASE_URL, because the database modules throw when it is missing.
export async function startCron() {
  if (!process.env.DATABASE_URL) {
    console.warn("[cron] scheduler not started: DATABASE_URL is not set (add it to next-app/.env)");
    return;
  }
  try {
    const { startScheduler } = await import("@/lib/scheduler");
    startScheduler();
  } catch (e) {
    console.error("[cron] scheduler failed to start:", e instanceof Error ? e.message : e);
  }
}
