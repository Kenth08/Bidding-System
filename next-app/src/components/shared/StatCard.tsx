"use client";
import { BarChart3, LucideIcon } from "lucide-react";
import { CSSProperties } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  accentLine?: boolean;
  leftBorderColor?: string | null;
  iconColor?: string | null;
}

export default function StatCard({ title, value, icon: Icon, subtitle = "Updated just now", accentLine = false, leftBorderColor = null, iconColor = null }: StatCardProps) {
  const ResolvedIcon = Icon || BarChart3;
  const containerStyle: CSSProperties | undefined = leftBorderColor ? { borderLeft: `4px solid ${leftBorderColor}` } : undefined;
  const iconStyle: CSSProperties | undefined = iconColor ? { color: iconColor } : undefined;

  return (
    <article style={containerStyle} className={`relative overflow-hidden rounded-[20px] border bg-white/95 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] ${accentLine ? "border-emerald-100" : "border-slate-100 hover:border-slate-200"}`}>
      {accentLine ? <div className="absolute left-0 right-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-emerald-400 to-emerald-300" /> : null}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <div style={iconStyle} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/90 text-slate-400 shadow-sm">
          <ResolvedIcon className="h-4 w-4" />
        </div>
      </div>
      <div className="border-t border-slate-50 pt-3">
        <p className="text-xs leading-5 text-slate-400">{subtitle}</p>
      </div>
    </article>
  );
}
