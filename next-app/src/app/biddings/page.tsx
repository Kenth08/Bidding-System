"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { projectsAPI, authAPI } from "@/services/api";
import { useRouter } from "next/navigation";

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: string }) {
  const cls = variant === 'awarded' ? 'inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700' : 'inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700';
  return <span className={cls}>{children}</span>;
}

export default function BiddingsPage() {
  const [open, setOpen] = useState<any[]>([]);
  const [awarded, setAwarded] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [openRes, awardedRes] = await Promise.all([
          fetch('/api/public/projects?section=open'),
          fetch('/api/public/projects?section=awarded'),
        ]);
        const openJson = openRes.ok ? await openRes.json() : [];
        const awardedJson = awardedRes.ok ? await awardedRes.json() : [];
        if (!mounted) return;
        setOpen(openJson);
        setAwarded(awardedJson);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleOpenClick(projectId: string) {
    try {
      const me = await authAPI.me();
      if (!me?.data) {
        router.push(`/login?next=/projects/${projectId}&message=${encodeURIComponent('Please log in or create an account to participate in bidding.')}`);
        return;
      }
      const user = me.data;
      if (user.role !== 'supplier' || !['approved','active'].includes(user.status)) {
        // show approval message
        alert('Your supplier account must be approved before joining bidding opportunities.');
        return;
      }
      // approved supplier — go to project details
      router.push(`/projects/${projectId}`);
    } catch (e) {
      router.push(`/login?next=/projects/${projectId}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl py-12 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Procurement Opportunities</h1>
          <p className="mt-2 text-sm text-slate-500">Browse open biddings and awarded procurement results.</p>
        </header>

        {/* Prominent Supplier CTA (top) */}
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Want to participate in procurement?</h3>
              <p className="mt-1 text-sm text-slate-500">Register as a supplier to submit proposals, participate in bidding, and access procurement opportunities.</p>
            </div>
            <div className="mt-2 flex gap-3 md:mt-0">
              <Link href="/register"><a className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Register Supplier</a></Link>
              <Link href="/login"><a className="rounded-xl border px-4 py-2 text-sm font-semibold text-emerald-600">Login</a></Link>
            </div>
          </div>
        </div>

        <section className="mb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Open Bidding Opportunities</h2>
            <div className="text-sm text-slate-500">Publicly visible — no login required to view</div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {loading ? <div>Loading...</div> : open.length ? open.map((p) => (
              <div key={p.id} onClick={() => handleOpenClick(p.id)} role="button" tabIndex={0} className="cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 transition-transform hover:scale-[1.01] hover:shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{p.procurement_type || 'Procurement'}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{p.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{String(p.requirements || p.description || '').length > 140 ? `${String(p.requirements || p.description || '').slice(0,140)}…` : (p.requirements || p.description || '')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge>Open</Badge>
                    <div className="mt-2 text-xs text-slate-500">
                      <div>₱{Number(p.budget || 0).toLocaleString()}</div>
                      <div className="mt-2">Deadline: <span className="font-medium text-slate-700">{p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</span></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-slate-400">{p.procurement_category || ''}</div>
              </div>
            )) : <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">No open bidding opportunities are currently available.</div>}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Awarded Projects / Procurement Results</h2>
            <div className="text-sm text-slate-500">Completed procurements and award records</div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {loading ? <div>Loading...</div> : awarded.length ? awarded.map((a) => (
              <div key={a.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 opacity-95">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{a.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{a.procurement_type} • ₱{Number(a.budget || 0).toLocaleString()}</p>
                  </div>
                  <Badge variant="awarded">Awarded</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-600">Winner: <span className="font-medium text-slate-800">{a.winner}</span></p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <div>Awarded: ₱{Number(a.award_amount || 0).toLocaleString()}</div>
                  <div>{a.awarded_at ? new Date(a.awarded_at).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            )) : <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">No completed procurement results available yet.</div>}
          </div>
        </section>

        {/* CTA moved to top for better visibility */}
      </div>
    </div>
  );
}
