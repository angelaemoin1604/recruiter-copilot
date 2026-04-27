// ============================================================
// ConfirmDialog.jsx - Modal confirmation for destructive/negative flows
// ============================================================
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-[90] animate-fade-in" onClick={onCancel} />
      <div className="fixed inset-0 z-[91] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full pointer-events-auto animate-pop-in">
          <div className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-full ${danger ? "bg-red-100" : "bg-amber-100"}`}>
                <AlertTriangle size={20} className={danger ? "text-red-600" : "text-amber-700"} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-base">{title}</h3>
                <p className="text-sm text-slate-700 mt-1">{message}</p>
              </div>
            </div>
          </div>
          <div className="px-5 py-3 bg-slate-50 rounded-b-lg flex justify-end gap-2">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-md text-slate-800 hover:bg-white">
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-semibold rounded-md text-white ${
                danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
