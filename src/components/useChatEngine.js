// useChatEngine.js
import { useState, useCallback } from "react";
import { processMessage, resolveInterviewer, checkChosenInterviewer } from "../resolution.js";
import * as DB from "../supabase.js";

// ONLY 100% VERIFIED candidates+jobs from the database
// All combinations verified from Candidates tab screenshot
const SUGGESTIONS = [
  // Anjali Sharma combinations (has 3 applications)
  { candidate: "Anjali Sharma", job: "Application Developer II", round: "Interview 1", interviewer: "Rajesh Kumar", mode: "Telephonic", topic: "Java Fundamentals" },
  { candidate: "Anjali Sharma", job: "Application Developer II", round: "Interview 1", interviewer: "Neha Kapoor", mode: "Video", topic: "OOP Concepts" },
  { candidate: "Anjali Sharma", job: "Frontend Engineer", round: "Interview 1", interviewer: "Vikram Singh", mode: "Video", topic: "React & TypeScript" },
  
  // Rohan Gupta combinations (has 2 applications)
  { candidate: "Rohan Gupta", job: "Application Developer II", round: "Interview 1", interviewer: "Neha Kapoor", mode: "Telephonic", topic: "Java Coding" },
  { candidate: "Rohan Gupta", job: "Application Developer II", round: "Interview 2", interviewer: "Aarav Mehta", mode: "Video", topic: "System Design" },
  { candidate: "Rohan Gupta", job: "Senior Java Developer", round: "Interview 1", interviewer: "Rajesh Kumar", mode: "Video", topic: "Java Advanced" },
  
  // Manish Pandey combinations
  { candidate: "Manish Pandey", job: "Application Developer II", round: "Interview 1", interviewer: "Rajesh Kumar", mode: "Video", topic: "Data Structures" },
  { candidate: "Manish Pandey", job: "Application Developer II", round: "Interview 1", interviewer: "Neha Kapoor", mode: "Telephonic", topic: "Algorithms" },
  
  // Aditi Desai combinations
  { candidate: "Aditi Desai", job: "Frontend Engineer", round: "Interview 1", interviewer: "Vikram Singh", mode: "Video", topic: "CSS & HTML" },
  { candidate: "Aditi Desai", job: "Frontend Engineer", round: "Interview 1", interviewer: "Aarav Mehta", mode: "Telephonic", topic: "JavaScript Basics" },
  
  // Karthik Raman combinations
  { candidate: "Karthik Raman", job: "QA Engineer", round: "Interview 1", interviewer: "Vikram Singh", mode: "Video", topic: "Testing Fundamentals" },
  { candidate: "Karthik Raman", job: "QA Engineer", round: "Interview 1", interviewer: "Neha Kapoor", mode: "Telephonic", topic: "Automation Testing" },
  
  // Meera Joshi combinations
  { candidate: "Meera Joshi", job: "HR Business Partner", round: "HR Stage", interviewer: "Rajesh Kumar", mode: "In-person", topic: "HR Policies" },
  { candidate: "Meera Joshi", job: "HR Business Partner", round: "Interview 1", interviewer: "Aarav Mehta", mode: "Video", topic: "HR Operations" },
  
  // Anil Kumar combinations
  { candidate: "Anil Kumar", job: "Application Developer II", round: "Interview 1", interviewer: "Neha Kapoor", mode: "Video", topic: "Java & Spring" },
  { candidate: "Anil Kumar", job: "Application Developer II", round: "Interview 1", interviewer: "Rajesh Kumar", mode: "Telephonic", topic: "REST APIs" },
  
  // Pooja Bhat combinations
  { candidate: "Pooja Bhat", job: "Senior Java Developer", round: "Interview 1", interviewer: "Aarav Mehta", mode: "Video", topic: "Backend Architecture" },
  { candidate: "Pooja Bhat", job: "Senior Java Developer", round: "Interview 1", interviewer: "Rajesh Kumar", mode: "Telephonic", topic: "Microservices" },
  
  // Sandeep Roy combinations
  { candidate: "Sandeep Roy", job: "Frontend Engineer", round: "Interview 1", interviewer: "Vikram Singh", mode: "Video", topic: "JavaScript & React" },
  { candidate: "Sandeep Roy", job: "Frontend Engineer", round: "Interview 1", interviewer: "Aarav Mehta", mode: "Telephonic", topic: "Frontend Frameworks" },
];

