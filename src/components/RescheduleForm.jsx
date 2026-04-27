// RescheduleForm.jsx
import { useState } from "react";
import { X, Calendar } from "lucide-react";
import { RESCHEDULE_REASONS, formatDate, formatTime, getTodayDateString, validateDateTime } from "../utils.js";

export default function RescheduleForm({ interview, onClose, onSave }) {
  const [newDate, setNewDate] = useState(interview.slot_date);
  const [newStart, setNewStart] = useState(interview.start_time);
  const [newEnd, setNewEnd] = useState(interview.end_time);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState({});

  const minDate = getTodayDateString();

  const validate = () => {
    const errs = {};
    const dateTimeError = validateDateTime(newDate, newStart, newEnd);
    if (dateTimeError) {
      if (dateTimeError.includes("Date") || dateTimeError.includes("Past dates")) errs.newDate = dateTimeError;
      else if (dateTimeError.includes("Start time")) errs.newStart = dateTimeError;
      else if (dateTimeError.includes("End time")) errs.newEnd = dateTimeError;
    }
    if (!reason) errs.reason = "Confirm interview change reason is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(newDate, newStart, newEnd, reason);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full pointer-events-auto animate-pop-in">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <h3 className="font-bold text-lg">Reschedule Interview</h3>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/15 rounded"><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Current details */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
              <div className="font-semibold text-slate-900 mb-1">Current schedule:</div>
              <div className="text-slate-800">{formatDate(interview.slot_date)} · {formatTime(interview.start_time)}–{formatTime(interview.end_time)}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                New Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={newDate}
                min={minDate}
                onChange={e => { setNewDate(e.target.value); setErrors({ ...errors, newDate: "" }); }}
                className={`w-full px-3 py-2 text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 ${errors.newDate ? "border-red-400" : "border-slate-300"}`}
              />
              <div className="min-h-[1.25rem] mt-1">
                {errors.newDate && <span className="text-xs text-red-600 block">{errors.newDate}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  New Start Time <span className="text-red-600">*</span>
                </label>
                <input
                  type="time"
                  value={newStart}
                  onChange={e => { setNewStart(e.target.value); setErrors({ ...errors, newStart: "", newEnd: "" }); }}
                  className={`w-full px-3 py-2 text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 ${errors.newStart ? "border-red-400" : "border-slate-300"}`}
                />
                <div className="min-h-[1.25rem] mt-1">
                  {errors.newStart && <span className="text-xs text-red-600 block">{errors.newStart}</span>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  New End Time <span className="text-red-600">*</span>
                </label>
                <input
                  type="time"
                  value={newEnd}
                  onChange={e => { setNewEnd(e.target.value); setErrors({ ...errors, newEnd: "" }); }}
                  className={`w-full px-3 py-2 text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 ${errors.newEnd ? "border-red-400" : "border-slate-300"}`}
                />
                <div className="min-h-[1.25rem] mt-1">
                  {errors.newEnd && <span className="text-xs text-red-600 block">{errors.newEnd}</span>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Confirm interview change reason <span className="text-red-600">*</span>
              </label>
              <select
                value={reason}
                onChange={e => { setReason(e.target.value); setErrors({ ...errors, reason: "" }); }}
                className={`w-full px-3 py-2 text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 ${errors.reason ? "border-red-400" : "border-slate-300"}`}
              >
                <option value="">-- Select reason --</option>
                {RESCHEDULE_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <div className="min-h-[1.25rem] mt-1">
                {errors.reason && <span className="text-xs text-red-600 block">{errors.reason}</span>}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-semibold">
                Reschedule
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

