// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\pages\public\LandingPage.jsx
import {
  Activity,
  Award,
  Building2,
  CheckCircle,
  ChevronDown,
  Eye,
  FileText,
  Link,
  Lock,
  PlusCircle,
  Scale,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function LandingPage({ onAdminLogin, onViewResults, onRegister }) {
  const [latestRecord, setLatestRecord] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState({
    totalProjects: 0,
    totalBids: 0,
    activeBidding: 0,
  });

  useEffect(() => {
    async function fetchPublicData() {
      try {
        const res = await axios.get(`${BASE_URL}/public/results/`);
        const records = Array.isArray(res.data) ? res.data : [];
        if (records.length > 0) {
          const latest = records[0];
          setLatestRecord({
            id: latest.project_id,
            project_title: latest.project_title,
            project_ref_id: latest.project_id ? `PRJ-${String(latest.project_id).substring(0, 6).toUpperCase()}` : null,
            winner_name: latest.winner?.supplier_name,
            winner_company: latest.winner?.supplier_name,
            bid_amount: latest.winner?.bid_amount,
            recorded_at: latest.awarded_at,
          });
        } else {
          setLatestRecord(null);
        }
      } catch (err) {
        console.error("Could not load blockchain data:", err);
        setLatestRecord(null);
      }

      try {
        const [projStatsRes, bidsRes] = await Promise.all([
          axios.get(`${BASE_URL}/projects/public/stats/`),
          axios.get(`${BASE_URL}/bids/public/`).catch(() => ({ data: { count: 0 } })),
        ]);

        const projectStats = projStatsRes.data || {};
        const bidsPayload = bidsRes.data || {};
        const totalBids = typeof bidsPayload.count === "number"
          ? bidsPayload.count
          : Array.isArray(bidsPayload.results)
            ? bidsPayload.results.length
            : Array.isArray(bidsPayload)
              ? bidsPayload.length
              : 0;

        setLiveStats({
          totalProjects: Number(projectStats.total_projects || 0),
          totalBids,
          activeBidding: Number(projectStats.active_bidding || 0),
        });
      } catch (err) {
        console.error("Could not load stats:", err);
      } finally {
        setStatsLoading(false);
      }
    }

    fetchPublicData();
  }, []);

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return (
    <div className="bg-white">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-white">E-Procurement</p>
              <p className="text-xs text-slate-400">Blockchain System</p>
            </div>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#how-it-works" className="text-sm text-slate-400 transition-colors hover:text-white">
              How It Works
            </a>
            <a href="#features" className="text-sm text-slate-400 transition-colors hover:text-white">
              Features
            </a>
            <a href="#roles" className="text-sm text-slate-400 transition-colors hover:text-white">
              Roles
            </a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={onViewResults}
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              <Eye className="h-4 w-4" /> Public Results
            </button>
            <button
              type="button"
              onClick={onAdminLogin}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600"
            >
              Login
            </button>
          </div>

          <button
            type="button"
            onClick={onAdminLogin}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-600 md:hidden"
          >
            Login
          </button>
        </div>
      </nav>

      <section className="relative flex min-h-screen items-center overflow-hidden bg-slate-900 pb-10 pt-16">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="pointer-events-none absolute right-1/4 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-emerald-500 opacity-[0.05] blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
              Transparent
              <br />
              Procurement,
              <br />
              <span className="text-emerald-400">Secured by</span>
              <br />
              Blockchain
            </h1>

            <p className="mb-8 max-w-md text-base leading-relaxed text-slate-400">
              A blockchain-based e-procurement platform that ensures fair bidding, tamper-proof records, and full
              transparency for government and corporate procurement.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onAdminLogin}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-all active:scale-95 hover:bg-emerald-600"
              >
                <Shield className="h-4 w-4" /> Login
              </button>
              <button
                type="button"
                onClick={onViewResults}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3 text-sm text-slate-300 transition-all hover:border-slate-500 hover:text-white"
              >
                <Eye className="h-4 w-4" /> View Public Results
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              New supplier?{" "}
              <button type="button" onClick={onRegister} className="font-semibold text-emerald-400 hover:text-emerald-300">
                Register as Supplier
              </button>
            </p>

            <div className="flex items-center gap-6 mt-8 pt-8 border-t border-slate-800">
              {[
                { label: "Total Projects", value: statsLoading ? "..." : liveStats.totalProjects },
                { label: "Total Bids", value: statsLoading ? "..." : liveStats.totalBids },
                { label: "Active Bidding", value: statsLoading ? "..." : liveStats.activeBidding },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {latestRecord ? (
              <div
                className="rounded-2xl p-5 shadow-2xl"
                style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Latest Award</p>
                  <div className="flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#34d399" }} />
                    <span className="text-xs font-medium" style={{ color: "#34d399" }}>Verified</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: "Winner", value: latestRecord.winner_name || "-" },
                    { label: "Company", value: latestRecord.winner_company || "-" },
                    { label: "Bid Amount", value: latestRecord.bid_amount ? `₱${Number(latestRecord.bid_amount).toLocaleString()}` : "-" },
                    { label: "Award Date", value: formatDate(latestRecord.recorded_at) },
                    { label: "Project Ref", value: latestRecord.project_ref_id || `PRJ-${String(latestRecord.id || "").substring(0, 4).toUpperCase()}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-3" style={{ backgroundColor: "#0f172a" }}>
                      <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>{label}</p>
                      <p className="text-sm font-semibold text-white truncate">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: "#0f172a" }}>
                  <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>Project</p>
                  <p className="text-sm font-semibold text-white truncate">{latestRecord.project_title || "-"}</p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle className="w-3.5 h-3.5" style={{ color: "#34d399" }} />
                  <span className="text-xs" style={{ color: "#64748b" }}>Permanently stored · Cannot be altered</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <a href="#how-it-works" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-slate-500 md:block">
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </a>
      </section>

      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-500">PROCESS</p>
            <h2 className="text-3xl font-bold text-slate-900">How It Works</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              A clean procurement flow designed to keep participation fair and results verifiable by everyone.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            {[
              { step: "01", icon: PlusCircle, title: "Admin Creates Project", desc: "Scope, budget, and deadline defined" },
              { step: "02", icon: Users, title: "Suppliers Register", desc: "Approved by admin before bidding" },
              { step: "03", icon: FileText, title: "Bids Submitted", desc: "Secured through structured workflow" },
              { step: "04", icon: Lock, title: "Bidding Closes", desc: "System locks the bid window" },
              { step: "05", icon: Scale, title: "Admin Evaluates", desc: "Bids ranked by criteria" },
              { step: "06", icon: Shield, title: "Recorded on Chain", desc: "Winner stored permanently" },
            ].map(({ step, icon: Icon, title, desc }, index) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                {index < 5 ? <div className="absolute left-1/2 top-5 hidden h-px w-full bg-slate-100 lg:block" /> : null}
                <div className="relative z-10 mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900">
                  <Icon className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mb-1 text-xs font-bold text-slate-300">{step}</p>
                <p className="mb-1 text-xs font-semibold leading-tight text-slate-800">{title}</p>
                <p className="text-xs leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-500">CAPABILITIES</p>
            <h2 className="text-3xl font-bold text-slate-900">Key Features</h2>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Blockchain Transparency",
                desc: "Every final award is verifiable, traceable, and resistant to hidden edits.",
              },
              {
                icon: Lock,
                title: "Secure Bid Submission",
                desc: "Suppliers submit through a protected channel built for integrity.",
              },
              {
                icon: Activity,
                title: "Real-time Monitoring",
                desc: "Admins track live bid activity while the process stays controlled.",
              },
              {
                icon: Scale,
                title: "Automated Evaluation",
                desc: "Bids organized to support faster and consistent decision-making.",
              },
              {
                icon: Users,
                title: "Supplier Management",
                desc: "Manage registered vendors, submissions, and participation with clarity.",
              },
              {
                icon: Link,
                title: "Immutable Audit Trail",
                desc: "A permanent chain of records supports accountability and compliance.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:border-slate-200 hover:shadow-sm"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 transition-all group-hover:border-emerald-100 group-hover:bg-emerald-50">
                  <Icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-emerald-500" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-slate-800">{title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-500">ACCESS CONTROL</p>
            <h2 className="text-3xl font-bold text-slate-900">Three User Roles</h2>
            <p className="mt-2 text-sm text-slate-500">
              Each role has specific access to keep the process organized and transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                role: "Admin",
                color: "emerald",
                desc: "Controls the full procurement lifecycle.",
                actions: [
                  "Create and manage projects",
                  "Approve or reject suppliers",
                  "Evaluate and rank bids",
                  "Select winner and record to blockchain",
                ],
                cta: "Login",
                onClick: onAdminLogin,
              },
              {
                icon: Building2,
                role: "Supplier",
                color: "blue",
                desc: "Competes through secure and fair bidding.",
                actions: [
                  "Register and get approved",
                  "Browse available projects",
                  "Submit bids with proposals",
                  "Track status and view results",
                ],
                cta: "Login",
                onClick: onAdminLogin,
              },
              {
                icon: Eye,
                role: "Viewer",
                color: "slate",
                desc: "Observes results without modifying anything.",
                actions: [
                  "View awarded contracts",
                  "Verify blockchain records",
                  "Review project history",
                  "Audit outcomes with confidence",
                ],
                cta: "View Public Results",
                onClick: onViewResults,
              },
            ].map(({ icon: Icon, role, desc, actions, cta, onClick, color }) => (
              <div
                key={role}
                className="flex flex-col rounded-2xl border border-slate-100 p-6 transition-all hover:border-slate-200 hover:shadow-sm"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${
                    color === "emerald" ? "bg-emerald-50" : color === "blue" ? "bg-blue-50" : "bg-slate-100"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      color === "emerald" ? "text-emerald-500" : color === "blue" ? "text-blue-500" : "text-slate-400"
                    }`}
                  />
                </div>
                <h3 className="mb-1 text-base font-bold text-slate-900">{role}</h3>
                <p className="mb-4 text-xs text-slate-500">{desc}</p>
                <ul className="mb-6 flex-1 space-y-2">
                  {actions.map((action) => (
                    <li key={action} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-400" /> {action}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={onClick}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    color === "emerald"
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Ready to get started?</span>
          </div>
          <h2 className="mb-3 text-3xl font-bold text-white">Join the Platform</h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-slate-400">
            Register as a supplier to start bidding, or log in as an admin to manage the procurement process.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onRegister}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-600"
            >
              <Building2 className="h-4 w-4" /> Register as Supplier
            </button>
            <button
              type="button"
              onClick={onAdminLogin}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3 text-sm text-slate-300 transition-all hover:border-slate-500 hover:text-white"
            >
              <Shield className="h-4 w-4" /> Admin Login
            </button>
            <button
              type="button"
              onClick={onViewResults}
              className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
            >
              <Eye className="h-4 w-4" /> Public Results →
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
                  <Shield className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-sm font-bold text-white">E-Procurement</p>
              </div>
              <p className="text-xs text-slate-400">A blockchain-based procurement platform ensuring fair bidding, transparent records, and secure transactions.</p>
            </div>

            {/* Product column */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300 mb-3">Product</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#features" className="hover:text-emerald-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#roles" className="hover:text-emerald-400 transition-colors">
                    Roles
                  </a>
                </li>
              </ul>
            </div>

            {/* Company column */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300 mb-3">Company</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal column */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300 mb-3">Legal</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Compliance
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-600">© 2026 E-Procurement Blockchain System. All rights reserved.</p>
            <div className="flex items-center gap-6 text-xs text-slate-600">
              <a href="#" className="hover:text-emerald-400 transition-colors">
                Security
              </a>
              <a href="#" className="hover:text-emerald-400 transition-colors">
                Status
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
