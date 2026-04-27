// ============================================================
// Toast.jsx - Bottom-right toast notifications
// ============================================================
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";

const ToastCtx = createContext(null);

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((kind, message) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, kind, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const ctx = {
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    warn: (m) => push("warn", m),
    info: (m) => push("info", m),
  };

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => <ToastBubble key={t.id} {...t} onClose={() => setToasts(arr => arr.filter(x => x.id !== t.id))} />)}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastBubble({ kind, message, onClose }) {
  const conf = {
    success: { Icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-300", icon: "text-emerald-600", text: "text-emerald-900" },
    error: { Icon: XCircle, bg: "bg-red-50", border: "border-red-300", icon: "text-red-600", text: "text-red-900" },
    warn: { Icon: AlertCircle, bg: "bg-amber-50", border: "border-amber-300", icon: "text-amber-700", text: "text-amber-900" },
    info: { Icon: Info, bg: "bg-blue-50", border: "border-blue-300", icon: "text-blue-600", text: "text-blue-900" }
  }[kind] || {};
  const { Icon, bg, border, icon, text } = conf;
  return (
    <div className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 ${bg} ${border} border-2 rounded-lg shadow-lg min-w-[280px] max-w-md animate-toast-in`}>
      <Icon size={18} className={`${icon} flex-shrink-0 mt-0.5`} />
      <div className={`flex-1 text-sm font-medium ${text}`}>{message}</div>
      <button onClick={onClose} className={`${icon} hover:opacity-70`}><X size={14} /></button>
    </div>
  );
}
