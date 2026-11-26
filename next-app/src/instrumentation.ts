// Runs once when the Next.js server starts and starts the cron scheduler.
// The Node-only code lives in instrumentation-node.ts and is imported inside
// this exact `NEXT_RUNTIME === "nodejs"` check so it is left out of the edge
// bundle (the database driver cannot run there).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCron } = await import("./instrumentation-node");
    await startCron();
  }
}
