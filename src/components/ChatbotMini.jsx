// ============================================================
// ChatbotMini.jsx - Centered modal chatbot (RippleHire replica page)
// ============================================================
import { useEffect, useRef } from "react";
import { X, Send, RotateCcw, ArrowUpRight, Loader2 } from "lucide-react";
import { useChatEngine } from "./useChatEngine.js";
import MessageBubble from "./MessageBubble.jsx";
import { useToast } from "./Toast.jsx";

export default function ChatbotMini({ db, snapshot, currentUser, onClose, onOpenDashboard, refreshSnapshot }) {
  const toast = useToast();
  const engine = useChatEngine({ snapshot, refreshSnapshot, currentUser, toast });
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [engine.messages, engine.thinking]);

  // Esc closes
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[51] w-[480px] max-w-[92vw] h-[600px] max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-pop-in">
        {/* Header - LOGO REPLACED */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex items-center gap-2">
          <img src="/logo.png" alt="" className="w-5 h-5" />
          <div className="flex-1">
            <div className="font-bold text-sm">Recruiter Copilot</div>
            <div className="text-[11px] text-blue-100">Schedule interviews in one sentence</div>
          </div>
          <button onClick={engine.reset} title="Reset" className="p-1.5 hover:bg-white/15 rounded">
            <RotateCcw size={14} />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/15 rounded">
            <X size={16} />
          </button>
        </div>

        {/* Redirect link */}
        <button
          onClick={onOpenDashboard}
          className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center gap-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition group"
        >
          <ArrowUpRight size={14} />
          Open in Recruiter Copilot Dashboard
          <span className="ml-auto text-blue-600 group-hover:translate-x-0.5 transition">→</span>
        </button>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50/60">
          {engine.messages.map((m, idx) => (
            <MessageBubble 
              key={m.id} 
              message={m} 
              snapshot={snapshot} 
              engine={engine}
              onSuggestionClick={(text) => engine.setInput(text)}
              suggestionText={m.suggestionText || null}
            />
          ))}
          {engine.thinking && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-300 w-fit">
              <Loader2 size={14} className="animate-spin text-blue-600" />
              <span className="text-xs text-slate-700 font-medium">Thinking...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 p-3 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              value={engine.input}
              onChange={e => engine.setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); engine.send(); } }}
              rows={3}
              placeholder="Schedule Interview 1 for..."
              className="flex-1 resize-none px-3 py-2 text-sm border-2 border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-500"
            />
            <button onClick={engine.send} disabled={!engine.input.trim()} className="p-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
