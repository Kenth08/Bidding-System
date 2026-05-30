export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-8 w-20 rounded-xl bg-slate-200" />)}</div>
      <div className="h-10 w-full max-w-xs rounded-xl bg-slate-100" />
      <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 px-6 py-4 border-b border-slate-50">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="h-4 w-20 rounded bg-slate-100" />
            <div className="h-4 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
