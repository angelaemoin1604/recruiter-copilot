// InterviewsTab.jsx
import { useState } from "react";
import DataTable from "./DataTable.jsx";
import InterviewDetailPopup from "./InterviewDetailPopup.jsx";
import RescheduleForm from "./RescheduleForm.jsx";
import CancelInterviewForm from "./CancelInterviewForm.jsx";
import { Calendar, Video, Phone, MapPin, X } from "lucide-react";
import * as DB from "../db.js";
import { useToast } from "./Toast.jsx";
import { formatDate, formatTime } from "../utils.js";

// Strip enriched fields before sending to DB — only keep real DB columns
function toDbRow(row) {
  const { candidate, job, interviewer, wasRescheduled, ...dbRow } = row;
  return dbRow;
}

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
    return { ...i, candidate: cand, job, interviewer, wasRescheduled };
  }).filter(r => r.candidate && r.job && r.interviewer);

  const modeIcons = { Video, Telephonic: Phone, "In-person": MapPin };

  const columns = [
    {
      key: "candidate_name",
      label: "Candidate",
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
    {
      key: "slot_date",
      label: "Date",
      render: r => <span className="text-xs font-semibold text-slate-900">{formatDate(r.slot_date)}</span>,
      filterValue: r => r.slot_date
    },
    {
      key: "time",
      label: "Time",
      render: r => <span className="text-xs text-slate-800">{formatTime(r.start_time)}–{formatTime(r.end_time)}</span>,
      sortable: false
    },
    {
      key: "mode",
      label: "Mode",
      render: r => {
        const Icon = modeIcons[r.mode] || Video;
        const colors = {
          Video: "bg-blue-50 text-blue-800 border-blue-300",
          Telephonic: "bg-green-50 text-green-800 border-green-300",
          "In-person": "bg-purple-50 text-purple-800 border-purple-300"
        };
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded border ${colors[r.mode] || colors.Video}`}>
            <Icon size={10} /> {r.mode}
          </span>
        );
      },
      filterValue: r => r.mode
    },
    {
      key: "status",
      label: "Status",
      render: r => {
        const colors = {
          scheduled: "bg-emerald-50 text-emerald-800 border-emerald-300",
          rescheduled: "bg-amber-50 text-amber-800 border-amber-300",
          completed: "bg-slate-100 text-slate-800 border-slate-300",
          cancelled: "bg-red-50 text-red-800 border-red-300"
        };
        return (
          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border capitalize ${colors[r.status] || colors.scheduled}`}>
            {r.status}
          </span>
        );
      },
      filterValue: r => r.status
    },
    {
      key: "interviewer_name",
      label: "Interviewer",
      accessor: r => r.interviewer.name,
      render: r => <span className="text-xs font-medium text-slate-900">{r.interviewer.name}</span>,
      filterValue: r => r.interviewer.name
    },
    {
      key: "round_name",
      label: "Round",
      render: r => (
        <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-300 text-xs font-semibold rounded">
          {r.round_name}
        </span>
      ),
      filterValue: r => r.round_name
    },
    {
      key: "interview_details",
      label: "Interview Details",
      sortable: false,
      filterable: false,
      render: r => {
        let linkText = "Scheduled interview details";
        if (r.status === "rescheduled") linkText = "Rescheduled interview details";
        else if (r.status === "cancelled") linkText = "Cancelled interview details";
        else if (r.status === "completed") linkText = "Completed interview details";
        return (
          <button onClick={() => setDetailFor(r)} className="text-blue-700 hover:text-blue-900 underline text-xs font-semibold">
            {linkText}
          </button>
        );
      }
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      filterable: false,
      render: r => (
        <div className="flex items-center gap-1">
          {r.status !== "cancelled" && r.status !== "completed" && (
            <>
              <button
                onClick={() => setRescheduleFor(r)}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded transition"
              >
                Reschedule
              </button>
              <button
                onClick={() => setCancelFor(r)}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded flex items-center gap-1 transition"
              >
                <X size={10} /> Cancel
              </button>
            </>
          )}
          {(r.status === "cancelled" || r.status === "completed") && (
            <span className="text-xs text-slate-400 italic">No actions</span>
          )}
        </div>
      )
    }
  ];

  const handleReschedule = async (newDate, newStart, newEnd, reason) => {
    setSaving(true);
    try {
      // Strip enriched fields — only send real DB columns
      const dbRow = toDbRow(rescheduleFor);
      await DB.put("interviews", {
        ...dbRow,
        slot_date: newDate,
        start_time: newStart,
        end_time: newEnd,
        status: "rescheduled"
      });
      await DB.add("interview_history", {
        interview_id: rescheduleFor.id,
        action: "rescheduled",
        at: new Date().toISOString(),
        by_user: currentUser.id,
        metadata: JSON.stringify({ reason, old_date: rescheduleFor.slot_date, old_start: rescheduleFor.start_time, old_end: rescheduleFor.end_time })
      });
      await refreshSnapshot();
      toast.success(`✅ Interview rescheduled to ${formatDate(newDate)}. ${rescheduleFor.interviewer.name} has been notified.`);
      setRescheduleFor(null);
    } catch (err) {
      console.error("Reschedule error:", err);
      toast.error(`❌ Failed to reschedule: ${err?.message || "Unknown error"}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (reason) => {
    setSaving(true);
    try {
      // Strip enriched fields — only send real DB columns
      const dbRow = toDbRow(cancelFor);
      await DB.put("interviews", { ...dbRow, status: "cancelled" });
      await DB.add("interview_history", {
        interview_id: cancelFor.id,
        action: "cancelled",
        at: new Date().toISOString(),
        by_user: currentUser.id,
        metadata: JSON.stringify({ reason })
      });
      await refreshSnapshot();
      toast.success(`✅ Interview cancelled. ${cancelFor.candidate.name} and ${cancelFor.interviewer.name} have been notified.`);
      setCancelFor(null);
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error(`❌ Failed to cancel: ${err?.message || "Unknown error"}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <DataTable
        rows={rows}
        columns={columns}
        searchPlaceholder="Search interviews by candidate, interviewer..."
        searchableFields={[r => r.candidate.name, r => r.interviewer.name, r => r.job.title]}
        emptyMessage="No interviews scheduled yet"
        rowKey={r => r.id}
        inlineSearch={true}
      />
      {detailFor && <InterviewDetailPopup interview={detailFor} snapshot={snapshot} onClose={() => setDetailFor(null)} />}
      {rescheduleFor && (
        <RescheduleForm
          interview={rescheduleFor}
          onClose={() => setRescheduleFor(null)}
          saving={saving}
          onSave={handleReschedule}
        />
      )}
      {cancelFor && (
        <CancelInterviewForm
          interview={cancelFor}
          onClose={() => setCancelFor(null)}
          saving={saving}
          onSave={handleCancel}
        />
      )}
    </div>
  );
}
