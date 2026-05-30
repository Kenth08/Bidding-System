export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-100" />)}
      </div>
      <div className="h-64 rounded-2xl bg-slate-100" />
    </div>
  );
}
