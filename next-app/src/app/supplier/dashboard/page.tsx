"use client";
import { useState, useEffect } from "react";
import { FolderOpen, FileText, Trophy } from "lucide-react";
import { projectsAPI, bidsAPI } from "@/services/api";
import StatCard from "@/components/shared/StatCard";
import { Project } from "@/types/project";
import { Bid } from "@/types/bid";

export default function SupplierDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, bRes] = await Promise.all([projectsAPI.getAll("active"), bidsAPI.getAll()]);
        setProjects(pRes.data);
        setBids(bRes.data);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-32 rounded-2xl bg-slate-100" /><div className="h-32 rounded-2xl bg-slate-100" /></div>;

  const won = bids.filter((b) => b.status === "won").length;
  const lost = bids.filter((b) => b.status === "lost").length;

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
