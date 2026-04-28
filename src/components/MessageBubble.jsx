// MessageBubble.jsx - Shared chat-message renderer
import { Sparkles, ChevronRight, CheckCircle2, ArrowRight, Plus, Award } from "lucide-react";

const Pill = ({ children, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-800 border-slate-300",
    blue: "bg-blue-50 text-blue-800 border-blue-300",
    green: "bg-emerald-50 text-emerald-800 border-emerald-300",
    amber: "bg-amber-50 text-amber-900 border-amber-300",
    red: "bg-red-50 text-red-800 border-red-300",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-300"
  };
  return <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded border ${colors[color]}`}>{children}</span>;
};

const ScoreBadge = ({ score }) => {
  const color = score >= 85 ? "green" : score >= 70 ? "blue" : score >= 50 ? "amber" : "red";
  return <Pill color={color}>Match {score}%</Pill>;
};

function BotText({ content, accent }) {
  const tones = {
    amber: "bg-amber-50 border-amber-300 text-amber-950",
    red: "bg-red-50 border-red-300 text-red-950",
    default: "bg-white border-slate-300 text-slate-900"
  };
  const t = tones[accent] || tones.default;
  const parts = (content || "").split(/(\*\*[^*]+\*\*)/);
  return (
    <div className={`px-3 py-2 rounded-lg rounded-tl-sm border-2 text-sm whitespace-pre-wrap ${t}`}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={i} className="font-bold">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </div>
  );
}

export default function MessageBubble({ message, snapshot, engine, onJumpToInterviews }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="bg-blue-600 text-white px-3 py-2 rounded-lg rounded-tr-sm text-sm max-w-[85%] whitespace-pre-wrap shadow">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-slide-up">
      <div className="flex-1 max-w-[92%]">
        {message.kind === "text" && <BotText content={message.content} />}
        {message.kind === "ask_missing" && <BotText content={message.content} accent="amber" />}

        {message.kind === "candidate_disambig" && (
          <div className="space-y-2">
            <BotText content={`I found multiple candidates matching "${message.slots.candidate_name}". Which one?`} />
            {message.options.map((opt, i) => (
              <button key={i} onClick={() => engine.selectCandidate(opt, message.slots)}
                className="w-full text-left p-3 bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition group">
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{opt.candidate.name}</div>
                    <div className="mono text-[10px] text-slate-700">{opt.candidate.rh_id} · {opt.candidate.email}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-500 group-hover:text-blue-600" />
                </div>
                <div className="text-xs text-slate-800 mb-1.5 font-medium">{opt.job.title}</div>
                <div className="flex gap-1.5 flex-wrap">
                  <Pill color="indigo">{opt.application.current_round}</Pill>
                  <ScoreBadge score={opt.application.match_score} />
                </div>
              </button>
            ))}
          </div>
        )}

        {message.kind === "interviewer_disambig" && (
          <div className="space-y-2">
            <BotText content="Multiple matching interviewers. Which one?" />
            {message.options.map((emp, i) => (
              <button key={i} onClick={() => engine.selectInterviewer(emp, message.slots, message.candidate)}
                className="w-full text-left p-3 bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition group">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{emp.name}</div>
                    <div className="mono text-[10px] text-slate-700">{emp.employee_id} · {emp.email}</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-500 group-hover:text-blue-600" />
                </div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <Pill>{emp.department}</Pill>
                  <Pill color="indigo">{emp.grade}</Pill>
                  <Pill color="blue">{emp.hired_job_title}</Pill>
                </div>
              </button>
            ))}
          </div>
        )}

        {message.kind === "wrong_round" && (
          <div className="space-y-2">
            {(() => {
              const cand = snapshot.candidates.find(c => c.rh_id === message.options[0]?.rh_id);
              return <BotText content={`Heads up — ${cand?.name} is currently in **${message.options[0]?.current_round}**, not **${message.requested_round}**. Schedule anyway?`} accent="amber" />;
            })()}
            <div className="space-y-1.5">
              {message.options.map((app, i) => {
                const cand = snapshot.candidates.find(c => c.rh_id === app.rh_id);
                const job = snapshot.jobs.find(j => j.job_id === app.job_id);
                return (
                  <div key={i} className="p-2.5 bg-amber-50 border border-amber-300 rounded text-xs text-slate-900">
                    <div className="font-semibold">{job.title}</div>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <Pill color="amber">Currently: {app.current_round}</Pill>
                      <ScoreBadge score={app.match_score} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => engine.acceptWrongRound(message.options[0], message.slots)}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md">
                Yes, schedule it anyway
              </button>
              <button onClick={engine.declineWrongRound}
                className="flex-1 px-3 py-2 border-2 border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-md">
                No, cancel
              </button>
            </div>
          </div>
        )}

        {message.kind === "not_qualified" && (
          <div className="space-y-2">
            <BotText content={`${message.named.name} (${message.named.employee_id}) isn't certified to assess ${message.round}. Top alternatives:`} accent="red" />
            {message.alternatives.map((alt, i) => (
              <button key={i} onClick={() => engine.selectAlternative(alt.emp, message.slots, message.candidate)}
                className="w-full text-left p-2.5 bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{alt.emp.name}</div>
                    <div className="mono text-[10px] text-slate-700">{alt.emp.employee_id} · {alt.emp.department}</div>
                  </div>
                  <Pill color="green">Score {alt.score}</Pill>
                </div>
              </button>
            ))}
          </div>
        )}

        {message.kind === "no_slot" && (
          <div className="space-y-2">
            <BotText content={`${message.interviewer.name} (${message.interviewer.employee_id}, ${message.interviewer.department}) is qualified but has no confirmed slot at ${message.slots.date} ${message.slots.time.start}–${message.slots.time.end}.`} accent="amber" />

            {message.nearby.length > 0 && (
              <div className="bg-white border-2 border-slate-300 rounded-lg p-3">
                <div className="text-xs font-bold text-slate-800 mb-2">a) Use a nearby confirmed slot from {message.interviewer.name}:</div>
                {message.nearby.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => engine.chooseNearbySlot(s, message.interviewer, message.slots, message.candidate)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 mb-1 bg-emerald-50 border border-emerald-300 rounded text-xs hover:bg-emerald-100 text-slate-900">
                    <CheckCircle2 size={12} className="text-emerald-700" />
                    <span className="font-semibold">{s.slot_date}</span>
                    <span>{s.start_time}–{s.end_time}</span>
                    <ArrowRight size={11} className="ml-auto text-emerald-800" />
                  </button>
                ))}
              </div>
            )}

            {message.alternatives && message.alternatives.length > 0 && (
              <div className="bg-white border-2 border-slate-300 rounded-lg p-3">
                <div className="text-xs font-bold text-slate-800 mb-2">b) Try the next-best interviewer:</div>
                {message.alternatives.map((alt, i) => (
                  <button key={i} onClick={() => engine.selectAlternative(alt.emp, message.slots, message.candidate)}
                    className="w-full flex items-center justify-between px-2 py-1.5 mb-1 bg-blue-50 border border-blue-300 rounded text-xs hover:bg-blue-100 text-slate-900">
                    <span><span className="font-bold">{alt.emp.name}</span> · <span className="mono text-[10px] text-slate-700">{alt.emp.employee_id}</span></span>
                    <Pill color="blue">{alt.score}</Pill>
                  </button>
                ))}
              </div>
            )}

            {/* NEW: A/B timeslot options instead of single button */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 mb-1">c) Add availability for {message.interviewer.name}:</div>
              <button
                onClick={() => engine.addConfirmedSlot(message.interviewer, message.slots)}
                className="w-full p-2.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2 border-2 border-emerald-700"
              >
                <CheckCircle2 size={14} /> A) Add Confirmed timeslot for {message.interviewer.name}
              </button>
              <button
                onClick={() => engine.raiseSlotRequest(message.interviewer, message.slots)}
                className="w-full p-2.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 flex items-center justify-center gap-2 border-2 border-amber-600"
              >
                <Plus size={14} /> B) Add Pending request to {message.interviewer.name}
              </button>
            </div>
          </div>
        )}

        {message.kind === "no_availability" && (
          <div className="space-y-2">
            <BotText content={`No qualified interviewer has a confirmed slot at ${message.slots.date} ${message.slots.time.start}–${message.slots.time.end}. Top 3 by fitment:`} accent="amber" />
            {message.top3.map((item, i) => (
              <div key={i} className="bg-white border-2 border-slate-300 rounded p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="font-bold text-sm text-slate-900">{item.emp.name}</div>
                    <div className="mono text-[10px] text-slate-700">{item.emp.employee_id} · {item.emp.department}</div>
                  </div>
                  <Pill color="blue">Score {item.score}</Pill>
                </div>
                {item.nearby.length > 0 && (
                  <div className="mt-1.5 space-y-1">
                    <div className="text-[10px] uppercase tracking-wide text-slate-700 font-semibold">Their nearby slots:</div>
                    {item.nearby.slice(0, 2).map((s, j) => (
                      <button key={j} onClick={() => engine.chooseNearbySlot(s, item.emp, message.slots, message.candidate)}
                        className="w-full flex items-center gap-2 px-2 py-1 bg-emerald-50 border border-emerald-300 rounded text-[11px] hover:bg-emerald-100 text-slate-900">
                        <CheckCircle2 size={10} className="text-emerald-700" />
                        <span>{s.slot_date} {s.start_time}–{s.end_time}</span>
                        <ArrowRight size={9} className="ml-auto text-emerald-800" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => engine.addConfirmedSlot(item.emp, message.slots)}
                    className="w-full px-2 py-1 bg-emerald-100 border border-emerald-400 text-emerald-900 rounded text-[11px] font-semibold hover:bg-emerald-200 flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 size={10} /> A) Add Confirmed timeslot for {item.emp.name}
                  </button>
                  <button
                    onClick={() => engine.raiseSlotRequest(item.emp, message.slots)}
                    className="w-full px-2 py-1 bg-amber-100 border border-amber-400 text-amber-900 rounded text-[11px] font-semibold hover:bg-amber-200 flex items-center justify-center gap-1"
                  >
                    <Plus size={10} /> B) Add Pending request to {item.emp.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {message.kind === "confirm" && (
          <div className="bg-white border-2 border-blue-500 rounded-lg overflow-hidden shadow-md">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 flex items-center gap-2">
              <Sparkles size={14} />
              <span className="font-bold text-sm">Schedule preview</span>
              {message.auto_picked && <Pill color="amber">Auto-picked</Pill>}
              {message.round_overridden && <Pill color="amber">Round override</Pill>}
            </div>
            <div className="p-3 space-y-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-700 font-bold mb-0.5">Candidate</div>
                <div className="font-bold text-slate-900">{message.candidate.candidate.name}</div>
                <div className="text-xs flex flex-wrap gap-1.5 mt-1">
                  <Pill>{message.candidate.candidate.rh_id}</Pill>
                  <Pill color="blue">{message.candidate.job.title}</Pill>
                  <Pill color="indigo">{message.candidate.application.current_round}</Pill>
                  <ScoreBadge score={message.candidate.application.match_score} />
                </div>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-700 font-bold mb-0.5">Interviewer</div>
                <div className="font-bold text-slate-900">{message.interviewer.name}</div>
                <div className="text-xs flex flex-wrap gap-1.5 mt-1">
                  <Pill>{message.interviewer.employee_id}</Pill>
                  <Pill color="blue">{message.interviewer.department}</Pill>
                  <Pill color="indigo">{message.interviewer.grade}</Pill>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-700 font-bold mb-0.5">When</div>
                <div className="font-bold text-slate-900">{message.slots.date} · {message.slots.time.start} – {message.slots.time.end}</div>
              </div>
              <div className="border-t border-slate-200 pt-2 flex flex-wrap gap-1.5">
                <Pill color="blue">{message.slots.mode || "Video"}</Pill>
                <Pill color="indigo">Topic: {message.slots.topic || (snapshot.interview_round.find(r => r.job_id === message.candidate.job.job_id && r.round_name === message.slots.round_name)?.default_topic) || "Interview"}</Pill>
                <Pill color="green">Candidate will be invited</Pill>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button onClick={() => engine.confirmSchedule(message)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-bold shadow">
                Confirm & Schedule
              </button>
              <button onClick={engine.cancelConfirm} className="px-4 py-2 border-2 border-slate-300 rounded-md text-sm font-semibold text-slate-800 hover:bg-white">
                Cancel
              </button>
            </div>
          </div>
        )}

        {message.kind === "success" && (
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-3 shadow">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle2 size={20} className="text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-emerald-950">Interview scheduled ✅</div>
                <div className="text-xs text-emerald-900 mt-0.5 whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
            {onJumpToInterviews && (
              <button onClick={onJumpToInterviews} className="w-full mt-1 text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline">
                View in Interviews tab →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
