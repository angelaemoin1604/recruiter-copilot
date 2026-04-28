// useChatEngine.js - Shared chat state + scheduling logic
import { useState, useCallback } from "react";
import { processMessage, resolveInterviewer, checkChosenInterviewer } from "../resolution.js";
import * as DB from "../db.js";

// REAL candidates from the database with their actual job applications
// These are verified to exist in the system
const SCHEDULE_SUGGESTIONS = [
  { candidate: "Anjali Sharma", job: "Application Developer II", round: "Interview 1", interviewer: "Rajesh Kumar", mode: "Telephonic", topic: "Java Coding" },
  { candidate: "Anjali Sharma", job: "Application Developer II", round: "Interview 1", interviewer: "Aarav Mehta", mode: "Video", topic: "System Design" },
  { candidate: "Anjali Sharma", job: "Frontend Engineer", round: "Interview 1", interviewer: "Vikram Singh", mode: "Video", topic: "React & TypeScript" },
  { candidate: "Rohan Gupta", job: "Application Developer II", round: "Interview 2", interviewer: "Rahul Verma", mode: "Video", topic: "Microservices" },
  { candidate: "Rohan Gupta", job: "Senior Java Developer", round: "Interview 1", interviewer: "Aarav Mehta", mode: "Telephonic", topic: "Java Advanced" },
  { candidate: "Manish Pandey", job: "Application Developer II", round: "Interview 1", interviewer: "Neha Kapoor", mode: "Video", topic: "Data Structures" },
  { candidate: "Aditi Desai", job: "Frontend Engineer", round: "Interview 1", interviewer: "Vikram Singh", mode: "Telephonic", topic: "CSS & HTML" },
  { candidate: "Karan Mehta", job: "QA Engineer", round: "Interview 1", interviewer: "Meera Nambiar", mode: "Video", topic: "Test Automation" },
  { candidate: "Priya Singh", job: "HR Business Partner", round: "HR Stage", interviewer: "Rajesh Kumar", mode: "In-person", topic: "HR Policies" },
  { candidate: "Rahul Joshi", job: "Application Developer II", round: "Interview 2", interviewer: "Priya Iyer", mode: "Telephonic", topic: "REST API Design" },
];

let usedSuggestionIndices = new Set();

function getNextSuggestion() {
  if (usedSuggestionIndices.size >= SCHEDULE_SUGGESTIONS.length) {
    usedSuggestionIndices = new Set();
  }
  let idx;
  do { idx = Math.floor(Math.random() * SCHEDULE_SUGGESTIONS.length); }
  while (usedSuggestionIndices.has(idx));
  usedSuggestionIndices.add(idx);
  return SCHEDULE_SUGGESTIONS[idx];
}

function getExampleDate(offset = 3) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const day = date.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[date.getMonth()]}`;
}

const TIMES = ["9-10 AM", "10-11 AM", "11 AM-12 PM", "2-3 PM", "3-4 PM", "4-5 PM"];

function getHelloMsg() {
  const s = getNextSuggestion();
  const dateOffset = 2 + Math.floor(Math.random() * 5);
  const time = TIMES[Math.floor(Math.random() * TIMES.length)];
  const exampleDate = getExampleDate(dateOffset);
  return {
    id: 1,
    role: "assistant",
    kind: "text",
    content: `Hi! I'm Recruiter Copilot.\n\nTell me what to schedule. Try:\n"Schedule ${s.round} for ${s.candidate}, ${s.job}, ${exampleDate} ${time}, ${s.mode}, with ${s.interviewer}, topic ${s.topic}"`
  };
}

const scheduledCombinations = new Set();

function getCombinationKey(msg) {
  return `${msg.candidate?.candidate?.rh_id}|${msg.interviewer?.employee_id}|${msg.slots?.round_name}|${msg.slots?.date}|${msg.slots?.time?.start}`;
}

