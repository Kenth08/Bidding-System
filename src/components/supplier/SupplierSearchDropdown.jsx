// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\supplier\SupplierSearchDropdown.jsx
import { FileText, FolderOpen, X } from "lucide-react";
import { useMemo } from "react";

const ICON_MAP = {
  project: FolderOpen,
  bid: FileText,
};

export default function SupplierSearchDropdown({ query, onQueryChange, projects, bids, onSelectResult }) {
  const results = useMemo(() => {
    if (!query.trim()) {
      return { project: [], bid: [] };
    }

    const q = query.toLowerCase();

    return {
      project: projects.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)),
      bid: bids.filter((b) => b.projectName.toLowerCase().includes(q) || b.companyName.toLowerCase().includes(q)),
    };
  }, [query, projects, bids]);

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  const hasResults = totalResults > 0;
  const isEmpty = !query.trim();

  const categoryLabels = {
    project: { label: "Available Projects", icon: "project" },
    bid: { label: "My Bids", icon: "bid" },
  };

  return (
    <div className="absolute left-0 right-0 top-12 z-50 w-full rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="text-xs font-semibold text-slate-600">SEARCH</span>
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
            <p className="text-sm text-slate-500">Type to search available projects and bids...</p>
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
                    displayMeta = `Budget: ₱${item.budget.toLocaleString()} • ${item.status}`;
                  } else if (category === "bid") {
                    displayName = item.projectName;
                    displayMeta = `₱${item.bidAmount.toLocaleString()} • ${item.status}`;
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
