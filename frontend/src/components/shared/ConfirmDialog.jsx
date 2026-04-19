// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\components\shared\ConfirmDialog.jsx
import Modal from "./Modal";

/**
 * @param {{
 * isOpen: boolean,
 * onClose: () => void,
 * onConfirm: () => void,
 * title: string,
 * message: string,
 * confirmLabel?: string,
 * confirmVariant?: 'danger'|'primary',
 * icon?: import('react').ReactNode,
 * infoCard?: import('react').ReactNode
 * }} props
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  icon,
  infoCard,
}) {
  const confirmClass =
    confirmVariant === "danger"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-emerald-500 hover:bg-emerald-600";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {icon ? <div className="mx-auto w-fit rounded-xl bg-emerald-50 p-2 text-emerald-600">{icon}</div> : null}
        <p className="text-sm text-slate-600">{message}</p>
        {infoCard ? <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">{infoCard}</div> : null}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}