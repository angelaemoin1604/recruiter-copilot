// ============================================================
// ChatbotDock.jsx - Right-side dock chatbot (full experience)
// ============================================================
import { useEffect, useRef } from "react";
import { Sparkles, X, Send, RotateCcw, Loader2 } from "lucide-react";
import { useChatEngine } from "./useChatEngine.js";
import MessageBubble from "./MessageBubble.jsx";
import { useToast } from "./Toast.jsx";

export default function ChatbotDock({ snapshot, currentUser, refreshSnapshot, onClose, onJumpToInterviews, onJumpToCandidates, prefilledMessage }) {
  const toast = useToast();
  const engine = useChatEngine({ snapshot, refreshSnapshot, currentUser, toast });
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [engine.messages, engine.thinking]);

  // Pre-fill input when prefilledMessage is provided
  useEffect(() => {
    if (prefilledMessage) {
      engine.setInput(prefilledMessage);
    }
  }, [prefilledMessage]);

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed top-[57px] right-0 bottom-0 w-[440px] bg-white border-l-2 border-slate-200 shadow-xl z-30 flex flex-col animate-slide-right">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={20} />
          <div>
            <div className="font-bold text-base">Recruiter Copilot</div>
            <div className="text-[11px] text-blue-100">Full chat workspace</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={engine.reset} title="Reset" className="p-1.5 hover:bg-white/15 rounded">
            <RotateCcw size={14} />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-white/15 rounded">
            <X size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/60">
        {engine.messages.map(m => (
          <MessageBubble
            key={m.id}
            message={m}
            snapshot={snapshot}
            engine={engine}
            onJumpToInterviews={onJumpToInterviews}
            onJumpToCandidates={onJumpToCandidates}
          />
        ))}
        {engine.thinking && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-300 w-fit">
            <Loader2 size={14} className="animate-spin text-blue-600" />
            <span className="text-xs text-slate-700 font-medium">Thinking...</span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={engine.input}
            onChange={e => engine.setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); engine.send(); } }}
            rows={2}
            placeholder="Schedule Interview 1 for..."
            className="flex-1 resize-none px-3 py-2 text-sm border-2 border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-500"
          />
          <button onClick={engine.send} disabled={!engine.input.trim()} className="p-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-300">
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 text-[10px] text-slate-600">Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded">Esc</kbd> to close · <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded">Ctrl+K</kbd> to reopen</div>
      </div>
    </div>
  );
}
