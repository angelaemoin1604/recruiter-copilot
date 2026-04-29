// useChatEngine.js - Shared chat state + scheduling logic
import { useState, useCallback, useRef } from "react";
import { processMessage, resolveInterviewer, checkChosenInterviewer } from "../resolution.js";
import * as DB from "../db.js";

// Safe toast helper - works whether toast is an object {success,error} or a function
function safeToast(toast, type, msg) {
  try {
    if (!toast) return;
    if (typeof toast[type] === "function") toast[type](msg);
    else if (typeof toast === "function") toast(msg);
  } catch (e) { console.warn("toast error:", e); }
}

// ============================================================
// VALID suggestions - these are real combinations that WILL work
// candidate name matches actual DB records
// job matches what candidate applied for  
// interviewer is certified for that round
// All verified against actual Supabase data
// ============================================================
const VALID_SUGGESTIONS = [
  {
    candidate: "Anjali Sharma", job: "Application Developer II",
    round: "Interview 1", interviewer: "Rajesh Kumar",
    mode: "Telephonic", topic: "Java Coding",
    note: "Anjali (RH00081234) applying for App Dev II, Rajesh certified for Interview 1"
  },
  {
    candidate: "Anjali Sharma", job: "Application Developer II",
    round: "Interview 1", interviewer: "Aarav Mehta",
    mode: "Video", topic: "System Design",
    note: "Anjali (RH00081235) applying for App Dev II, Aarav certified for Interview 1"
  },
  {
    candidate: "Anjali Sharma", job: "Frontend Engineer",
    round: "Interview 1", interviewer: "Vikram Singh",
    mode: "Video", topic: "React and TypeScript",
    note: "Anjali (RH00081236) applying for Frontend, Vikram certified"
  },
  {
    candidate: "Rohan Gupta", job: "Application Developer II",
    round: "Interview 2", interviewer: "Rahul Verma",
    mode: "Video", topic: "Microservices Architecture",
    note: "Rohan (RH00081240) in Interview 2 for App Dev II"
  },
  {
    candidate: "Rohan Gupta", job: "Senior Java Developer",
    round: "Interview 1", interviewer: "Aarav Mehta",
    mode: "Telephonic", topic: "Advanced Java",
    note: "Rohan (RH00081241) applying for Senior Java Dev"
  },
  {
    candidate: "Manish Pandey", job: "Application Developer II",
    round: "Interview 1", interviewer: "Neha Kapoor",
    mode: "Video", topic: "Data Structures",
    note: "Manish (RH00081245) applying for App Dev II"
  },
  {
    candidate: "Aditi Desai", job: "Frontend Engineer",
    round: "Interview 1", interviewer: "Vikram Singh",
    mode: "Telephonic", topic: "CSS and HTML Fundamentals",
    note: "Aditi (RH00081246) applying for Frontend"
  },
  {
    candidate: "Manish Pandey", job: "Application Developer II",
    round: "Interview 1", interviewer: "Rajesh Kumar",
    mode: "Telephonic", topic: "OOP Concepts",
    note: "Manish (RH00081245) alternate interviewer"
  },
  {
    candidate: "Rohan Gupta", job: "Application Developer II",
    round: "Interview 1", interviewer: "Aarav Mehta",
    mode: "Video", topic: "Spring Boot",
    note: "Rohan (RH00081240) Interview 1"
  },
  {
    candidate: "Anjali Sharma", job: "Application Developer II",
    round: "Interview 1", interviewer: "Rahul Verma",
    mode: "Video", topic: "REST APIs",
    note: "Anjali with Rahul"
  },
];

let usedSuggestionIdx = new Set();
function getNextSuggestion() {
  if (usedSuggestionIdx.size >= VALID_SUGGESTIONS.length) usedSuggestionIdx = new Set();
  let idx;
  do { idx = Math.floor(Math.random() * VALID_SUGGESTIONS.length); }
  while (usedSuggestionIdx.has(idx));
  usedSuggestionIdx.add(idx);
  return VALID_SUGGESTIONS[idx];
}

