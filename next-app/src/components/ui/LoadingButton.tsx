"use client";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface LoadingButtonProps {
  isLoading: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  loadingText?: string;
}

export default function LoadingButton({ isLoading, onClick, children, className = "", disabled = false, type = "button", loadingText }: LoadingButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${className} inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 ${isLoading ? "cursor-not-allowed opacity-75" : "hover:translate-y-[-1px]"}`}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading ? (loadingText || children) : children}
    </button>
  );
}
