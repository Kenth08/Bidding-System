export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-40 rounded-lg bg-slate-200" />
      <div className="h-10 w-full max-w-xs rounded-xl bg-slate-100" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="flex justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
            </div>
            <div className="h-9 w-24 rounded-xl bg-slate-200" />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((j) => <div key={j} className="h-4 rounded bg-slate-100" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
