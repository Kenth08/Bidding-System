// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components/admin/AdminSearchDropdown.jsx
import { Archive, Gavel, Shield, Users, X } from "lucide-react";
import { useMemo } from "react";

const ICON_MAP = {
  project: Archive,
  supplier: Users,
  bid: Gavel,
  record: Shield,
};

export default function AdminSearchDropdown({ query, onQueryChange, projects, suppliers, bids, blockchainRecords, onSelectResult }) {
  const results = useMemo(() => {
    if (!query.trim()) {
      return { project: [], supplier: [], bid: [], record: [] };
    }

    const q = query.toLowerCase();

    return {
      project: projects.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)),
      supplier: suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.company.toLowerCase().includes(q)),
      bid: bids.filter((b) => b.projectName.toLowerCase().includes(q) || b.supplierName.toLowerCase().includes(q)),
      record: blockchainRecords.filter(
        (r) => r.projectId.toLowerCase().includes(q) || r.winner.toLowerCase().includes(q) || r.hash.toLowerCase().includes(q)
      ),
    };
  }, [query, projects, suppliers, bids, blockchainRecords]);

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  const hasResults = totalResults > 0;
  const isEmpty = !query.trim();

  const categoryLabels = {
    project: { label: "Projects", icon: "project" },
    supplier: { label: "Suppliers", icon: "supplier" },
    bid: { label: "Bids", icon: "bid" },
    record: { label: "Blockchain Records", icon: "record" },
  };

  return (
    <div className="absolute left-0 right-0 top-12 z-50 w-full rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="text-xs font-semibold text-slate-600">SEARCH ADMIN</span>
        <div className="flex-1" />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="rounded-xl p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
        {isEmpty ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-slate-500">Type to search projects, suppliers, bids, or records...</p>
          </div>
        ) : !hasResults ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-slate-500">No results found for "{query}"</p>
          </div>
        ) : (
          Object.entries(categoryLabels).map(([category, { label, icon }]) => {
            const categoryResults = results[category];
            if (categoryResults.length === 0) return null;

            const IconComponent = ICON_MAP[icon];

            return (
              <div key={category}>
                <div className="sticky top-0 border-b border-slate-100 bg-slate-50 px-4 py-2">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-600">
                    <IconComponent className="h-3 w-3" />
                    {label}
                  </p>
                </div>
                {categoryResults.map((item) => {
                  let displayName = "";
                  let displayMeta = "";

                  if (category === "project") {
                    displayName = item.name;
                    displayMeta = `${item.id} • ${item.status}`;
                  } else if (category === "supplier") {
                    displayName = item.company;
                    displayMeta = `${item.name} • ${item.status}`;
                  } else if (category === "bid") {
                    displayName = item.projectName;
                    displayMeta = `${item.supplierName} • ₱${item.bidAmount.toLocaleString()}`;
                  } else if (category === "record") {
                    displayName = item.projectId;
                    displayMeta = `${item.winner} • ${item.timestamp}`;
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectResult(category, item)}
                      className="w-full border-t border-slate-100 px-4 py-3 text-left transition-colors first:border-0 hover:bg-slate-50"
                    >
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
    </div>
  );
}
