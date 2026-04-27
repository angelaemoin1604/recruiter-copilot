// JobDrawer.jsx
import { X, Briefcase, MapPin, Calendar, Users, Star, CheckCircle2 } from "lucide-react";

export default function JobDrawer({ job, snapshot, onClose }) {
  const hiringMgr = snapshot.employees.find(e => e.employee_id === job.hiring_manager_id);
  const requiredSkills = snapshot.job_required_skill.filter(s => s.job_id === job.job_id);
  const mandatory = requiredSkills.filter(s => s.is_mandatory);
  const niceToHave = requiredSkills.filter(s => !s.is_mandatory);
  const rounds = snapshot.interview_round.filter(r => r.job_id === job.job_id).sort((a, b) => a.sequence_no - b.sequence_no);
  const applicants = snapshot.applications.filter(a => a.job_id === job.job_id);
  const pipelineByRound = {};
  for (const a of applicants) pipelineByRound[a.current_round] = (pipelineByRound[a.current_round] || 0) + 1;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-[70]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[600px] bg-white shadow-2xl z-[71] overflow-y-auto animate-slide-right">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Briefcase size={20} />
            <div>
              <h2 className="text-xl font-bold">Job Details</h2>
              <p className="text-xs text-blue-100 mono">JobSeq: {job.job_seq || '-'} | Job code: {job.requisition_code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/15 rounded"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header info */}
          <div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">{job.title}</h3>
            <div className="flex flex-wrap gap-2 text-sm text-slate-700">
              <div className="flex items-center gap-1.5">
                <Briefcase size={14} />
                <span>{job.department}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <MapPin size={14} />
                <span>{job.location}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Star size={14} />
                <span>{job.required_grade}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>Opened {job.opened_on}</span>
              </div>
            </div>
            <div className={`mt-2 inline-block px-2 py-0.5 text-xs font-semibold rounded border ${
              job.is_open ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-slate-100 text-slate-800 border-slate-300"
            }`}>
              {job.is_open ? "Open" : "Closed"}
            </div>
          </div>

          {/* Hiring manager */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-slate-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Hiring Manager</span>
            </div>
            {hiringMgr ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                  {hiringMgr.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{hiringMgr.name}</div>
                  <div className="text-xs text-slate-700">{hiringMgr.department} · {hiringMgr.email}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-600">Not assigned</div>
            )}
          </div>

          {/* Job description */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">Job Description</h4>
            <p className="text-sm text-slate-800 leading-relaxed">{job.job_description}</p>
          </div>

          {/* Skills */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-blue-700" />
                Mandatory Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {mandatory.length > 0 ? mandatory.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-100 border border-blue-300 text-blue-900 text-xs font-semibold rounded">
                    {s.skill_name}
                  </span>
                )) : <span className="text-xs text-slate-600">None specified</span>}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Star size={12} className="text-slate-700" />
                Nice to Have
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {niceToHave.length > 0 ? niceToHave.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded">
                    {s.skill_name}
                  </span>
                )) : <span className="text-xs text-slate-600">None specified</span>}
              </div>
            </div>
          </div>

          {/* Interview rounds */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">Interview Process</h4>
            <div className="space-y-2">
              {rounds.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    {r.sequence_no}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900">{r.round_name}</div>
                    <div className="text-xs text-slate-700">{r.default_topic}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline stats */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">Pipeline Stats</h4>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-2xl font-black text-slate-900 mb-2">{applicants.length}</div>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Total Applicants</div>
              {Object.entries(pipelineByRound).length > 0 ? (
                <div className="space-y-1.5">
                  {Object.entries(pipelineByRound).map(([round, count]) => (
                    <div key={round} className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-medium">{round}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-600">No applicants yet</div>
              )}
            </div>
          </div>

          {/* Candidates in pipeline */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">Candidates in Pipeline</h4>
            {applicants.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-sm text-slate-700">
                No candidates yet
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-bold text-slate-700 uppercase tracking-wider">Name</th>
                      <th className="text-left px-3 py-2 font-bold text-slate-700 uppercase tracking-wider">Stage</th>
                      <th className="text-left px-3 py-2 font-bold text-slate-700 uppercase tracking-wider">Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.slice(0, 10).map(a => {
                      const cand = snapshot.candidates.find(c => c.rh_id === a.rh_id);
                      return (
                        <tr key={a.rh_id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-semibold text-slate-900">{cand?.name}</td>
                          <td className="px-3 py-2">
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-[10px] font-semibold">
                              {a.current_round}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-bold text-slate-800">{a.match_score}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {applicants.length > 10 && (
                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-600">
                    + {applicants.length - 10} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
