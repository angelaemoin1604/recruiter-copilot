// CollabPopup.jsx - Mock collaboration tab popup for an interview
import { X, MessageSquare, ThumbsUp } from "lucide-react";

export default function CollabPopup({ interview, snapshot, onClose }) {
  const cand = snapshot.candidates.find(c => c.rh_id === interview.rh_id);
  const job = snapshot.jobs.find(j => j.job_id === interview.job_id);
  const interviewer = snapshot.employees.find(e => e.employee_id === interview.interviewer_id);
  const recruiter = snapshot.employees.find(e => e.employee_id === interview.scheduled_by);

  const fakeMessages = [
    { from: recruiter?.name || "Recruiter", text: `Hi team — interview scheduled for ${cand?.name}. Please review the resume before the call.`, time: "2 hours ago" },
    { from: interviewer?.name || "Interviewer", text: `Got it. Looking at the profile now. Initial impressions are strong.`, time: "1 hour ago" },
    { from: recruiter?.name || "Recruiter", text: `Great. Let me know if you'd like me to add anyone else to the panel.`, time: "30 minutes ago" }
  ];

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full pointer-events-auto animate-pop-in">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-700" />
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">Collaboration · {cand?.name}</h3>
              <p className="text-xs text-slate-700">{job?.title} · {interview.slot_date} {interview.start_time}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded text-slate-700"><X size={16} /></button>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {fakeMessages.map((m, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {m.from.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-sm text-slate-900">{m.from}</span>
                    <span className="text-[10px] text-slate-600">{m.time}</span>
                  </div>
                  <p className="text-sm text-slate-800">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex gap-2">
            <input placeholder="Add a comment..." className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md text-slate-900" />
            <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">Post</button>
          </div>
        </div>
      </div>
    </>
  );
}
