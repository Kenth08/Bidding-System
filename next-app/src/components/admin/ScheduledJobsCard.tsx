"use client";
import { useEffect, useState } from "react";
import { CheckCircle, Clock, Play, XCircle } from "lucide-react";
import { cronAPI } from "@/services/api";

type JobResult = { ok: true; count: number } | { ok: false; error: string } | null;

interface CronStatus {
  scheduler_enabled: boolean;
  interval_seconds: number;
  last_run_at: string | null;
  last_run_trigger: string | null;
  next_run_at: string | null;
  run_count: number;
  jobs: { name: string; description: string; last_result: JobResult }[];
}

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "medium" });
}

export default function ScheduledJobsCard() {
  const [status, setStatus] = useState<CronStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      cronAPI.getStatus()
        .then((r) => { if (!cancelled) { setStatus(Array.isArray(r.data?.jobs) ? r.data : null); setError(""); } })
        .catch(() => { if (!cancelled) setError("Could not load scheduler status."); });
    load();
    const i = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  async function handleRunNow() {
    setRunning(true);
    try {
      const r = await cronAPI.runNow();
      setStatus(Array.isArray(r.data?.jobs) ? r.data : null);
      setError("");
    } catch {
      setError("Running the scheduled jobs failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Scheduled Jobs (Cron)</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {status?.scheduler_enabled
              ? `Runs automatically every ${status.interval_seconds} seconds`
              : "Automatic timer is off — use Run now"}
          </p>
        </div>
        <button
          onClick={handleRunNow}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
        >
          <Play className="h-3.5 w-3.5" />
          {running ? "Running..." : "Run now"}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-3">
        <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" />Last run: {formatTime(status?.last_run_at ?? null)}{status?.last_run_trigger ? ` (${status.last_run_trigger})` : ""}</div>
        <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400" />Next run: {formatTime(status?.next_run_at ?? null)}</div>
        <div>Total runs: {status?.run_count ?? 0}</div>
      </div>

      <ul className="mt-4 divide-y divide-slate-100">
        {(status?.jobs || []).map((job) => {
          const r = job.last_result;
          return (
            <li key={job.name} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                {r && !r.ok
                  ? <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  : <CheckCircle className={`h-4 w-4 shrink-0 ${r ? "text-emerald-500" : "text-slate-300"}`} />}
                {job.description}
              </div>
              <span className="shrink-0 text-xs text-slate-400">{!r ? "not run yet" : r.ok ? `${r.count} affected` : "failed"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
