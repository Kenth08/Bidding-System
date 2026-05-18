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
      className={`${className} flex items-center gap-2 justify-center ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading ? (loadingText || children) : children}
    </button>
  )
}
