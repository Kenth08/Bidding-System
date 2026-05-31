"use client";
import { FolderOpen, FileText, Trophy } from "lucide-react";
import { useProjects, useBids } from "@/hooks/useQueryHooks";
import StatCard from "@/components/shared/StatCard";

export default function SupplierDashboard() {
  const { data: projectsData, isLoading: projectsLoading } = useProjects({ status: "active" });
  const { data: bidsData, isLoading: bidsLoading } = useBids();

  const loading = projectsLoading || bidsLoading;
  const projects = projectsData?.results || [];
  const bids = bidsData?.results || [];

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-32 rounded-2xl bg-slate-100" /><div className="h-32 rounded-2xl bg-slate-100" /></div>;

  const won = bids.filter((b: any) => b.status === "won").length;
  const lost = bids.filter((b: any) => b.status === "lost").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Available Projects" value={projects.length} icon={FolderOpen} subtitle="Active procurement opportunities" iconColor="#10b981" />
        <StatCard title="Bids Submitted" value={bids.length} icon={FileText} subtitle="Total proposals sent" iconColor="#3b82f6" />
        <StatCard title="Bids Won" value={won} icon={Trophy} subtitle={`${lost} lost`} iconColor="#f59e0b" accentLine />
      </div>
    </div>
  );
}