export function useChatEngine({ snapshot, refreshSnapshot, currentUser, toast }) {
  const [messages, setMessages] = useState([getHelloMsg()]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(null);
  const [thinking, setThinking] = useState(false);

  const addMessage = useCallback((m) => {
    setMessages(arr => [...arr, { ...m, id: Date.now() + Math.random() }]);
  }, []);

  const reset = useCallback(() => {
    setMessages([getHelloMsg()]);
    setPending(null);
    setInput("");
  }, []);

  const send = useCallback(async () => {
    if (!input.trim()) return;
    const text = input.trim();
    addMessage({ role: "user", kind: "text", content: text });
    setInput("");
    setThinking(true);
    await new Promise(r => setTimeout(r, 600));
    setThinking(false);
    const result = processMessage(text, snapshot);
    addMessage({ role: "assistant", ...result });
    setPending(result.kind === "confirm" ? result : null);
  }, [input, snapshot, addMessage]);

  const selectCandidate = useCallback(async (opt, prevSlots) => {
    addMessage({ role: "user", kind: "text", content: `Selected: ${opt.candidate.name} · ${opt.candidate.rh_id} · ${opt.job.title}` });
    setThinking(true);
    await new Promise(r => setTimeout(r, 400));
    setThinking(false);
    const newSlots = { ...prevSlots, candidate_name: opt.candidate.name, job: { matched: opt.job, raw: opt.job.title } };
    const cRes = { status: "resolved", application: opt.application, candidate: opt.candidate, job: opt.job };
    const iRes = resolveInterviewer(newSlots, cRes, snapshot);
    handleInterviewerResult(iRes, newSlots, cRes);
  }, [snapshot, addMessage]);

  const handleInterviewerResult = useCallback((iRes, slots, cRes) => {
    if (!iRes) { addMessage({ role: "assistant", kind: "text", content: "Internal error." }); return; }
    if (iRes.status === "interviewer_not_found") { addMessage({ role: "assistant", kind: "text", content: `I couldn't find an interviewer matching "${iRes.ref}".` }); return; }
    if (iRes.status === "interviewer_multiple") { addMessage({ role: "assistant", kind: "interviewer_disambig", slots, candidate: cRes, options: iRes.options }); return; }
    if (iRes.status === "not_qualified") { addMessage({ role: "assistant", kind: "not_qualified", slots, candidate: cRes, named: iRes.named, alternatives: iRes.alternatives, round: iRes.round }); return; }
    if (iRes.status === "no_qualified") { addMessage({ role: "assistant", kind: "text", content: "No qualified interviewer found for that round." }); return; }
    if (iRes.status === "no_slot") { addMessage({ role: "assistant", kind: "no_slot", slots, candidate: cRes, interviewer: iRes.interviewer, nearby: iRes.nearby || [], alternatives: iRes.alternatives || [] }); return; }
    if (iRes.status === "no_availability") { addMessage({ role: "assistant", kind: "no_availability", slots, candidate: cRes, top3: iRes.top3 }); return; }
    const confirmMsg = { role: "assistant", kind: "confirm", slots, candidate: cRes, interviewer: iRes.interviewer, slot: iRes.slot, auto_picked: iRes.status === "auto_picked", score: iRes.score };
    addMessage(confirmMsg);
    setPending(confirmMsg);
  }, [addMessage]);

  const selectInterviewer = useCallback(async (emp, prevSlots, candidate) => {
    addMessage({ role: "user", kind: "text", content: `Selected interviewer: ${emp.name} · ${emp.employee_id} · ${emp.department}` });
    setThinking(true);
    await new Promise(r => setTimeout(r, 350));
    setThinking(false);
    const job = candidate.job;
    const jobSkills = snapshot.job_required_skill.filter(s => s.job_id === job.job_id);
    const checked = checkChosenInterviewer(emp, prevSlots, job, jobSkills, prevSlots.round_name, snapshot);
    if (checked.status === "ready") {
      const confirmMsg = { role: "assistant", kind: "confirm", slots: prevSlots, candidate, interviewer: checked.interviewer, slot: checked.slot };
      addMessage(confirmMsg);
      setPending(confirmMsg);
    } else if (checked.status === "no_slot") {
      addMessage({ role: "assistant", kind: "no_slot", slots: prevSlots, candidate, interviewer: checked.interviewer, nearby: checked.nearby || [], alternatives: checked.alternatives || [] });
    }
  }, [snapshot, addMessage]);

  const selectAlternative = selectInterviewer;

  const chooseNearbySlot = useCallback((slot, emp, prevSlots, candidate) => {
    const newSlots = { ...prevSlots, date: slot.slot_date, time: { start: slot.start_time, end: slot.end_time } };
    const confirmMsg = { role: "assistant", kind: "confirm", slots: newSlots, candidate, interviewer: emp, slot };
    addMessage(confirmMsg);
    setPending(confirmMsg);
  }, [addMessage]);

  // A) Add confirmed timeslot directly
  const addConfirmedSlot = useCallback(async (emp, prevSlots) => {
    try {
      await DB.add("interviewer_availability", {
        employee_id: emp.employee_id,
        slot_date: prevSlots.date,
        start_time: prevSlots.time.start,
        end_time: prevSlots.time.end,
        status: "confirmed",
        added_by: currentUser.id,
        added_by_self: false
      });
      await refreshSnapshot();
      addMessage({ role: "assistant", kind: "text", content: `✅ Confirmed timeslot added for ${emp.name} on ${prevSlots.date} ${prevSlots.time.start}–${prevSlots.time.end}. You can now schedule the interview!` });
      toast?.success(`Confirmed timeslot added for ${emp.name}`);
    } catch (err) {
      console.error("addConfirmedSlot error:", err);
      toast?.error("Failed to add confirmed timeslot. Please try again.");
      addMessage({ role: "assistant", kind: "text", content: `❌ Failed to add confirmed timeslot: ${err?.message || "Unknown error"}` });
    }
  }, [currentUser, refreshSnapshot, addMessage, toast]);

  // B) Add pending timeslot request
  const raiseSlotRequest = useCallback(async (emp, prevSlots) => {
    try {
      await DB.add("time_slot_request", {
        employee_id: emp.employee_id,
        requested_by: currentUser.id,
        slot_date: prevSlots.date,
        start_time: prevSlots.time.start,
        end_time: prevSlots.time.end,
        repeat_pattern: "none",
        status: "pending",
        created_at: new Date().toISOString()
      });
      await refreshSnapshot();
      addMessage({ role: "assistant", kind: "text", content: `⏳ Pending timeslot request sent to ${emp.name} for ${prevSlots.date} ${prevSlots.time.start}–${prevSlots.time.end}. Once they confirm, come back to schedule.` });
      toast?.success(`Pending timeslot request sent to ${emp.name}`);
    } catch (err) {
      console.error("raiseSlotRequest error:", err);
      toast?.error("Failed to raise slot request. Please try again.");
      addMessage({ role: "assistant", kind: "text", content: `❌ Failed to raise slot request: ${err?.message || "Unknown error"}` });
    }
  }, [currentUser, refreshSnapshot, addMessage, toast]);

  const acceptWrongRound = useCallback(async (app, slots) => {
    addMessage({ role: "user", kind: "text", content: "Yes, schedule it anyway" });
    setThinking(true);
    await new Promise(r => setTimeout(r, 300));
    setThinking(false);
    const cand = snapshot.candidates.find(c => c.rh_id === app.rh_id);
    const job = snapshot.jobs.find(j => j.job_id === app.job_id);
    const cRes = { status: "resolved", application: app, candidate: cand, job };
    const iRes = resolveInterviewer(slots, cRes, snapshot);
    handleInterviewerResult(iRes, slots, cRes);
  }, [snapshot, addMessage, handleInterviewerResult]);

  const declineWrongRound = useCallback(() => {
    addMessage({ role: "user", kind: "text", content: "No, cancel" });
    addMessage({ role: "assistant", kind: "text", content: "Cancelled. Update your message with the right round and try again." });
  }, [addMessage]);

  const confirmSchedule = useCallback(async (msg) => {
    const key = getCombinationKey(msg);
    if (scheduledCombinations.has(key)) {
      toast?.error("This combination has already been scheduled! Use a different date, time, or interviewer.");
      addMessage({ role: "assistant", kind: "text", content: "⚠️ This exact interview is already scheduled. Please change the date, time, or interviewer." });
      return;
    }

    try {
      const round = snapshot.interview_round.find(r => r.job_id === msg.candidate.job.job_id && r.round_name === msg.slots.round_name);
      const topic = msg.slots.topic || round?.default_topic || "Interview";
      const mode = msg.slots.mode || "Video";
      const interview = {
        rh_id: msg.candidate.candidate.rh_id,
        job_id: msg.candidate.job.job_id,
        round_name: msg.slots.round_name,
        interviewer_id: msg.interviewer.employee_id,
        topic, mode,
        slot_date: msg.slots.date,
        start_time: msg.slots.time.start,
        end_time: msg.slots.time.end,
        status: "scheduled",
        candidate_invited: true,
        scheduled_by: currentUser.id,
        created_at: new Date().toISOString()
      };
      const id = await DB.add("interviews", interview);
      if (!id && id !== 0) throw new Error("Insert returned no ID — check Supabase RLS policies");

      await DB.add("interview_history", {
        interview_id: id,
        action: "scheduled",
        at: new Date().toISOString(),
        by_user: currentUser.id
      });

      scheduledCombinations.add(key);
      await refreshSnapshot();
      setPending(null);

      const next = getNextSuggestion();
      const nextTime = TIMES[Math.floor(Math.random() * TIMES.length)];
      const nextDate = getExampleDate(3 + Math.floor(Math.random() * 4));

      addMessage({
        role: "assistant", kind: "success", interview_id: id,
        content: `${msg.candidate.candidate.name} with ${msg.interviewer.name} on ${msg.slots.date}, ${msg.slots.time.start}–${msg.slots.time.end}.\n\nNext to schedule? Try:\n"Schedule ${next.round} for ${next.candidate}, ${next.job}, ${nextDate} ${nextTime}, ${next.mode}, with ${next.interviewer}, topic ${next.topic}"`
      });
      toast?.success("Interview scheduled successfully! ✅");
    } catch (err) {
      console.error("confirmSchedule error:", err);
      toast?.error(`Failed to schedule: ${err?.message || "Unknown error"}`);
      addMessage({ role: "assistant", kind: "text", content: `❌ Failed to save: ${err?.message || "Unknown error"}. Please try again.` });
    }
  }, [snapshot, currentUser, refreshSnapshot, addMessage, toast]);

  const cancelConfirm = useCallback(() => {
    setPending(null);
    addMessage({ role: "assistant", kind: "text", content: "Cancelled. What should I schedule instead?" });
  }, [addMessage]);

  return {
    messages, input, setInput, thinking, pending,
    send, reset,
    selectCandidate, selectInterviewer, selectAlternative,
    chooseNearbySlot, raiseSlotRequest, addConfirmedSlot,
    acceptWrongRound, declineWrongRound,
    confirmSchedule, cancelConfirm
  };
}
