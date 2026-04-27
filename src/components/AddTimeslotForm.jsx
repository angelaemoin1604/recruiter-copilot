// AddTimeslotForm.jsx
import { useState } from "react";
import { X, Calendar } from "lucide-react";
import { getTodayDateString, validateDateTime } from "../utils.js";

export default function AddTimeslotForm({ employee, currentUser, onClose, onSave }) {
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [repeat, setRepeat] = useState("none");
  const [mode, setMode] = useState(""); // "confirmed" | "pending"
  const [errors, setErrors] = useState({});

  const minDate = getTodayDateString();

  const validate = () => {
    const errs = {};
    const dateTimeError = validateDateTime(date, start, end);
    if (dateTimeError) {
      if (dateTimeError.includes("Date") || dateTimeError.includes("Past dates")) errs.date = dateTimeError;
      else if (dateTimeError.includes("Start time")) errs.start = dateTimeError;
      else if (dateTimeError.includes("End time")) errs.end = dateTimeError;
    }
    if (!mode) errs.mode = "Please select confirmed or pending";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ date, start, end, repeat, mode });
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full pointer-events-auto animate-pop-in">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <h3 className="font-bold text-lg">Add Timeslot</h3>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/15 rounded"><X size={16} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded p-3">
              <span className="font-semibold">Employee:</span> {employee.name} ({employee.employee_id})
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                value={date}
                min={minDate}
                onChange={e => { setDate(e.target.value); setErrors({ ...errors, date: "" }); }}
                className={`w-full px-3 py-2 text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 ${errors.date ? "border-red-400" : "border-slate-300"}`}
              />
              {errors.date && <span className="text-xs text-red-600 mt-1 block">{errors.date}</span>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Start Time <span className="text-red-600">*</span>
                </label>
                <input
                  type="time"
                  value={start}
                  onChange={e => { setStart(e.target.value); setErrors({ ...errors, start: "", end: "" }); }}
                  className={`w-full px-3 py-2 text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 ${errors.start ? "border-red-400" : "border-slate-300"}`}
                />
                {errors.start && <span className="text-xs text-red-600 mt-1 block">{errors.start}</span>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  End Time <span className="text-red-600">*</span>
                </label>
                <input
                  type="time"
                  value={end}
                  onChange={e => { setEnd(e.target.value); setErrors({ ...errors, end: "" }); }}
                  className={`w-full px-3 py-2 text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 ${errors.end ? "border-red-400" : "border-slate-300"}`}
                />
                {errors.end && <span className="text-xs text-red-600 mt-1 block">{errors.end}</span>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">Repeat</label>
              <select
                value={repeat}
                onChange={e => setRepeat(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                Mode <span className="text-red-600">*</span>
              </label>
              <div className="space-y-2">
                <label className={`flex items-center gap-2 p-3 border-2 rounded-md cursor-pointer transition ${mode === "confirmed" ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:bg-slate-50"}`}>
                  <input
                    type="radio"
                    name="mode"
                    value="confirmed"
                    checked={mode === "confirmed"}
                    onChange={e => { setMode(e.target.value); setErrors({ ...errors, mode: "" }); }}
                    className="text-emerald-600"
                  />
                  <div>
                    <div className="font-semibold text-sm text-slate-900">Confirmed timeslot</div>
                    <div className="text-xs text-slate-700">This timeslot is immediately available for scheduling</div>
                  </div>
                </label>
                <label className={`flex items-center gap-2 p-3 border-2 rounded-md cursor-pointer transition ${mode === "pending" ? "border-amber-500 bg-amber-50" : "border-slate-300 hover:bg-slate-50"}`}>
                  <input
                    type="radio"
                    name="mode"
                    value="pending"
                    checked={mode === "pending"}
                    onChange={e => { setMode(e.target.value); setErrors({ ...errors, mode: "" }); }}
                    className="text-amber-600"
                  />
                  <div>
                    <div className="font-semibold text-sm text-slate-900">Pending — confirm with interviewer</div>
                    <div className="text-xs text-slate-700">Interviewer will need to approve before it's available</div>
                  </div>
                </label>
              </div>
              {errors.mode && <span className="text-xs text-red-600 mt-1 block">{errors.mode}</span>}
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold">
                Add Timeslot
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
