// InterviewDetailPopup.jsx - With Collaboration tab
import { useState } from "react";
import { X, Calendar, Clock, Video, Phone, User, Briefcase, MapPin, FileText, MessageSquare, Send, Link2 } from "lucide-react";
import { formatDate, formatDateTime, formatTime } from "../utils.js";

export default function InterviewDetailPopup({ interview, snapshot, onClose }) {
  const [activeTab, setActiveTab] = useState(interview._initialTab || "details");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const cand = snapshot.candidates.find(c => c.rh_id === interview.rh_id);
  const job = snapshot.jobs.find(j => j.job_id === interview.job_id);
  const interviewer = snapshot.employees.find(e => e.employee_id === interview.interviewer_id);
  const recruiter = snapshot.employees.find(e => e.employee_id === interview.scheduled_by);
  const app = snapshot.applications.find(a => a.rh_id === interview.rh_id && a.job_id === interview.job_id);
  const histories = snapshot.interview_history.filter(h => h.interview_id === interview.id);

  const modeIcons = { Video, Telephonic: Phone, "In-person": MapPin };
  const ModeIcon = modeIcons[interview.mode] || Video;

  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    setComments([...comments, { 
      id: Date.now(), 
      author: recruiter?.name || "Recruiter",
      text: comment.trim(), 
      at: new Date().toISOString() 
    }]);
    setComment("");
  };

  // Mode-specific info
  const renderModeInfo = () => {
    if (interview.mode === "Video") {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <Video size={14} className="text-blue-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Video Meeting Details</span>
          </div>
          <div className="text-sm space-y-1">
            <div><span className="font-semibold">Meeting Link:</span> <a href="#" className="text-blue-700 underline">https://meet.ripplehire.com/interview/{interview.id}</a></div>
            <div><span className="font-semibold">Meeting ID:</span> RH-{interview.id}-{interview.slot_date.replace(/-/g, '')}</div>
            <div><span className="font-semibold">Dial-in:</span> +91 80 4567 8900</div>
            <div className="text-xs text-slate-700 mt-1">Please join 5 minutes early to test your audio and video.</div>
          </div>
        </div>
      );
    } else if (interview.mode === "Telephonic") {
      return (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <Phone size={14} className="text-green-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-green-900">Telephonic Interview Details</span>
          </div>
          <div className="text-sm space-y-1">
            <div><span className="font-semibold">Conference Number:</span> +91 80 4567 8900</div>
            <div><span className="font-semibold">Access Code:</span> {interview.id}9842</div>
            <div className="text-xs text-slate-700 mt-1">Please call exactly at the scheduled time.</div>
          </div>
        </div>
      );
    } else if (interview.mode === "In-person") {
      return (
        <div className="bg-purple-50 border border-purple-200 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={14} className="text-purple-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900">In-Person Interview Location</span>
          </div>
          <div className="text-sm space-y-1">
            <div><span className="font-semibold">Office:</span> RippleHire Tech Park, {interviewer?.location || "Bangalore"}</div>
            <div><span className="font-semibold">Floor:</span> 4th Floor, Conference Room B</div>
            <div><span className="font-semibold">Parking:</span> Visitor parking available at Gate 2</div>
            <div className="text-xs text-slate-700 mt-1">Please arrive 15 minutes early for security check-in.</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full pointer-events-auto animate-pop-in max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={20} />
              <div>
                <h3 className="font-bold text-lg">Interview Details</h3>
                <p className="text-xs text-blue-100">{interview.status === "rescheduled" ? "Rescheduled" : interview.status === "cancelled" ? "Cancelled" : "Scheduled"}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/15 rounded text-white"><X size={18} /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-slate-200 bg-slate-50">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition ${
                activeTab === "details" 
                  ? "text-blue-700 border-b-2 border-blue-700 bg-white -mb-0.5" 
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <FileText size={14} /> Interview Details
            </button>
            <button
              onClick={() => setActiveTab("collaboration")}
              className={`flex-1 px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition ${
                activeTab === "collaboration" 
                  ? "text-blue-700 border-b-2 border-blue-700 bg-white -mb-0.5" 
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <MessageSquare size={14} /> Collaboration
            </button>
          </div>

          {/* Tab content */}
          <div className="overflow-y-auto flex-1">
            {activeTab === "details" && (
              <div className="p-6 space-y-4">
                {/* Candidate */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={16} className="text-slate-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Candidate</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white">
                      {cand?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-lg">{cand?.name}</h4>
                      <div className="text-xs text-slate-700 space-y-0.5">
                        <div className="mono">{cand?.rh_id}</div>
                        <div>{cand?.email}</div>
                        <div>{cand?.phone}</div>
                      </div>
                      {app && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-indigo-100 border border-indigo-300 text-indigo-900 text-[10px] font-semibold rounded">
                            {app.current_round}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-semibold rounded">
                            Match {app.match_score}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Job */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase size={16} className="text-slate-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Job</span>
                  </div>
                  <h4 className="font-bold text-slate-900">{job?.title}</h4>
                  <div className="text-xs text-slate-700 mt-1">
                    <div className="mono">JobSeq: {job?.job_seq || '-'} | Job code: {job?.requisition_code}</div>
                    <div>{job?.department} · {job?.location} · {job?.required_grade}</div>
                  </div>
                </div>

                {/* Interview details grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} className="text-slate-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">When</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{formatDate(interview.slot_date)}</div>
                    <div className="text-xs text-slate-800 mt-0.5">{formatTime(interview.start_time)} – {formatTime(interview.end_time)}</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ModeIcon size={14} className="text-slate-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Mode</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{interview.mode}</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-slate-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Round</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{interview.round_name}</div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-slate-700" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Topic</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{interview.topic}</div>
                  </div>
                </div>

                {/* Mode-specific info */}
                {renderModeInfo()}

                {/* Interviewer */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User size={16} className="text-slate-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Interviewer</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                      {interviewer?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{interviewer?.name}</h4>
                      <div className="text-xs text-slate-700 space-y-0.5">
                        <div className="mono">{interviewer?.employee_id}</div>
                        <div>{interviewer?.email}</div>
                        <div>{interviewer?.department} · {interviewer?.grade}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="text-xs text-slate-600 border-t border-slate-200 pt-3">
                  <div><span className="font-semibold">Scheduled by:</span> {recruiter?.name} ({recruiter?.employee_id})</div>
                  <div className="mt-0.5"><span className="font-semibold">Candidate invited:</span> {interview.candidate_invited ? "Yes" : "No"}</div>
                  {interview.created_at && <div className="mt-0.5"><span className="font-semibold">Created:</span> {formatDateTime(interview.created_at)}</div>}
                </div>
              </div>
            )}

            {activeTab === "collaboration" && (
              <div className="p-5 space-y-4">
                {/* Comment input */}
                <div className="bg-white border-2 border-slate-200 rounded-lg p-3">
                  <div className="text-sm font-bold text-slate-900 mb-2">Comment</div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Type your Comment"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleSubmitComment}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded flex items-center gap-1.5"
                    >
                      <Send size={12} /> Submit
                    </button>
                  </div>
                </div>

                {/* User comments */}
                {comments.map(c => (
                  <div key={c.id} className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-sm text-slate-900">{c.author}</div>
                      <div className="text-xs text-slate-600">{formatDateTime(c.at)}</div>
                    </div>
                    <div className="text-sm text-slate-800">{c.text}</div>
                  </div>
                ))}

                {/* Mode-specific info */}
                {renderModeInfo()}

                {/* Cancellation message - if cancelled */}
                {interview.status === "cancelled" && histories.find(h => h.action === "cancelled") && (
                  <div className="border-2 border-red-300 bg-red-50 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm text-red-900">{recruiter?.name || "Recruiter"} | {formatDateTime(histories.find(h => h.action === "cancelled").at)}</div>
                      <div className="text-xs text-red-800 font-semibold">Status: Cancelled</div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="font-bold">Interview cancelled for {cand?.name} - {job?.title}.</div>
                      <div><span className="font-semibold">Stage:</span> {interview.round_name}</div>
                      <div><span className="font-semibold">Date:</span> {formatDate(interview.slot_date)}</div>
                      <div><span className="font-semibold">Time:</span> {formatTime(interview.start_time)} - {formatTime(interview.end_time)} IST</div>
                      <div><span className="font-semibold">Type:</span> {interview.mode}</div>
                      <div><span className="font-semibold">Interviewer:</span> {interviewer?.name}</div>
                      <div><span className="font-semibold text-red-800">Cancellation Reason:</span> {histories.find(h => h.action === "cancelled")?.metadata?.reason}</div>
                    </div>
                  </div>
                )}

                {/* Reschedule history */}
                {histories.filter(h => h.action === "rescheduled").map((h, i) => (
                  <div key={i} className="border-2 border-amber-300 bg-amber-50 rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm text-amber-900">{recruiter?.name || "Recruiter"} | {formatDateTime(h.at)}</div>
                      <div className="text-xs text-amber-800 font-semibold">Status: {interview.round_name}</div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="font-bold">Interview(s) rescheduled with {interviewer?.name} for {job?.title}. Below are the interview details:</div>
                      <div><span className="font-semibold">Stage:</span> {interview.round_name}</div>
                      <div><span className="font-semibold">Date:</span> {formatDate(interview.slot_date)}</div>
                      <div><span className="font-semibold">Time:</span> {formatTime(interview.start_time)} - {formatTime(interview.end_time)} IST</div>
                      <div><span className="font-semibold">Type:</span> {interview.mode}</div>
                      <div><span className="font-semibold">Interviewer(s):</span> {interviewer?.name}</div>
                      <div className="border-t border-amber-300 mt-2 pt-2">
                        <div className="font-semibold text-amber-900">Removed details</div>
                        <div className="text-xs">Date: {formatTime(h.metadata?.old_start)} - {formatTime(h.metadata?.old_end)} IST, {formatDate(h.metadata?.old_date)}</div>
                        <div className="text-xs">Interviewer: {interviewer?.email}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-amber-900">Added details</div>
                        <div className="text-xs">Date: {formatTime(interview.start_time)} - {formatTime(interview.end_time)} IST, {formatDate(interview.slot_date)}</div>
                        <div className="text-xs">Interviewer: {interviewer?.email}</div>
                      </div>
                      <div className="mt-2 font-semibold text-amber-900">Reschedule Reason: <span className="font-normal">{h.metadata?.reason}</span></div>
                    </div>
                  </div>
                ))}

                {/* Initial scheduled message */}
                <div className="border-2 border-slate-300 bg-white rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm text-slate-900">{recruiter?.name || "Recruiter"} | {interview.created_at ? formatDateTime(interview.created_at) : formatDate(interview.slot_date)}</div>
                    <div className="text-xs text-slate-700 font-semibold">Status: {interview.round_name}</div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="font-bold">Interview(s) scheduled with {interviewer?.name} for {job?.title}. Below are the interview details:</div>
                    <div><span className="font-semibold">Stage:</span> {interview.round_name}</div>
                    <div><span className="font-semibold">Date:</span> {formatDate(interview.slot_date)}</div>
                    <div><span className="font-semibold">Time:</span> {formatTime(interview.start_time)} - {formatTime(interview.end_time)} IST</div>
                    <div><span className="font-semibold">Type:</span> {interview.mode}</div>
                    <div><span className="font-semibold">Interviewer(s):</span> {interviewer?.name}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 border-2 border-slate-300 rounded-md text-sm font-semibold text-slate-800 hover:bg-white">
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
