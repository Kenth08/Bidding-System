"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ArrowLeft, Award, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, FileText, Search as SearchIcon, Tag, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/shared/SearchBar";
import EmptyState from "@/components/shared/EmptyState";
import Modal from "@/components/shared/Modal";

type PublicProject = Record<string, any> & {
  id?: string;
  title?: string;
  project_title?: string;
  procurement_type?: string;
  procurement_category?: string;
  budget?: number | string | null;
  deadline?: string | null;
  public_result_expiry_date?: string | null;
  awarded_at?: string | null;
  description?: string;
  status?: string;
  winner?: { supplier_name?: string; bid_amount?: number | string } | null;
};

function safeStr(value: unknown) {
  return (value ?? "").toString().trim().toLowerCase();
}

function normalizeResponse(data: unknown): PublicProject[] {
  if (Array.isArray(data)) return data as PublicProject[];
  if (data && typeof data === "object") {
    const response = data as Record<string, unknown>;
    if (Array.isArray(response.results)) return response.results as PublicProject[];
    if (Array.isArray(response.data)) return response.data as PublicProject[];
  }
  return [];
}

function formatPeso(value: unknown) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function getProjectTitle(project: PublicProject) {
  return project.title || project.project_title || "Untitled Procurement";
}

function getProjectType(project: PublicProject) {
  return project.procurement_type || "—";
}

function getProjectCategory(project: PublicProject) {
  return project.procurement_category || "Uncategorized";
}

function getProjectBudget(project: PublicProject) {
  return project.budget ?? 0;
}

function getWinnerName(project: PublicProject) {
  const winner = project.winner;
  if (!winner || typeof winner !== "object") return "—";
  return winner.supplier_name || "—";
}

function getWinnerBid(project: PublicProject) {
  const winner = project.winner;
  if (!winner || typeof winner !== "object") return 0;
  return winner.bid_amount ?? 0;
}