const TIME_SLOTS = ["9-10 AM", "10-11 AM", "11 AM-12 PM", "2-3 PM", "3-4 PM", "4-5 PM"];
function futureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// Build a complete ready-to-send suggestion string
function buildSuggestionText(s, daysAhead) {
  const date = futureDate(daysAhead);
  const time = TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
  return `Schedule ${s.round} for ${s.candidate}, ${s.job}, ${date} ${time}, ${s.mode}, with ${s.interviewer}, topic ${s.topic}`;
}

function makeHelloMsg() {
  const s = getNextSuggestion();
  const days = 2 + Math.floor(Math.random() * 5);
  const text = buildSuggestionText(s, days);
  return {
    id: 1, role: "assistant", kind: "text",
    content: `Hi! I'm Recruiter Copilot.\n\nJust copy and send this to schedule right now:\n\n"${text}"\n\n(Or type your own schedule request below)`
  };
}

const scheduledCombinations = new Set();
function combinationKey(msg) {
  return [
    msg.candidate?.candidate?.rh_id,
    msg.interviewer?.employee_id,
    msg.slots?.round_name,
    msg.slots?.date,
    msg.slots?.time?.start
  ].join("|");
}

export function useChatEngine({ snapshot, refreshSnapshot, currentUser, toast }) {
  const [messages, setMessages] = useState(() => [makeHelloMsg()]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(null);
  const [thinking, setThinking] = useState(false);

  const addMsg = useCallback((m) => {
    setMessages(prev => [...prev, { ...m, id: Date.now() + Math.random() }]);
  }, []);

  const reset = useCallback(() => {
    setMessages([makeHelloMsg()]);
    setPending(null);
    setInput("");
  }, []);

  const send = useCallback(async () => {
    if (!input.trim()) return;
    const text = input.trim();
    addMsg({ role: "user", kind: "text", content: text });
    setInput("");
    setThinking(true);
    await new Promise(r => setTimeout(r, 600));
    setThinking(false);
    try {
      const result = processMessage(text, snapshot);
      addMsg({ role: "assistant", ...result });
      if (result.kind === "confirm") setPending(result);
    } catch (err) {
      console.error("send error:", err);
      addMsg({ role: "assistant", kind: "text", content: `❌ Error processing request: ${err?.message || "Unknown error"}. Please try again.` });
    }
  }, [input, snapshot, addMsg]);

  const handleIRes = useCallback((iRes, slots, cRes) => {
    if (!iRes) { addMsg({ role: "assistant", kind: "text", content: "Internal error resolving interviewer." }); return; }
    if (iRes.status === "interviewer_not_found") { addMsg({ role: "assistant", kind: "text", content: `❌ Couldn't find interviewer "${iRes.ref}". Check spelling in the Employees tab.` }); return; }
    if (iRes.status === "interviewer_multiple") { addMsg({ role: "assistant", kind: "interviewer_disambig", slots, candidate: cRes, options: iRes.options }); return; }
    if (iRes.status === "not_qualified") { addMsg({ role: "assistant", kind: "not_qualified", slots, candidate: cRes, named: iRes.named, alternatives: iRes.alternatives, round: iRes.round }); return; }
    if (iRes.status === "no_qualified") { addMsg({ role: "assistant", kind: "text", content: `❌ No certified interviewers for ${slots.round_name}. Go to Employees tab and assign the round to someone.` }); return; }
    if (iRes.status === "no_slot") { addMsg({ role: "assistant", kind: "no_slot", slots, candidate: cRes, interviewer: iRes.interviewer, nearby: iRes.nearby || [], alternatives: iRes.alternatives || [] }); return; }
    if (iRes.status === "no_availability") { addMsg({ role: "assistant", kind: "no_availability", slots, candidate: cRes, top3: iRes.top3 }); return; }
    const confirmMsg = { role: "assistant", kind: "confirm", slots, candidate: cRes, interviewer: iRes.interviewer, slot: iRes.slot, auto_picked: iRes.status === "auto_picked", score: iRes.score };
    addMsg(confirmMsg);
    setPending(confirmMsg);
  }, [addMsg]);

  const selectCandidate = useCallback(async (opt, slots) => {
    addMsg({ role: "user", kind: "text", content: `Selected: ${opt.candidate.name} · ${opt.job.title}` });
    setThinking(true); await new Promise(r => setTimeout(r, 400)); setThinking(false);
    const ns = { ...slots, candidate_name: opt.candidate.name, job: { matched: opt.job, raw: opt.job.title } };
    const cRes = { status: "resolved", application: opt.application, candidate: opt.candidate, job: opt.job };
    handleIRes(resolveInterviewer(ns, cRes, snapshot), ns, cRes);
  }, [snapshot, addMsg, handleIRes]);

  const selectInterviewer = useCallback(async (emp, slots, candidate) => {
    addMsg({ role: "user", kind: "text", content: `Selected: ${emp.name} · ${emp.department}` });
    setThinking(true); await new Promise(r => setTimeout(r, 350)); setThinking(false);
    const jobSkills = snapshot.job_required_skill.filter(s => s.job_id === candidate.job.job_id);
    const checked = checkChosenInterviewer(emp, slots, candidate.job, jobSkills, slots.round_name, snapshot);
    if (checked.status === "ready") {
      const c = { role: "assistant", kind: "confirm", slots, candidate, interviewer: checked.interviewer, slot: checked.slot };
      addMsg(c); setPending(c);
    } else if (checked.status === "no_slot") {
      addMsg({ role: "assistant", kind: "no_slot", slots, candidate, interviewer: checked.interviewer, nearby: checked.nearby || [], alternatives: checked.alternatives || [] });
    }
  }, [snapshot, addMsg]);

  const selectAlternative = selectInterviewer;

  const chooseNearbySlot = useCallback((slot, emp, slots, candidate) => {
    const ns = { ...slots, date: slot.slot_date, time: { start: slot.start_time, end: slot.end_time } };
    const c = { role: "assistant", kind: "confirm", slots: ns, candidate, interviewer: emp, slot };
    addMsg(c); setPending(c);
  }, [addMsg]);

  // A) Add confirmed timeslot directly — green button
  const addConfirmedSlot = useCallback(async (emp, slots) => {
    try {
      await DB.add("interviewer_availability", {
        employee_id: emp.employee_id,
        slot_date: slots.date,
        start_time: slots.time.start,
        end_time: slots.time.end,
        status: "confirmed",
        added_by: currentUser.id,
        added_by_self: false
      });
      await refreshSnapshot();
      addMsg({ role: "assistant", kind: "text", content: `✅ Confirmed timeslot added for ${emp.name} on ${slots.date} ${slots.time.start}–${slots.time.end}.\n\nNow try scheduling again — the slot is available!` });
      safeToast(toast, "success", `✅ Timeslot confirmed for ${emp.name}`);
    } catch (err) {
      console.error("addConfirmedSlot error:", err);
      addMsg({ role: "assistant", kind: "text", content: `❌ Failed to add timeslot: ${err?.message || "Unknown error"}. Please try again.` });
      safeToast(toast, "error", "Failed to add timeslot");
    }
  }, [currentUser, refreshSnapshot, addMsg, toast]);

  // B) Raise pending timeslot request — yellow button
  const raiseSlotRequest = useCallback(async (emp, slots) => {
    try {
      await DB.add("time_slot_request", {
        employee_id: emp.employee_id,
        requested_by: currentUser.id,
        slot_date: slots.date,
        start_time: slots.time.start,
        end_time: slots.time.end,
        repeat_pattern: "none",
        status: "pending",
        created_at: new Date().toISOString()
      });
      await refreshSnapshot();
      addMsg({ role: "assistant", kind: "text", content: `⏳ Pending request sent to ${emp.name} for ${slots.date} ${slots.time.start}–${slots.time.end}.\n\nOnce they confirm in the Employees tab, come back here to schedule.` });
      safeToast(toast, "success", `Pending request sent to ${emp.name}`);
    } catch (err) {
      console.error("raiseSlotRequest error:", err);
      addMsg({ role: "assistant", kind: "text", content: `❌ Failed to send request: ${err?.message || "Unknown error"}. Please try again.` });
      safeToast(toast, "error", "Failed to send request");
    }
  }, [currentUser, refreshSnapshot, addMsg, toast]);

  const acceptWrongRound = useCallback(async (app, slots) => {
    addMsg({ role: "user", kind: "text", content: "Yes, schedule it anyway" });
    setThinking(true); await new Promise(r => setTimeout(r, 300)); setThinking(false);
    const cand = snapshot.candidates.find(c => c.rh_id === app.rh_id);
    const job = snapshot.jobs.find(j => j.job_id === app.job_id);
    const cRes = { status: "resolved", application: app, candidate: cand, job };
    handleIRes(resolveInterviewer(slots, cRes, snapshot), slots, cRes);
  }, [snapshot, addMsg, handleIRes]);

  const declineWrongRound = useCallback(() => {
    addMsg({ role: "user", kind: "text", content: "No, cancel" });
    addMsg({ role: "assistant", kind: "text", content: "Cancelled. Try again with the correct round." });
  }, [addMsg]);

  const confirmSchedule = useCallback(async (msg) => {
    const key = combinationKey(msg);
    if (scheduledCombinations.has(key)) {
      addMsg({ role: "assistant", kind: "text", content: "⚠️ This exact interview is already scheduled. Please change the date, time, or interviewer." });
      safeToast(toast, "error", "Already scheduled — change date/time/interviewer");
      return;
    }
    try {
      const round = snapshot.interview_round.find(r =>
        r.job_id === msg.candidate.job.job_id && r.round_name === msg.slots.round_name
      );
      const id = await DB.add("interviews", {
        rh_id: msg.candidate.candidate.rh_id,
        job_id: msg.candidate.job.job_id,
        round_name: msg.slots.round_name,
        interviewer_id: msg.interviewer.employee_id,
        topic: msg.slots.topic || round?.default_topic || "Interview",
        mode: msg.slots.mode || "Video",
        slot_date: msg.slots.date,
        start_time: msg.slots.time.start,
        end_time: msg.slots.time.end,
        status: "scheduled",
        candidate_invited: true,
        scheduled_by: currentUser.id,
        created_at: new Date().toISOString()
      });

      if (id === null || id === undefined) {
        throw new Error("No ID returned from Supabase. Check RLS policies allow INSERT on interviews table.");
      }

      await DB.add("interview_history", {
        interview_id: id,
        action: "scheduled",
        at: new Date().toISOString(),
        by_user: currentUser.id
      });

      scheduledCombinations.add(key);
      await refreshSnapshot();
      setPending(null);

      // Show next ready-to-use suggestion
      const next = getNextSuggestion();
      const nextDays = 3 + Math.floor(Math.random() * 4);
      const nextText = buildSuggestionText(next, nextDays);

      addMsg({
        role: "assistant", kind: "success", interview_id: id,
        content: `✅ ${msg.candidate.candidate.name} with ${msg.interviewer.name}\n${msg.slots.date} · ${msg.slots.time.start}–${msg.slots.time.end} · ${msg.slots.mode || "Video"}\n\nNext interview to schedule — just copy and send:\n\n"${nextText}"`
      });
      safeToast(toast, "success", "✅ Interview scheduled!");
    } catch (err) {
      console.error("confirmSchedule error:", err);
      addMsg({ role: "assistant", kind: "text", content: `❌ Failed to schedule: ${err?.message || "Unknown error"}.\n\nPlease try again or check your Supabase connection.` });
      safeToast(toast, "error", `Failed: ${err?.message || "Unknown error"}`);
    }
  }, [snapshot, currentUser, refreshSnapshot, addMsg, toast]);

  const cancelConfirm = useCallback(() => {
    setPending(null);
    addMsg({ role: "assistant", kind: "text", content: "Cancelled. What else should I schedule?" });
  }, [addMsg]);

  return {
    messages, input, setInput, thinking, pending,
    send, reset,
    selectCandidate, selectInterviewer, selectAlternative,
    chooseNearbySlot, raiseSlotRequest, addConfirmedSlot,
    acceptWrongRound, declineWrongRound,
    confirmSchedule, cancelConfirm
  };
}
