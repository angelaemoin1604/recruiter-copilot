// MessageBubble.jsx
import { Sparkles, ChevronRight, CheckCircle2, ArrowRight, Plus, Clock } from "lucide-react";

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatDateDisplay(dateStr) {
  // Convert "2026-05-01" to "1st May 2026"
  if (!dateStr) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return `${day}${getOrdinalSuffix(day)} ${months[monthNum]} ${year}`;
  }
  return dateStr;
}

function Pill({ children, color = "slate" }) {
  const c = { slate: "bg-slate-100 text-slate-800 border-slate-300", blue: "bg-blue-50 text-blue-800 border-blue-300", green: "bg-emerald-50 text-emerald-800 border-emerald-300", amber: "bg-amber-50 text-amber-900 border-amber-300", red: "bg-red-50 text-red-800 border-red-300", indigo: "bg-indigo-50 text-indigo-800 border-indigo-300" };
  return <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded border ${c[color] || c.slate}`}>{children}</span>;
}

function BotBubble({ content, accent }) {
  const tone = { amber: "bg-amber-50 border-amber-300 text-amber-950", red: "bg-red-50 border-red-300 text-red-950", default: "bg-white border-slate-300 text-slate-900" };
  const t = tone[accent] || tone.default;
  const parts = (content || "").split(/(\*\*[^*]+\*\*)/);
  return (
    <div className={`px-3 py-2.5 rounded-lg rounded-tl-sm border-2 text-sm whitespace-pre-wrap leading-relaxed ${t}`}>
      {parts.map((p, i) => p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2,-2)}</strong> : <span key={i}>{p}</span>)}
    </div>
  );
}

export default function MessageBubble({ message, snapshot, engine, onJumpToInterviews, onJumpToCandidates, onSuggestionClick, suggestionText = null }) {
  // DEBUG: Log to see what we're receiving
  if (message.kind === "text") {
    console.log("🔍 MessageBubble DEBUG:", {
      messageId: message.id,
      hasSuggestionTextProp: !!suggestionText,
      suggestionTextValue: suggestionText,
      hasOnSuggestionClick: !!onSuggestionClick,
      messageHasSuggestionText: !!message.suggestionText,
      messageSuggestionTextValue: message.suggestionText
    });
  }
  
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="bg-blue-600 text-white px-3 py-2 rounded-lg rounded-tr-sm text-sm max-w-[85%] whitespace-pre-wrap shadow">{message.content}</div>
      </div>
    );
  }

  return (
    <div className="flex animate-slide-up">
      <div className="flex-1 max-w-[95%] space-y-2">

        {message.kind === "text" && (
          <>
            <BotBubble content={message.content} />
            {suggestionText && onSuggestionClick && (
              <button
                onClick={() => onSuggestionClick(suggestionText)}
                className="w-full text-left px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-400 rounded-lg transition group flex items-center gap-2"
              >
                <Sparkles size={14} className="text-blue-600 flex-shrink-0" />
                <span className="text-xs font-medium text-slate-700 flex-1">Click to auto-fill: <span className="text-blue-700 font-semibold">{suggestionText}</span></span>
                <ArrowRight size={14} className="text-blue-600 group-hover:translate-x-1 transition" />
              </button>
            )}
          </>
        )}
        
        {message.kind === "success" && (
          <>
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-3 shadow">
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-emerald-900">Interview Scheduled! ✅</div>
                  <div className="text-xs text-emerald-800 mt-1 whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
              {onJumpToInterviews && <button onClick={onJumpToInterviews} className="w-full mt-2 text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline">View in Interviews tab →</button>}
            </div>
            {suggestionText && onSuggestionClick && (
              <button
                onClick={() => onSuggestionClick(suggestionText)}
                className="w-full text-left px-3 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-400 rounded-lg transition group flex items-center gap-2"
              >
                <Sparkles size={14} className="text-blue-600 flex-shrink-0" />
                <span className="text-xs font-medium text-slate-700 flex-1">Click to auto-fill: <span className="text-blue-700 font-semibold">{suggestionText}</span></span>
                <ArrowRight size={14} className="text-blue-600 group-hover:translate-x-1 transition" />
              </button>
            )}
          </>
        )}
        
        {message.kind === "ask_missing" && <BotBubble content={message.content} accent="amber" />}

        {message.kind === "candidate_disambig" && (
          <div className="space-y-2">
            <BotBubble content={`Multiple candidates found. Pick one:`} />
            {(message.options || []).map((opt, i) => (
              <button key={i} onClick={() => engine.selectCandidate(opt, message.slots)} className="w-full text-left p-3 bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition group">
                <div className="flex items-start justify-between mb-1"><div><div className="font-bold text-sm text-slate-900">{opt.candidate.name}</div><div className="mono text-[10px] text-slate-700">{opt.candidate.rh_id}</div></div><ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" /></div>
                <div className="flex gap-1.5 flex-wrap mt-1"><Pill color="indigo">{opt.application.current_round}</Pill><Pill color="blue">{opt.job.title}</Pill><Pill color="green">Match {opt.application.match_score}%</Pill></div>
              </button>
            ))}
          </div>
        )}

        {message.kind === "interviewer_disambig" && (
          <div className="space-y-2">
            <BotBubble content="Multiple interviewers found. Pick one:" />
            {(message.options || []).map((emp, i) => (
              <button key={i} onClick={() => engine.selectInterviewer(emp, message.slots, message.candidate)} className="w-full text-left p-3 bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition group">
                <div className="flex items-start justify-between"><div><div className="font-bold text-sm text-slate-900">{emp.name}</div><div className="mono text-[10px] text-slate-700">{emp.employee_id} · {emp.department}</div></div><ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" /></div>
              </button>
            ))}
          </div>
        )}

        {message.kind === "wrong_round" && (
          <div className="space-y-2">
            {(() => { const cand = snapshot.candidates.find(c => c.rh_id === message.options?.[0]?.rh_id); return <BotBubble content={`⚠️ ${cand?.name || "Candidate"} is currently in **${message.options?.[0]?.current_round}**, not **${message.requested_round}**. Schedule anyway?`} accent="amber" />; })()}
            <div className="flex gap-2">
              <button onClick={() => engine.acceptWrongRound(message.options[0], message.slots)} className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md">Yes, schedule anyway</button>
              <button onClick={engine.declineWrongRound} className="flex-1 px-3 py-2 border-2 border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-md">No, cancel</button>
            </div>
          </div>
        )}

        {message.kind === "not_qualified" && (
          <div className="space-y-2">
            <BotBubble content={`${message.named?.name} isn't certified to assess **${message.round}**. Try one of these instead:`} accent="red" />
            {(message.alternatives || []).map((alt, i) => (
              <button key={i} onClick={() => engine.selectAlternative(alt.emp, message.slots, message.candidate)} className="w-full text-left p-2.5 bg-white border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded-lg transition">
                <div className="flex items-center justify-between"><div><div className="font-bold text-sm text-slate-900">{alt.emp.name}</div><div className="mono text-[10px] text-slate-700">{alt.emp.employee_id} · {alt.emp.department}</div></div><Pill color="green">Score {alt.score}</Pill></div>
              </button>
            ))}
          </div>
        )}

        {message.kind === "no_slot" && (
          <div className="space-y-2">
            <BotBubble content={`${message.interviewer?.name} is qualified but has no confirmed slot at ${formatDateDisplay(message.slots?.date)}, ${message.slots?.time?.start}–${message.slots?.time?.end}.`} accent="amber" />

            {(message.nearby || []).length > 0 && (
              <div className="bg-white border-2 border-slate-200 rounded-lg p-3">
                <div className="text-xs font-bold text-slate-700 mb-2">a) Use a nearby available slot:</div>
                {message.nearby.slice(0, 3).map((s, i) => (
                  <button key={i} onClick={() => engine.chooseNearbySlot(s, message.interviewer, message.slots, message.candidate)} className="w-full flex items-center gap-2 px-2 py-1.5 mb-1 bg-emerald-50 border border-emerald-300 rounded text-xs hover:bg-emerald-100 text-slate-900">
                    <CheckCircle2 size={12} className="text-emerald-600" /><span className="font-semibold">{formatDateDisplay(s.slot_date)}</span><span>{s.start_time}–{s.end_time}</span><ArrowRight size={10} className="ml-auto text-emerald-700" />
                  </button>
                ))}
              </div>
            )}

            {(message.alternatives || []).length > 0 && (
              <div className="bg-white border-2 border-slate-200 rounded-lg p-3">
                <div className="text-xs font-bold text-slate-700 mb-2">b) Switch to another available interviewer:</div>
                {message.alternatives.map((alt, i) => (
                  <button key={i} onClick={() => engine.selectAlternative(alt.emp, message.slots, message.candidate)} className="w-full flex items-center justify-between px-2 py-1.5 mb-1 bg-blue-50 border border-blue-300 rounded text-xs hover:bg-blue-100 text-slate-900">
                    <span><span className="font-bold">{alt.emp.name}</span> · <span className="text-slate-600">{alt.emp.department}</span></span><Pill color="blue">Score {alt.score}</Pill>
                  </button>
                ))}
              </div>
            )}

            {/* A/B timeslot buttons */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-600">c) Add availability for {message.interviewer?.name}:</div>
              <button
                onClick={() => engine.addConfirmedSlot(message.interviewer, message.slots)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition shadow"
              >
                <CheckCircle2 size={16} />
                A) Add Confirmed timeslot for {message.interviewer?.name}
              </button>
              <button
                onClick={() => engine.raiseSlotRequest(message.interviewer, message.slots)}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition shadow"
              >
                <Clock size={16} />
                B) Add Pending request to {message.interviewer?.name}
              </button>
            </div>
          </div>
        )}

        {message.kind === "no_availability" && (
          <div className="space-y-2">
            <BotBubble content={`No qualified interviewer has a confirmed slot at ${formatDateDisplay(message.slots?.date)}, ${message.slots?.time?.start}–${message.slots?.time?.end}. Top options:`} accent="amber" />
            {(message.top3 || []).map((item, i) => (
              <div key={i} className="bg-white border-2 border-slate-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between"><div><div className="font-bold text-sm text-slate-900">{item.emp.name}</div><div className="mono text-[10px] text-slate-600">{item.emp.employee_id} · {item.emp.department}</div></div><Pill color="blue">Score {item.score}</Pill></div>
                {(item.nearby || []).slice(0,2).map((s,j) => (
                  <button key={j} onClick={() => engine.chooseNearbySlot(s, item.emp, message.slots, message.candidate)} className="w-full flex items-center gap-2 px-2 py-1 bg-emerald-50 border border-emerald-300 rounded text-xs hover:bg-emerald-100 text-slate-900">
                    <CheckCircle2 size={10} className="text-emerald-600" /><span>{formatDateDisplay(s.slot_date)}, {s.start_time}–{s.end_time}</span><ArrowRight size={9} className="ml-auto" />
                  </button>
                ))}
                <button onClick={() => engine.addConfirmedSlot(item.emp, message.slots)} className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition">
                  <CheckCircle2 size={13} /> A) Add Confirmed timeslot for {item.emp.name}
                </button>
                <button onClick={() => engine.raiseSlotRequest(item.emp, message.slots)} className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition">
                  <Clock size={13} /> B) Add Pending request to {item.emp.name}
                </button>
              </div>
            ))}
          </div>
        )}

        {message.kind === "confirm" && (
          <div className="bg-white border-2 border-blue-500 rounded-lg overflow-hidden shadow-md">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 flex items-center gap-2">
              <Sparkles size={14} /><span className="font-bold text-sm">Schedule preview</span>
              {message.auto_picked && <Pill color="amber">Auto-picked</Pill>}
            </div>
            <div className="p-3 space-y-3 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Candidate</div>
                <div className="font-bold text-slate-900">{message.candidate?.candidate?.name}</div>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  <Pill>{message.candidate?.candidate?.rh_id}</Pill>
                  <Pill color="blue">{message.candidate?.job?.title}</Pill>
                  <Pill color="indigo">{message.candidate?.application?.current_round}</Pill>
                  <Pill color="green">Match {message.candidate?.application?.match_score}%</Pill>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Interviewer</div>
                <div className="font-bold text-slate-900">{message.interviewer?.name}</div>
                <div className="flex gap-1.5 flex-wrap mt-1"><Pill>{message.interviewer?.employee_id}</Pill><Pill color="blue">{message.interviewer?.department}</Pill><Pill color="indigo">{message.interviewer?.grade}</Pill></div>
              </div>
              <div className="border-t border-slate-100 pt-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">When</div>
                <div className="font-bold text-slate-900">{formatDateDisplay(message.slots?.date)}, {message.slots?.time?.start}–{message.slots?.time?.end}</div>
              </div>
              <div className="border-t border-slate-100 pt-2 flex flex-wrap gap-1.5">
                <Pill color="blue">{message.slots?.mode || "Video"}</Pill>
                <Pill color="indigo">Topic: {message.slots?.topic || "Interview"}</Pill>
                <Pill color="green">Candidate will be invited</Pill>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button onClick={() => engine.confirmSchedule(message)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md text-sm font-bold shadow">Confirm & Schedule</button>
              <button onClick={engine.cancelConfirm} className="px-4 py-2 border-2 border-slate-300 rounded-md text-sm font-semibold text-slate-800 hover:bg-white">Cancel</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
