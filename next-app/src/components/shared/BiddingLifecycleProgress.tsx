"use client";

type LifecycleInput = {
  projectStatus?: string | null;
  procurementStatus?: string | null;
  bidCount?: number;
  hasUnderEvaluation?: boolean;
  hasWinner?: boolean;
  compact?: boolean;
};

type Stage = {
  key: string;
  label: string;
  state: "done" | "current" | "upcoming";
};

function normalize(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function buildStages(input: LifecycleInput): Stage[] {
  const projectStatus = normalize(input.projectStatus);
  const procurementStatus = normalize(input.procurementStatus);
  const bidCount = Number(input.bidCount || 0);
  const hasUnderEvaluation = Boolean(input.hasUnderEvaluation);
  const hasWinner = Boolean(input.hasWinner) || projectStatus === "awarded";

  const createdDone = true;
  const approvedByHeadDone = procurementStatus === "approved" || (!procurementStatus && projectStatus !== "draft");
  const publishedDone = ["active", "closed", "awarded"].includes(projectStatus);
  const evaluationDone = hasWinner || projectStatus === "closed" || hasUnderEvaluation;
  const winnerDone = hasWinner;

  const doneFlags = [createdDone, approvedByHeadDone, publishedDone, evaluationDone, winnerDone];
  const firstPendingIndex = doneFlags.findIndex((v) => !v);
  const currentIndex = firstPendingIndex === -1 ? doneFlags.length - 1 : firstPendingIndex;

  const stageMeta = [
    { key: "created", label: "Bidding Created" },
    { key: "head_approval", label: "Head Approval" },
    { key: "publish", label: "Ready to Publish" },
    { key: "evaluation", label: "Bid Evaluation" },
    { key: "winner", label: "Winner Selection" },
  ];

  return stageMeta.map((meta, idx) => ({
    ...meta,
    state: doneFlags[idx] ? "done" : idx === currentIndex ? "current" : "upcoming",
  }));
}

export default function BiddingLifecycleProgress(input: LifecycleInput) {
  const stages = buildStages(input);
  const compact = Boolean(input.compact);

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "md:grid-cols-5"}`}>
        {stages.map((stage, idx) => {
          const isDone = stage.state === "done";
          const isCurrent = stage.state === "current";

          return (
            <div key={stage.key} className="relative rounded-xl border border-slate-100 bg-white p-3">
              {!compact && idx < stages.length - 1 ? <span className="pointer-events-none absolute right-[-10px] top-5 hidden h-[2px] w-5 bg-slate-200 md:block" /> : null}
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${isDone
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-amber-500 text-white"
                      : "bg-slate-200 text-slate-500"}`}
                >
                  {idx + 1}
                </span>
                <p className={`text-xs font-semibold ${isDone ? "text-emerald-700" : isCurrent ? "text-amber-700" : "text-slate-500"}`}>{stage.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
