import { requireRole, json } from "@/lib/api-utils";
import { logAudit } from "@/lib/actions";
import { JOBS } from "@/lib/scheduled-jobs";
import { getSchedulerState, intervalSeconds, runNow } from "@/lib/scheduler";

function payload() {
  const s = getSchedulerState();
  return {
    scheduler_enabled: s.enabled,
    interval_seconds: s.enabled ? s.intervalSeconds : intervalSeconds(),
    started_at: s.startedAt,
    last_run_at: s.lastRunAt,
    last_run_trigger: s.lastRunTrigger,
    next_run_at: s.enabled ? s.nextRunAt : null,
    run_count: s.runCount,
    jobs: JOBS.map((job) => ({ name: job.name, description: job.description, last_result: s.lastResults?.[job.name] ?? null })),
  };
}

function hasCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

// GET  (admin)        -> scheduler status
// GET  (CRON_SECRET)  -> run the jobs (for an external scheduler such as Vercel Cron)
export async function GET(request: Request) {
  if (hasCronSecret(request)) {
    const results = await runNow("external");
    return json({ ok: true, results });
  }
  const { error } = await requireRole(request, "admin");
  if (error) return error;
  return json(payload());
}

// POST (admin) -> "Run now" button on the admin dashboard
export async function POST(request: Request) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;
  await runNow("manual");
  await logAudit("RUN_SCHEDULED_JOBS", user!.id, "Manually ran the scheduled jobs", "system", "");
  return json(payload());
}
