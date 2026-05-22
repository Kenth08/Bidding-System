import React from 'react'
import { Loader2 } from 'lucide-react'

export default function LoadingButton({
  isLoading, onClick, children, className = '',
  disabled = false, type = 'button', loadingText
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${className} inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 ${isLoading ? 'cursor-not-allowed opacity-75' : 'hover:translate-y-[-1px]'}`}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {isLoading ? (loadingText || children) : children}
    </button>
  )
}
