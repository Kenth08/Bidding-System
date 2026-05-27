"use client";

import { Check, Clock3, Trophy, X } from "lucide-react";

type SupplierBidProgressProps = {
  status?: string | null;
};

type Step = {
  key: string;
  label: string;
  state: "done" | "current" | "upcoming";
};

function buildSteps(status?: string | null): Step[] {
  const normalized = String(status || "").trim().toLowerCase();

  const stepStates = [
    "done",
    normalized === "submitted" ? "current" : ["under_evaluation", "won", "lost"].includes(normalized) ? "done" : "upcoming",
    ["won", "lost"].includes(normalized) ? "done" : normalized === "under_evaluation" ? "current" : "upcoming",
    normalized === "won" || normalized === "lost" ? "done" : "upcoming",
  ] as const;

  return [
    { key: "submitted", label: "Submitted", state: stepStates[0] },
    { key: "review", label: "Under Evaluation", state: stepStates[1] },
    { key: "result", label: normalized === "won" ? "Won" : normalized === "lost" ? "Lost" : "Final Result", state: stepStates[2] },
    { key: "outcome", label: normalized === "won" ? "Awarded" : normalized === "lost" ? "Not Selected" : "Pending Result", state: stepStates[3] },
  ];
}

export default function SupplierBidProgress({ status }: SupplierBidProgressProps) {
  const normalized = String(status || "").trim().toLowerCase();
  const steps = buildSteps(status);
  const isWon = normalized === "won";
  const isLost = normalized === "lost";

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Bid Progress</p>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${isWon ? "bg-emerald-50 text-emerald-700" : isLost ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
          {isWon ? <Trophy className="h-3.5 w-3.5" /> : isLost ? <X className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
          {isWon ? "Won" : isLost ? "Lost" : "In Progress"}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => {
          const isDone = step.state === "done";
          const isCurrent = step.state === "current";
          const isFinal = index === steps.length - 1;

          return (
            <div key={step.key} className="relative rounded-xl border border-slate-100 bg-white p-3">
              {index < steps.length - 1 ? <span className={`pointer-events-none absolute right-[-10px] top-5 hidden h-[2px] w-5 md:block ${isDone ? "bg-gradient-to-r from-emerald-300 to-slate-200" : "bg-slate-200"}`} /> : null}

              <div className="flex flex-col items-center gap-2 text-center">
                <span className="relative inline-flex h-7 w-7 items-center justify-center">
                  {isCurrent ? <span className="absolute inset-[-6px] rounded-full border border-amber-400/50 animate-pulse" /> : null}
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${isDone
                      ? normalized === "won" && isFinal
                        ? "bg-emerald-500 text-white"
                        : normalized === "lost" && isFinal
                          ? "bg-red-500 text-white"
                          : "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-amber-500 text-white"
                        : "border border-dashed border-slate-300 bg-slate-50 text-slate-400"}`}
                  >
                    {isDone ? (isFinal ? (isWon ? <Trophy className="h-4 w-4" /> : <X className="h-4 w-4" />) : <Check className="h-4 w-4" />) : index + 1}
                  </span>
                </span>

                <p className={`text-xs font-semibold ${isDone ? "text-emerald-700" : isCurrent ? "text-amber-700" : "text-slate-500"}`}>{step.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}