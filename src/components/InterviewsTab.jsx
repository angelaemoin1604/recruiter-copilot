// InterviewsTab.jsx
import { useState } from "react";
import DataTable from "./DataTable.jsx";
import InterviewDetailPopup from "./InterviewDetailPopup.jsx";
import RescheduleForm from "./RescheduleForm.jsx";
import CancelInterviewForm from "./CancelInterviewForm.jsx";
import { Video, Phone, MapPin, X, Edit2, Trash2 } from "lucide-react";
import * as DB from "../supabase.jsx";
import { useToast } from "./Toast.jsx";
import { formatDate, formatTime } from "../utils.js";

export default function InterviewsTab({ snapshot, refreshSnapshot, currentUser }) {
  const [detailFor, setDetailFor] = useState(null);
  const [rescheduleFor, setRescheduleFor] = useState(null);
  const [cancelFor, setCancelFor] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const rows = snapshot.interviews.map(i => {
    const cand = snapshot.candidates.find(c => c.rh_id === i.rh_id);
    const job = snapshot.jobs.find(j => j.job_id === i.job_id);
    const interviewer = snapshot.employees.find(e => e.employee_id === i.interviewer_id);
    const histories = snapshot.interview_history.filter(h => h.interview_id === i.id);
    const wasRescheduled = histories.some(h => h.action === "rescheduled");
    // Add mode_filter and status_filter for filtering (hidden from table, visible in filters)
    const status_filter = i.status.charAt(0).toUpperCase() + i.status.slice(1);
    return { ...i, candidate: cand, job, interviewer, wasRescheduled, mode_filter: i.mode, status_filter };
  }).filter(r => r.candidate && r.job && r.interviewer);

  const modeIcons = { Video, Telephonic: Phone, "In-person": MapPin };

  const columns = [
    {
      key: "candidate_name", label: "Candidate",
      accessor: r => r.candidate.name,
      render: r => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
            {r.candidate.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-slate-900 truncate">{r.candidate.name}</div>
            <div className="mono text-[10px] text-slate-700 truncate">{r.job.title}</div>
          </div>
        </div>
      )
    },
    { key: "slot_date", label: "Date", render: r => <span className="text-xs font-semibold text-slate-900">{formatDate(r.slot_date)}</span>, filterValue: r => r.slot_date },
    { key: "time", label: "Time", render: r => <span className="text-xs text-slate-800">{formatTime(r.start_time)}–{formatTime(r.end_time)}</span>, sortable: false },
    { key: "interviewer_name", label: "Interviewer", accessor: r => r.interviewer.name, render: r => <span className="text-xs font-medium text-slate-900">{r.interviewer.name}</span>, filterValue: r => r.interviewer.name },
    { key: "round_name", label: "Round", render: r => <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-300 text-xs font-semibold rounded">{r.round_name}</span>, filterValue: r => r.round_name },
    {
      key: "interview_details", label: "Interview Details", sortable: false, filterable: false,
      render: r => {
        const txt = r.status === "rescheduled" ? "Rescheduled details" : r.status === "cancelled" ? "Cancelled details" : r.status === "completed" ? "Completed details" : "Scheduled details";
        return <button onClick={() => setDetailFor(r)} className="text-blue-700 hover:text-blue-900 underline text-xs font-semibold">{txt}</button>;
      }
    },
    {
      key: "actions", label: "Actions", sortable: false, filterable: false,
      render: r => (
        <div className="flex items-center gap-2">
          {r.status !== "cancelled" && r.status !== "completed" ? (
            <>
              {/* FIX #7: Replace colored buttons with Edit2 and Trash2 icons with tooltips */}
              <div className="relative group">
                <button 
                  onClick={() => setRescheduleFor(r)} 
                  className="p-1.5 hover:bg-slate-100 rounded transition"
                  aria-label="Edit Interview"
                >
                  <Edit2 size={16} className="text-slate-700" />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                  Edit Interview
                </div>
              </div>
              <div className="relative group">
                <button 
                  onClick={() => setCancelFor(r)} 
                  className="p-1.5 hover:bg-red-50 rounded transition"
                  aria-label="Cancel interview"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                  Cancel interview
                </div>
              </div>
            </>
          ) : (
            <span className="text-xs text-slate-400 italic">No actions</span>
          )}
        </div>
      )
    },
    // Hidden columns for filtering only (appear in filter dropdowns, not in table)
    { key: "mode_filter", label: "Mode", filterValue: r => r.mode_filter, render: () => null, sortable: false, hidden: true },
    { key: "status_filter", label: "Status", filterValue: r => r.status_filter, render: () => null, sortable: false, hidden: true }
  ];

  // Filter out hidden columns for table display only
  const visibleColumns = columns.filter(col => !col.hidden);

  const handleReschedule = async (newDate, newStart, newEnd, reason) => {
    setSaving(true);
    try {
      // supabase.js sanitize() will automatically strip candidate/job/interviewer fields
      await DB.put("interviews", { ...rescheduleFor, slot_date: newDate, start_time: newStart, end_time: newEnd, status: "rescheduled" });
      await DB.add("interview_history", { interview_id: rescheduleFor.id, action: "rescheduled", at: new Date().toISOString(), by_user: currentUser.id, metadata: JSON.stringify({ reason }) });
      await refreshSnapshot();
      toast.success(`✅ Interview rescheduled to ${formatDate(newDate)}!`);
      setRescheduleFor(null);
    } catch (err) {
      console.error("Reschedule error:", err);
      toast.error(`❌ Reschedule failed: ${err?.message || "Unknown error"}`);
    } finally { setSaving(false); }
  };

  const handleCancel = async (reason) => {
    setSaving(true);
    try {
      await DB.put("interviews", { ...cancelFor, status: "cancelled" });
      await DB.add("interview_history", { interview_id: cancelFor.id, action: "cancelled", at: new Date().toISOString(), by_user: currentUser.id, metadata: JSON.stringify({ reason }) });
      await refreshSnapshot();
      toast.success(`✅ Interview cancelled successfully!`);
      setCancelFor(null);
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error(`❌ Cancel failed: ${err?.message || "Unknown error"}`);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <DataTable rows={rows} columns={visibleColumns} allColumns={columns} searchPlaceholder="Search by candidate, interviewer..." searchableFields={[r => r.candidate.name, r => r.interviewer.name, r => r.job.title]} emptyMessage="No interviews scheduled yet" rowKey={r => r.id} inlineSearch={true} />
      {detailFor && <InterviewDetailPopup interview={detailFor} snapshot={snapshot} onClose={() => setDetailFor(null)} />}
      {rescheduleFor && <RescheduleForm interview={rescheduleFor} onClose={() => setRescheduleFor(null)} saving={saving} onSave={handleReschedule} />}
      {cancelFor && <CancelInterviewForm interview={cancelFor} onClose={() => setCancelFor(null)} saving={saving} onSave={handleCancel} />}
    </div>
  );
}