let usedIdx = new Set();
function nextSuggestion() {
  if (usedIdx.size >= SUGGESTIONS.length) usedIdx = new Set();
  let idx;
  do { idx = Math.floor(Math.random() * SUGGESTIONS.length); } while (usedIdx.has(idx));
  usedIdx.add(idx);
  return SUGGESTIONS[idx];
}

const TIMES = ["9-10 AM", "10-11 AM", "11 AM-12 PM", "2-3 PM", "3-4 PM", "4-5 PM"];

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

function futureDate(daysAhead) {
  const d = new Date(); 
  d.setDate(d.getDate() + daysAhead);
  const day = d.getDate();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const year = d.getFullYear();
  return `${day}${getOrdinalSuffix(day)} ${months[d.getMonth()]} ${year}`;
}

function makeHelloMsg() {
  const s = nextSuggestion();
  const date = futureDate(2 + Math.floor(Math.random() * 5));
  const time = TIMES[Math.floor(Math.random() * TIMES.length)];
  const suggestionText = `Schedule ${s.round} for ${s.candidate}, ${s.job}, ${date}, ${time}, ${s.mode}, with ${s.interviewer}, topic ${s.topic}`;
  return { 
    id: 1, 
    role: "assistant", 
    kind: "text", 
    content: `Hi! I'm Recruiter Copilot.\n\nTell me what to schedule. Try:\n"${suggestionText}"`,
    suggestionText // Keep this so we can extract it for currentSuggestion
  };
}

const scheduledKeys = new Set();
function scheduleKey(msg) {
  return `${msg.candidate?.candidate?.rh_id}|${msg.interviewer?.employee_id}|${msg.slots?.round_name}|${msg.slots?.date}|${msg.slots?.time?.start}`;
}