export default function PublicBiddingsPage() {
  const router = useRouter();
  const [openProjects, setOpenProjects] = useState<PublicProject[]>([]);
  const [awardedProjects, setAwardedProjects] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedProject, setSelectedProject] = useState<{ project: PublicProject; section: "open" | "awarded" } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProjects() {
      setLoading(true);
      try {
        const [openResponse, awardedResponse] = await Promise.all([
          axios.get("/api/public/projects?section=open"),
          axios.get("/api/public/projects?section=awarded"),
        ]);

        if (!mounted) return;

        setOpenProjects(normalizeResponse(openResponse.data));
        setAwardedProjects(normalizeResponse(awardedResponse.data));
      } catch {
        if (!mounted) return;
        setOpenProjects([]);
        setAwardedProjects([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProjects();
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const values = [...openProjects, ...awardedProjects]
      .map((project) => getProjectCategory(project))
      .filter((category) => category && category !== "Uncategorized");

    return ["All", ...Array.from(new Set(values))];
  }, [openProjects, awardedProjects]);

  const matchesFilters = (project: PublicProject) => {
    const query = safeStr(search);
    const category = getProjectCategory(project);
    const searchMatch = !query || [project.title, project.project_title, project.procurement_type, project.procurement_category].some((value) => safeStr(value).includes(query));
    const categoryMatch = activeCategory === "All" || category === activeCategory;
    return searchMatch && categoryMatch;
  };

  const filteredOpen = useMemo(() => openProjects.filter(matchesFilters), [openProjects, search, activeCategory]);
  const filteredAwarded = useMemo(() => awardedProjects.filter(matchesFilters), [awardedProjects, search, activeCategory]);

  function handleOpenClick(project: PublicProject, section: "open" | "awarded") {
    setSelectedProject({ project, section });
  }

  const hasOpenProjects = openProjects.length > 0;
  const hasAwardedProjects = awardedProjects.length > 0;
  const filteringActive = Boolean(search.trim()) || activeCategory !== "All";

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <BriefcaseBusiness className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">ProcureChain</p>
              <p className="text-xs text-slate-400">Public Biddings</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">Public Transparency Portal</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Browse open bidding opportunities and awarded results</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">Filter public procurements by keyword or category without signing in.</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <SearchIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Live public listings</p>
                <p className="text-xs text-slate-400">Search and category filters update both sections instantly.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, procurement type, or category"
            />
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${activeCategory === category ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[1, 2].map((index) => (
              <div key={index} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 h-6 w-56 animate-pulse rounded-full bg-slate-100" />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3].map((card) => (
                    <div key={card} className="h-44 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Open Bidding Opportunities</h2>
                  <p className="mt-1 text-sm text-slate-500">Active procurement opportunities available for public viewing.</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                  {filteredOpen.length} result{filteredOpen.length === 1 ? "" : "s"}
                </div>
              </div>

              {filteredOpen.length === 0 ? (
                hasOpenProjects && filteringActive ? (
                  <EmptyState
                    icon={SearchIcon}
                    title="No open bidding opportunities matched your search or category filter."
                    subtitle="Try another keyword or switch to a different procurement category."
                  />
                ) : (
                  <EmptyState
                    icon={BriefcaseBusiness}
                    title="No open bidding opportunities are currently available."
                    subtitle="New opportunities will appear here once they are published."
                  />
                )
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredOpen.map((project) => (
                    <button
                      key={project.id || getProjectTitle(project)}
                      type="button"
                      onClick={() => handleOpenClick(project, "open")}
                      className="group flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                              Open
                            </span>
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                              {getProjectCategory(project)}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold leading-6 text-slate-900 group-hover:text-emerald-700">
                            {getProjectTitle(project)}
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">{getProjectType(project)}</p>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                          <FileText className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-auto space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
                        <div className="flex items-center justify-between gap-4">
                          <span className="inline-flex items-center gap-2"><Tag className="h-4 w-4 text-slate-400" /> Category</span>
                          <span className="font-medium text-slate-800">{getProjectCategory(project)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400" /> Deadline</span>
                          <span className="font-medium text-slate-800">{formatDate(project.deadline)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400" /> Budget</span>
                          <span className="font-semibold text-slate-900">{formatPeso(getProjectBudget(project))}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Awarded Projects / Procurement Results</h2>
                  <p className="mt-1 text-sm text-slate-500">Completed procurements and award results visible to the public.</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                  {filteredAwarded.length} result{filteredAwarded.length === 1 ? "" : "s"}
                </div>
              </div>

              {filteredAwarded.length === 0 ? (
                hasAwardedProjects && filteringActive ? (
                  <EmptyState
                    icon={SearchIcon}
                    title="No completed procurement results matched your search or category filter."
                    subtitle="Try another keyword or clear the category filter to see all awarded items."
                  />
                ) : (
                  <EmptyState
                    icon={Award}
                    title="No completed procurement results available yet."
                    subtitle="Awarded projects will appear here after the procurement process is completed."
                  />
                )
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredAwarded.map((project) => (
                    <button
                      key={project.id || getProjectTitle(project)}
                      type="button"
                      onClick={() => handleOpenClick(project, "awarded")}
                      className="group flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                              Awarded
                            </span>
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                              {getProjectCategory(project)}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold leading-6 text-slate-900 group-hover:text-sky-700">
                            {getProjectTitle(project)}
                          </h3>
                          <p className="mt-2 text-sm text-slate-500">Winner: {getWinnerName(project)}</p>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100">
                          <Trophy className="h-5 w-5" />
                        </div>
                      </div>

                      <div className="mt-auto space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
                        <div className="flex items-center justify-between gap-4">
                          <span className="inline-flex items-center gap-2"><Tag className="h-4 w-4 text-slate-400" /> Category</span>
                          <span className="font-medium text-slate-800">{getProjectCategory(project)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-slate-400" /> Awarded</span>
                          <span className="font-medium text-slate-800">{formatDate(project.awarded_at)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400" /> Winning Bid</span>
                          <span className="font-semibold text-slate-900">{formatPeso(getWinnerBid(project))}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.section === "open" ? "Open Bidding Opportunity" : "Awarded Procurement Result"}
        subtitle={selectedProject ? getProjectTitle(selectedProject.project) : undefined}
        size="lg"
      >
        {selectedProject ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Title</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{getProjectTitle(selectedProject.project)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{getProjectCategory(selectedProject.project)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{getProjectType(selectedProject.project)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budget</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatPeso(getProjectBudget(selectedProject.project))}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedProject.project.description || "No additional description is available for this procurement item."}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}