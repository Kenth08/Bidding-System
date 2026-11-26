/**
 * In-process cron scheduler: runs runAllJobs() every CRON_INTERVAL_SECONDS
 * (default 60) while the Next.js server is running. Started once from
 * src/instrumentation.ts.
 *
 * .env options:
 *   CRON_ENABLED=false          turn the automatic timer off
 *   CRON_INTERVAL_SECONDS=60    how often it runs (minimum 10)
 *   CRON_SECRET=...             lets an external scheduler call GET /api/cron/scheduled-jobs
 *
 * State lives on globalThis so the scheduler and the API routes share it even
 * though Next.js bundles them separately (and so hot reload doesn't start a
 * second timer).
 */
import { runAllJobs, type JobResult } from "@/lib/scheduled-jobs";

type SchedulerState = {
  enabled: boolean;
  intervalSeconds: number;
  startedAt: string | null;
  lastRunAt: string | null;
  lastRunTrigger: string | null;
  lastResults: Record<string, JobResult> | null;
  nextRunAt: string | null;
  runCount: number;
  running: Promise<Record<string, JobResult>> | null;
  timer: ReturnType<typeof setInterval> | null;
};

const g = globalThis as unknown as { __cronScheduler?: SchedulerState };

export function intervalSeconds() {
  const n = Number(process.env.CRON_INTERVAL_SECONDS || 60);
  return Number.isFinite(n) ? Math.max(10, Math.floor(n)) : 60;
}

export function getSchedulerState(): SchedulerState {
  if (!g.__cronScheduler) {
    g.__cronScheduler = {
      enabled: false,
      intervalSeconds: intervalSeconds(),
      startedAt: null,
      lastRunAt: null,
      lastRunTrigger: null,
      lastResults: null,
      nextRunAt: null,
      runCount: 0,
      running: null,
      timer: null,
    };
  }
  return g.__cronScheduler;
}

/** Run all jobs once. If a run is already in progress, waits for it instead of starting another. */
export async function runNow(trigger: "scheduler" | "manual" | "external" = "manual") {
  const state = getSchedulerState();
  if (state.running) return state.running;

  state.running = (async () => {
    try {
      const results = await runAllJobs();
      state.runCount++;
      state.lastRunAt = new Date().toISOString();
      state.lastRunTrigger = trigger;
      state.lastResults = results;

      const changed = Object.fromEntries(Object.entries(results).filter(([, r]) => r.ok && r.count > 0).map(([k, r]) => [k, (r as { count: number }).count]));
      const failed = Object.entries(results).filter(([, r]) => !r.ok).map(([k]) => k);
      const summary = Object.keys(changed).length ? JSON.stringify(changed) : "nothing to do";
      console[failed.length ? "warn" : "log"](`[cron] run #${state.runCount} (${trigger}): ${summary}${failed.length ? ` | failed: ${failed.join(", ")}` : ""}`);
      return results;
    } finally {
      state.running = null;
    }
  })();
  return state.running;
}

export function startScheduler() {
  const state = getSchedulerState();
  if (state.timer) return; // already running

  if (["0", "false", "no", "off"].includes(String(process.env.CRON_ENABLED || "true").trim().toLowerCase())) {
    console.log("[cron] scheduler disabled (CRON_ENABLED=false)");
    return;
  }

  const interval = intervalSeconds();
  state.enabled = true;
  state.intervalSeconds = interval;
  state.startedAt = new Date().toISOString();

  const tick = () => {
    state.nextRunAt = new Date(Date.now() + interval * 1000).toISOString();
    runNow("scheduler").catch((e) => console.error("[cron] run failed:", e?.message || e));
  };

  // First run shortly after start-up, then every `interval` seconds.
  state.nextRunAt = new Date(Date.now() + 10_000).toISOString();
  setTimeout(tick, 10_000);
  state.timer = setInterval(tick, interval * 1000);
  console.log(`[cron] scheduler started: running scheduled jobs every ${interval} seconds`);
}
