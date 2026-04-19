// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\SearchBar.jsx
import { Search } from "lucide-react";

/**
 * @param {{
 * value: string,
 * onChange: (event: import('react').ChangeEvent<HTMLInputElement>) => void,
 * placeholder?: string,
 * className?: string
 * }} props
 */
export default function SearchBar({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/30"
      />
    </div>
  );
}
