"use client";

import { Check, Clock3, Trophy, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SupplierBidProgressProps = {
  status?: string | null;
  technical_compliance?: boolean | null;
};

type Step = {
  key: string;
  label: string;
  state: "done" | "current" | "upcoming";
};

function buildSteps(status?: string | null, technical_compliance?: boolean | null): Step[] {
  const normalized = String(status || "").trim().toLowerCase();
  const isSubmitted = normalized === "submitted";
  const isUnderEval = normalized === "under_evaluation";
  const isWon = normalized === "won";
  const isLost = normalized === "lost";
  const isQualified = Boolean(technical_compliance);
  // Determine step states so that when a bid is qualified we show
  // the Qualified step as completed and advance the current step
  // to the final "Pending Result / Select Winner" stage.
  let step1State: Step["state"] = "done";
  let step2State: Step["state"] = "upcoming";
  let step3State: Step["state"] = "upcoming";
  let step4State: Step["state"] = "upcoming";

  if (isWon || isLost) {
    step1State = "done";
    step2State = "done";
    step3State = "done";
    step4State = "done";
  } else if (isQualified) {
    step1State = "done";
    step2State = "done";
    step3State = "done";
    step4State = "current"; // waiting for winner selection
  } else if (isUnderEval) {
    step1State = "done";
    step2State = "current";
    step3State = "upcoming";
    step4State = "upcoming";
  } else if (isSubmitted) {
    step1State = "current";
  }

  const step1: Step = { key: "submitted", label: "Submitted", state: step1State };
  const step2: Step = { key: "review", label: "Under Evaluation", state: step2State };
  const step3Label = isQualified ? "Qualified" : "Evaluated";
  const step3: Step = { key: "evaluated", label: step3Label, state: step3State };
  const step4: Step = { key: "outcome", label: isWon ? "Awarded" : isLost ? "Not Selected" : "Pending Result", state: step4State };

  return [step1, step2, step3, step4];
}

export default function SupplierBidProgress({ status, technical_compliance }: SupplierBidProgressProps) {
  const normalized = String(status || "").trim().toLowerCase();
  const steps = buildSteps(status, technical_compliance);
  const isWon = normalized === "won";
  const isLost = normalized === "lost";
  const [flashStep, setFlashStep] = useState<string | null>(null);
  const prevStatus = useRef<string | null>(null);
  const prevQualified = useRef<boolean | null>(null);

  useEffect(() => {
    // detect significant changes and flash the affected step
    const prevS = prevStatus.current;
    const prevQ = prevQualified.current;
    const currS = normalized;
    const currQ = Boolean(technical_compliance);

    if (prevS && prevS !== currS) {
      if (prevS === "submitted" && currS === "under_evaluation") setFlashStep("review");
      else if ((currS === "won" || currS === "lost")) setFlashStep("outcome");
    }

    if (prevQ !== null && !prevQ && currQ) {
      // became qualified
      setFlashStep("evaluated");
    }

    prevStatus.current = currS;
    prevQualified.current = currQ;
  }, [normalized, technical_compliance]);

  useEffect(() => {
    if (!flashStep) return;
    const t = setTimeout(() => setFlashStep(null), 800);
    return () => clearTimeout(t);
  }, [flashStep]);

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
            const isFlashing = flashStep === step.key;

          return (
            <div key={step.key} className="relative rounded-xl border border-slate-100 bg-white p-3">
              {index < steps.length - 1 ? <span className={`pointer-events-none absolute right-[-10px] top-5 hidden h-[2px] w-5 md:block ${isDone ? "bg-gradient-to-r from-emerald-300 to-slate-200" : "bg-slate-200"}`} /> : null}

              <div className={`flex flex-col items-center gap-2 text-center ${isFlashing ? "animate-pulse" : ""}`}>
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
                        : "border border-dashed border-slate-300 bg-slate-50 text-slate-400"} ${isFlashing && !isDone ? "ring-2 ring-amber-300/40" : ""}`}
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