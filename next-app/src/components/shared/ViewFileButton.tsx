"use client";
import { useState } from "react";

interface ViewFileButtonProps {
  file: string;
  label?: string;
  className?: string;
}

export default function ViewFileButton({ file, label = "View File", className }: ViewFileButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleClick() {
    if (!file) {
      setError("No file available.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setLoading(true);
    setError("");
    const url = `/api/files/preview?file=${encodeURIComponent(file)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => setLoading(false), 1000);
  }

  return (
    <span className="relative inline-flex items-center gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={handleClick}
        className={className || "text-xs font-medium text-emerald-600 hover:underline disabled:opacity-50 disabled:cursor-wait"}
      >
        {loading ? "Opening file..." : label}
      </button>
      {error && (
        <span className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-red-600 px-2 py-1 text-[11px] text-white shadow-lg">
          {error}
        </span>
      )}
    </span>
  );
}