export function useChatEngine({ snapshot, refreshSnapshot, currentUser, toast }) {
  const [messages, setMessages] = useState([makeHelloMsg()]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState(() => {
    const hello = makeHelloMsg();
    return hello.suggestionText;
  });

  const addMsg = useCallback((m) => setMessages(a => [...a, { ...m, id: Date.now() + Math.random() }]), []);

  const reset = useCallback(() => { 
    const hello = makeHelloMsg();
    setMessages([hello]); 
    setCurrentSuggestion(hello.suggestionText);
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
      addMsg({ role: "assistant", kind: "text", content: `❌ Error: ${err?.message || "Something went wrong"}. Please try again.` });
    }
  }, [input, snapshot, addMsg]);

  const handleIRes = useCallback((iRes, slots, cRes) => {
    if (!iRes) { addMsg({ role: "assistant", kind: "text", content: "Internal error." }); return; }
    if (iRes.status === "interviewer_not_found") { addMsg({ role: "assistant", kind: "text", content: `Couldn't find interviewer "${iRes.ref}". Check the name.` }); return; }
    if (iRes.status === "interviewer_multiple") { addMsg({ role: "assistant", kind: "interviewer_disambig", slots, candidate: cRes, options: iRes.options }); return; }
    if (iRes.status === "not_qualified") { addMsg({ role: "assistant", kind: "not_qualified", slots, candidate: cRes, named: iRes.named, alternatives: iRes.alternatives, round: iRes.round }); return; }
    if (iRes.status === "no_qualified") { addMsg({ role: "assistant", kind: "text", content: "No certified interviewers found for that round." }); return; }
    if (iRes.status === "no_slot") { addMsg({ role: "assistant", kind: "no_slot", slots, candidate: cRes, interviewer: iRes.interviewer, nearby: iRes.nearby || [], alternatives: iRes.alternatives || [] }); return; }
    if (iRes.status === "no_availability") { addMsg({ role: "assistant", kind: "no_availability", slots, candidate: cRes, top3: iRes.top3 }); return; }
    const c = { role: "assistant", kind: "confirm", slots, candidate: cRes, interviewer: iRes.interviewer, slot: iRes.slot, auto_picked: iRes.status === "auto_picked", score: iRes.score };
    addMsg(c); setPending(c);
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
    if (checked.status === "ready") { const c = { role: "assistant", kind: "confirm", slots, candidate, interviewer: checked.interviewer, slot: checked.slot }; addMsg(c); setPending(c); }
    else if (checked.status === "no_slot") addMsg({ role: "assistant", kind: "no_slot", slots, candidate, interviewer: checked.interviewer, nearby: checked.nearby || [], alternatives: checked.alternatives || [] });
  }, [snapshot, addMsg]);

  const selectAlternative = selectInterviewer;

  const chooseNearbySlot = useCallback((slot, emp, slots, candidate) => {
    const ns = { ...slots, date: slot.slot_date, time: { start: slot.start_time, end: slot.end_time } };
    const c = { role: "assistant", kind: "confirm", slots: ns, candidate, interviewer: emp, slot };
    addMsg(c); setPending(c);
  }, [addMsg]);

  // FIX #2: Wrap addConfirmedSlot in try-catch with user-friendly error
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
      addMsg({ role: "assistant", kind: "text", content: `✅ Confirmed timeslot added for ${emp.name} on ${slots.date} ${slots.time.start}–${slots.time.end}. You can now schedule!` });
      if (toast?.success) toast.success(`Timeslot confirmed for ${emp.name}`);
    } catch (err) {
      console.error("addConfirmedSlot error:", err);
      addMsg({ role: "assistant", kind: "text", content: "Something went wrong. Please try again later." });
      if (toast?.error) toast.error("Something went wrong. Please try again later.");
    }
  }, [currentUser, refreshSnapshot, addMsg, toast]);

  // FIX #2: Wrap raiseSlotRequest in try-catch with user-friendly error
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
      addMsg({ role: "assistant", kind: "text", content: `⏳ Pending request sent to ${emp.name} for ${slots.date} ${slots.time.start}–${slots.time.end}.` });
      if (toast?.success) toast.success(`Pending request sent to ${emp.name}`);
    } catch (err) {
      console.error("raiseSlotRequest error:", err);
      addMsg({ role: "assistant", kind: "text", content: "Something went wrong. Please try again later." });
      if (toast?.error) toast.error("Something went wrong. Please try again later.");
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
    const key = scheduleKey(msg);
    if (scheduledKeys.has(key)) {
      addMsg({ role: "assistant", kind: "text", content: "⚠️ This exact combination is already scheduled. Please use a different date, time, or interviewer." });
      if (toast?.error) toast.error("Already scheduled — change date/time/interviewer");
      return;
    }
    try {
      const round = snapshot.interview_round.find(r => r.job_id === msg.candidate.job.job_id && r.round_name === msg.slots.round_name);
      const result = await DB.add("interviews", {
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
      
      // Handle Supabase response - it returns the full record object, not just the ID
      const id = result?.id || result;
      if (!id && id !== 0) throw new Error("No ID returned — check Supabase RLS policies allow inserts");
      
      await DB.add("interview_history", { interview_id: id, action: "scheduled", at: new Date().toISOString(), by_user: currentUser.id });
      scheduledKeys.add(key);
      await refreshSnapshot();
      setPending(null);
      
      const next = nextSuggestion();
      const nextDate = futureDate(3 + Math.floor(Math.random() * 4));
      const nextTime = TIMES[Math.floor(Math.random() * TIMES.length)];
      const nextSuggestionText = `Schedule ${next.round} for ${next.candidate}, ${next.job}, ${nextDate}, ${nextTime}, ${next.mode}, with ${next.interviewer}, topic ${next.topic}`;
      
      // Add success message (green box only)
      addMsg({ 
        role: "assistant", 
        kind: "success", 
        interview_id: id, 
        content: `${msg.candidate.candidate.name} with ${msg.interviewer.name} on ${formatDateDisplay(msg.slots.date)}, ${msg.slots.time.start}–${msg.slots.time.end}.`
      });
      
      // Add next suggestion as separate text message
      addMsg({
        role: "assistant",
        kind: "text",
        content: `Next to schedule? Try:\n"${nextSuggestionText}"`
      });
      
      setCurrentSuggestion(nextSuggestionText);
      
      if (toast?.success) toast.success("✅ Interview scheduled!");
    } catch (err) {
      console.error("confirmSchedule error:", err);
      addMsg({ role: "assistant", kind: "text", content: `❌ Error: ${err?.message || "Something went wrong. Please try again later."}` });
      if (toast?.error) toast.error(`Error: ${err?.message || "Something went wrong"}`);
    }
  }, [snapshot, currentUser, refreshSnapshot, toast]);

  const cancelConfirm = useCallback(() => { setPending(null); addMsg({ role: "assistant", kind: "text", content: "Cancelled. What should I schedule instead?" }); }, [addMsg]);

  return { messages, input, setInput, thinking, pending, currentSuggestion, send, reset, selectCandidate, selectInterviewer, selectAlternative, chooseNearbySlot, raiseSlotRequest, addConfirmedSlot, acceptWrongRound, declineWrongRound, confirmSchedule, cancelConfirm };
}
