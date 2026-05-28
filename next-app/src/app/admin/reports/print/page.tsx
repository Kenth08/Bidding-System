"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { reportsAPI } from "@/services/api";

function formatPeso(v: unknown) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(Number(v || 0)); }

export default function PrintReport() {
  const searchParams = useSearchParams();
  const type = searchParams?.get("type") || "procurement";
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        if (type === "suppliers") {
          const r = await reportsAPI.getSuppliers();
          setData({ type: "suppliers", payload: r.data });
        } else {
          const r = await reportsAPI.getProcurement();
          setData({ type: "procurement", payload: r.data });
        }
      } catch (e) {
        setData({ error: true });
      }
    })();
  }, [type]);

  useEffect(() => {
    if (data) {
      // allow rendering then open print dialog
      setTimeout(() => { window.print(); }, 500);
    }
  }, [data]);

  if (!data) return <div style={{ padding: 40 }}>Loading...</div>;
  if (data.error) return <div style={{ padding: 40 }}>Failed to load report.</div>;

  if (data.type === "procurement") {
    const d = data.payload;
    return (
      <div style={{ padding: 24, fontFamily: "Inter, Arial, sans-serif", color: "#111827" }}>
        <h1 style={{ marginBottom: 8 }}>Procurement Report</h1>
        <div style={{ marginBottom: 12 }}>
          <div>Total Projects: {d.summary?.total_projects ?? 0}</div>
          <div>Active: {d.summary?.active_projects ?? 0}</div>
          <div>Awarded: {d.summary?.awarded_projects ?? 0}</div>
          <div>Total Bids: {d.summary?.total_bids ?? 0}</div>
          <div>Awarded Amount: {formatPeso(d.summary?.total_awarded_amount)}</div>
        </div>
        <h2>By Procurement Type</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
          <thead><tr><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Type</th><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Count</th></tr></thead>
          <tbody>
            {d.by_procurement_type?.map((t: any) => (<tr key={t.procurement_type}><td style={{ paddingTop: 6 }}>{t.procurement_type}</td><td style={{ paddingTop: 6 }}>{t.count}</td></tr>))}
          </tbody>
        </table>
        <h2>Recent Awards</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Project</th><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Winner</th><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Amount</th><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Date</th></tr></thead>
          <tbody>
            {d.recent_awards?.map((a: any, i: number) => (<tr key={i}><td style={{ paddingTop: 6 }}>{a.project__title}</td><td style={{ paddingTop: 6 }}>{a.winner__company_name || a.winner__full_name}</td><td style={{ paddingTop: 6 }}>{formatPeso(a.bid_amount)}</td><td style={{ paddingTop: 6 }}>{a.recorded_at ? new Date(a.recorded_at).toLocaleDateString() : "—"}</td></tr>))}
          </tbody>
        </table>
      </div>
    );
  }

  // suppliers
  const s = data.payload;
  return (
    <div style={{ padding: 24, fontFamily: "Inter, Arial, sans-serif", color: "#111827" }}>
      <h1>Supplier Report</h1>
      <div>Total Suppliers: {s.summary?.total_suppliers ?? 0}</div>
      <div>Approved: {s.summary?.approved ?? 0}  Pending: {s.summary?.pending ?? 0}  Rejected: {s.summary?.rejected ?? 0}</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead><tr><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Name</th><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Company</th><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Email</th><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Type</th><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Status</th><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Bids</th><th style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Wins</th></tr></thead>
        <tbody>
          {s.supplier_list?.map((sup: any) => (<tr key={sup.id}><td style={{ paddingTop: 6 }}>{sup.full_name}</td><td style={{ paddingTop: 6 }}>{sup.company_name}</td><td style={{ paddingTop: 6 }}>{sup.email}</td><td style={{ paddingTop: 6 }}>{sup.business_type}</td><td style={{ paddingTop: 6 }}>{sup.status}</td><td style={{ paddingTop: 6 }}>{sup.bid_count}</td><td style={{ paddingTop: 6 }}>{sup.wins}</td></tr>))}
        </tbody>
      </table>
    </div>
  );
}
