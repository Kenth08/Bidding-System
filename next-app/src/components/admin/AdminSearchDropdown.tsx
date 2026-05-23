"use client";
import { Archive, Gavel, Shield, Users, X } from "lucide-react";
import { useMemo } from "react";

const ICON_MAP: Record<string, typeof Archive> = { project: Archive, supplier: Users, bid: Gavel, record: Shield };

function safeStr(val: unknown) { return (val ?? "").toString().toLowerCase(); }

interface AdminSearchDropdownProps {
  query: string;
  onQueryChange: (q: string) => void;
  projects: Array<Record<string, unknown>>;
  suppliers: Array<Record<string, unknown>>;
  bids: Array<Record<string, unknown>>;
  blockchainRecords: Array<Record<string, unknown>>;
  onSelectResult: (category: string, item: Record<string, unknown>) => void;
}

export default function AdminSearchDropdown({ query, onQueryChange, projects, suppliers, bids, blockchainRecords, onSelectResult }: AdminSearchDropdownProps) {
  const results = useMemo(() => {
    if (!query.trim()) return { project: [], supplier: [], bid: [], record: [] };
    const q = safeStr(query);
    return {
      project: projects.filter((p) => safeStr(p.name || p.title).includes(q) || safeStr(p.id).includes(q)),
      supplier: suppliers.filter((s) => safeStr(s.name || s.full_name).includes(q) || safeStr(s.company || s.company_name).includes(q)),
      bid: bids.filter((b) => safeStr(b.projectName || b.projectTitle).includes(q) || safeStr(b.supplierName || b.supplier_name).includes(q)),
      record: blockchainRecords.filter((r) => safeStr(r.projectId || r.project_id).includes(q) || safeStr(r.winner || r.winner_name).includes(q) || safeStr(r.hash).includes(q)),
    };
  }, [query, projects, suppliers, bids, blockchainRecords]);

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  const hasResults = totalResults > 0;
  const isEmpty = !query.trim();

  const categoryLabels: Record<string, { label: string; icon: string }> = {
    project: { label: "Projects", icon: "project" },
    supplier: { label: "Suppliers", icon: "supplier" },
    bid: { label: "Bids", icon: "bid" },
    record: { label: "Blockchain Records", icon: "record" },
  };

  return (
    <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
      {isEmpty ? (
        <div className="px-4 py-8 text-center"><p className="text-sm text-slate-500">Type to search projects, suppliers, bids, or records...</p></div>
      ) : !hasResults ? (
        <div className="px-4 py-8 text-center"><p className="text-sm text-slate-500">No results found for &quot;{query}&quot;</p></div>
      ) : (
        Object.entries(categoryLabels).map(([category, { label, icon }]) => {
          const categoryResults = results[category as keyof typeof results];
          if (categoryResults.length === 0) return null;
          const IconComponent = ICON_MAP[icon];
          return (
            <div key={category}>
              <div className="sticky top-0 border-b border-slate-100 bg-slate-50 px-4 py-2">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-600"><IconComponent className="h-3 w-3" />{label}</p>
              </div>
              {categoryResults.map((item) => {
                let displayName = "", displayMeta = "";
                if (category === "project") { displayName = String(item.name || item.title || ""); displayMeta = `${item.id} \u2022 ${item.status}`; }
                else if (category === "supplier") { displayName = String(item.company || item.company_name || ""); displayMeta = `${item.name || item.full_name} \u2022 ${item.status}`; }
                else if (category === "bid") { displayName = String(item.projectName || item.projectTitle || ""); displayMeta = `${item.supplierName || item.supplier_name} \u2022 \u20B1${Number(item.bidAmount || item.bid_amount || 0).toLocaleString()}`; }
                else if (category === "record") { displayName = String(item.projectId || item.project_id || ""); displayMeta = `${item.winner || item.winner_name} \u2022 ${item.timestamp || item.recorded_at}`; }
                return (
                  <button key={String(item.id)} type="button" onClick={() => onSelectResult(category, item)} className="w-full border-t border-slate-100 px-4 py-3 text-left transition-colors first:border-0 hover:bg-slate-50">
                    <p className="text-sm font-medium text-slate-800">{displayName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{displayMeta}</p>
                  </button>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
