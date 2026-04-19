// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\LoadingSkeleton.jsx
export default function LoadingSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 border-b border-slate-50 px-6 py-4">
          <div className="h-3.5 flex-1 rounded-lg bg-slate-100" />
          <div className="h-3.5 w-24 rounded-lg bg-slate-100" />
          <div className="h-3.5 w-20 rounded-lg bg-slate-100" />
          <div className="h-5 w-16 rounded-md bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
