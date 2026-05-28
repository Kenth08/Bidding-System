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

        <section className="mb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Open Bidding Opportunities</h2>
            <div className="text-sm text-slate-500">Publicly visible — no login required to view</div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {loading ? <div>Loading...</div> : open.length ? open.map((p) => (
              <div key={p.id} onClick={() => handleOpenClick(p.id)} role="button" tabIndex={0} className="cursor-pointer rounded-2xl border bg-white p-5 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{p.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{p.procurement_type} • ₱{Number(p.budget || 0).toLocaleString()}</p>
                  </div>
                  <Badge>Open</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-600">{p.requirements || p.description || ''}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <div>Deadline: {p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</div>
                  <div>{p.procurement_category || ''}</div>
                </div>
              </div>
            )) : <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">No open biddings at the moment.</div>}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Awarded Projects / Procurement Results</h2>
            <div className="text-sm text-slate-500">Completed procurements and award records</div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {loading ? <div>Loading...</div> : awarded.length ? awarded.map((a) => (
              <div key={a.id} className="rounded-2xl border bg-slate-50 p-5 opacity-90">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{a.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{a.procurement_type} • ₱{Number(a.budget || 0).toLocaleString()}</p>
                  </div>
                  <Badge variant="awarded">Awarded</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-600">Winner: {a.winner} • Award: ₱{Number(a.award_amount || 0).toLocaleString()}</p>
                <div className="mt-4 text-xs text-slate-500">Awarded at: {a.awarded_at ? new Date(a.awarded_at).toLocaleDateString() : '—'}</div>
              </div>
            )) : <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">No awarded projects yet. Check back after procurement is completed.</div>}
          </div>
        </section>

        <aside className="mt-12 rounded-2xl border bg-white p-6 text-center">
          <h3 className="text-lg font-semibold">Want to participate in bidding?</h3>
          <p className="mt-2 text-sm text-slate-500">Register as a supplier to submit proposals and join procurement opportunities.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link href="/register"><a className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Register Supplier</a></Link>
            <Link href="/login"><a className="rounded-xl border px-4 py-2 text-sm font-semibold text-emerald-600">Login</a></Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
