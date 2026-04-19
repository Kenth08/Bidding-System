// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\Modal.jsx
import { useEffect } from "react";
import { X } from "lucide-react";

const SIZE_CLASS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

/**
 * @param {{
 * isOpen: boolean,
 * onClose: () => void,
 * title?: string,
 * subtitle?: string,
 * size?: 'sm'|'md'|'lg',
 * children: import('react').ReactNode
 * }} props
 */
export default function Modal({ isOpen, onClose, title, subtitle, children, size = "lg" }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className={`relative w-full ${SIZE_CLASS[size] || SIZE_CLASS.lg} overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl`}>
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            {title ? <h3 className="text-base font-semibold text-slate-900">{title}</h3> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
