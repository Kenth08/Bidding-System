"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, FileText, Flag, Gavel, Send, Trophy, UserCheck, X } from "lucide-react";
import Modal from "@/components/shared/Modal";

interface LogEntry {
  id: string;
  action: string;
  description: string;
  role: string;
  user_name: string | null;
  created_at: string;
}

interface TimelineStage {
  key: string;
  label: string;
  completed: boolean;
  timestamp: string | null;
  icon: React.ReactNode;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function getIcon(action: string) {
  if (action.includes("CREATED") || action.includes("DRAFT")) return <FileText className="h-4 w-4 text-slate-500" />;
  if (action.includes("APPROVAL") || action.includes("APPROVED")) return <UserCheck className="h-4 w-4 text-blue-500" />;
  if (action.includes("BLOCKED") || action.includes("EXPIRED")) return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (action.includes("PUBLISH")) return <Send className="h-4 w-4 text-emerald-500" />;
  if (action.includes("SUBMIT") || action.includes("BID_")) return <Gavel className="h-4 w-4 text-indigo-500" />;
  if (action.includes("REVIEW") || action.includes("EVALUAT")) return <Clock className="h-4 w-4 text-amber-500" />;
  if (action.includes("WINNER") || action.includes("WON") || action.includes("SELECT")) return <Trophy className="h-4 w-4 text-amber-500" />;
  if (action.includes("REJECT") || action.includes("LOST") || action.includes("FLAG")) return <Flag className="h-4 w-4 text-red-500" />;
  if (action.includes("QUALIFIED")) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  return <Clock className="h-4 w-4 text-slate-400" />;
}

function buildTimeline(logs: LogEntry[]): TimelineStage[] {
  const stages: TimelineStage[] = [
    { key: "created", label: "Created", completed: false, timestamp: null, icon: <Gavel className="h-4 w-4" /> },
    { key: "review", label: "Under Review", completed: false, timestamp: null, icon: <Clock className="h-4 w-4" /> },
    { key: "approved", label: "Approved", completed: false, timestamp: null, icon: <UserCheck className="h-4 w-4" /> },
    { key: "winner", label: "Winner Selected", completed: false, timestamp: null, icon: <Trophy className="h-4 w-4" /> },
    { key: "recorded", label: "Recorded", completed: false, timestamp: null, icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  logs.forEach((log) => {
    if (log.action.includes("SUBMIT_BID")) {
      stages[0].completed = true;
      stages[0].timestamp = log.created_at;
    }
    if (log.action.includes("UPDATE") && log.description.includes("review")) {
      stages[1].completed = true;
      stages[1].timestamp = log.created_at;
    }
    if (log.action.includes("APPROVAL") || log.action.includes("APPROVED")) {
      stages[2].completed = true;
      stages[2].timestamp = log.created_at;
    }
    if (log.action.includes("SELECT_WINNER")) {
      stages[3].completed = true;
      stages[3].timestamp = log.created_at;
    }
    if (log.action.includes("RECORD_BLOCKCHAIN")) {
      stages[4].completed = true;
      stages[4].timestamp = log.created_at;
    }
  });

  return stages;
}

export default function BidActivityLogModal({ isOpen, onClose, projectId, apiBase }: { isOpen: boolean; onClose: () => void; projectId: string | null; apiBase: "admin" | "supplier" }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !projectId) return;
    setLoading(true);
    fetch(`/api/${apiBase}/bids/${projectId}/logs`)
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [isOpen, projectId, apiBase]);

  const timeline = buildTimeline(logs);
  const lastCompletedIndex = timeline.findIndex((s) => !s.completed) - 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Audit Trail" size="lg">
      <div className="max-h-[70vh] overflow-y-auto space-y-6 pb-4">
        {loading ? (
          <div className="space-y-3 py-4">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No activity logs yet.</p>
        ) : (
          <>
            {/* Timeline Progress Bar */}
            <div className="px-2">
              <div className="flex items-center justify-between gap-2">
                {timeline.map((stage, idx) => (
                  <div key={stage.key} className="flex flex-col items-center flex-1">
                    {/* Icon Circle */}
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 mb-2 transition-colors ${
                        stage.completed
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : idx <= lastCompletedIndex + 1
                            ? "bg-blue-50 border-blue-400 text-blue-600"
                            : "bg-slate-50 border-slate-300 text-slate-400"
                      }`}
                    >
                      {stage.icon}
                    </div>
                    {/* Label */}
                    <p className={`text-xs font-medium text-center ${stage.completed ? "text-emerald-700" : "text-slate-600"}`}>
                      {stage.label}
                    </p>
                    {/* Timestamp */}
                    {stage.timestamp && (
                      <p className="text-[10px] text-slate-500 mt-1">{new Date(stage.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    )}
                    {/* Connector Line */}
                    {idx < timeline.length - 1 && (
                      <div
                        className={`w-full h-0.5 mt-3 ${
                          stage.completed && timeline[idx + 1].completed ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                        style={{ minHeight: "2px" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Activity Log */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3 px-2">Activity Details</p>
              <div className="relative pl-6 px-2">
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />
                {logs.map((log) => (
                  <div key={log.id} className="relative mb-4 last:mb-0">
                    <div className="absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-slate-200">
                      {getIcon(log.action)}
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{log.action.replace(/_/g, " ")}</p>
                      <p className="mt-0.5 text-xs text-slate-600">{log.description}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{formatDate(log.created_at)}</span>
                        {log.user_name && <span>By: {log.user_name} ({log.role})</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
