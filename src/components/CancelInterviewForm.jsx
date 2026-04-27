// CancelInterviewForm.jsx
import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { CANCELLATION_REASONS, formatDate, formatTime } from "../utils.js";

export default function CancelInterviewForm({ interview, onClose, onSave }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!reason) {
      setError("Reason for cancellation is required");
      return;
    }
    setError("");
    onSave(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-slate-200">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600" />
            <h2 className="text-base font-bold text-slate-900">
              Cancel Interview for {interview.candidate.name}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X size={18} className="text-slate-700" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Interview info */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1">
            <div><span className="font-semibold">Date:</span> {formatDate(interview.slot_date)}</div>
            <div><span className="font-semibold">Time:</span> {formatTime(interview.start_time)} - {formatTime(interview.end_time)}</div>
            <div><span className="font-semibold">Round:</span> {interview.round_name}</div>
            <div><span className="font-semibold">Interviewer:</span> {interview.interviewer.name}</div>
            <div><span className="font-semibold">Mode:</span> {interview.mode}</div>
          </div>

          {/* Reason dropdown */}
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-1.5">
              Reason for cancellation: <span className="text-red-600">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(""); }}
              className={`w-full px-3 py-2 border-2 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 ${
                error ? "border-red-500" : "border-slate-300"
              }`}
            >
              <option value="">-- Select reason --</option>
              {CANCELLATION_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <div className="min-h-[1.25rem] mt-1">
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-300 rounded p-3 text-xs text-amber-900">
            ⚠️ This action will cancel the interview. Both the candidate and interviewer will be notified via email and the email will be sent in real-time.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t-2 border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border-2 border-slate-300 text-slate-800 text-sm font-bold rounded hover:bg-slate-100"
          >
            Keep Interview
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded flex items-center gap-1"
          >
            <X size={14} /> Cancel Interview
          </button>
        </div>
      </div>
    </div>
  );
}
