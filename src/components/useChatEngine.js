// ============================================================
// useChatEngine.js - Shared chat state + scheduling logic
// Used by both the floating mini-modal and the right-side dock.
// ============================================================
import { useState, useCallback } from "react";
import { processMessage, resolveInterviewer, checkChosenInterviewer, getEmployeeRounds } from "../resolution.js";
import * as DB from "../db.js";

// Generate dynamic example date: 3-4 days from today
function getExampleDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  const day = date.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[date.getMonth()]}`;
}

const getHelloMsg = () => ({
  id: 1,
  role: "assistant",
  kind: "text",
  content: `Hi! I'm Recruiter Copilot.\n\nTell me what to schedule. Try:\n"Schedule Interview 1 for Manish Pandey, App Dev II, ${getExampleDate()} 2-3 PM, Telephonic, with Rajesh Kumar, topic Java Coding"`
});

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
    if (iRes.status === "no_slot") { addMessage({ role: "assistant", kind: "no_slot", slots, candidate: cRes, interviewer: iRes.interviewer, nearby: iRes.nearby, alternatives: iRes.alternatives }); return; }
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
      addMessage({ role: "assistant", kind: "no_slot", slots: prevSlots, candidate, interviewer: checked.interviewer, nearby: checked.nearby, alternatives: checked.alternatives });
    }
  }, [snapshot, addMessage]);

  const selectAlternative = selectInterviewer;

  const chooseNearbySlot = useCallback((slot, emp, prevSlots, candidate) => {
    const newSlots = { ...prevSlots, date: slot.slot_date, time: { start: slot.start_time, end: slot.end_time } };
    const confirmMsg = { role: "assistant", kind: "confirm", slots: newSlots, candidate, interviewer: emp, slot };
    addMessage(confirmMsg);
    setPending(confirmMsg);
  }, [addMessage]);

  const raiseSlotRequest = useCallback(async (emp, prevSlots) => {
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
    addMessage({ role: "assistant", kind: "text", content: `Panel timeslot request raised for ${emp.name} (${emp.employee_id}) on ${prevSlots.date} ${prevSlots.time.start}–${prevSlots.time.end}. I'll schedule once they confirm.` });
    toast?.success("Timeslot request sent");
  }, [currentUser, refreshSnapshot, addMessage, toast]);

  // "Heads up — Sarah Johnson is in Shortlisted, not Interview 1." flow
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
    const round = snapshot.interview_round.find(r => r.job_id === msg.candidate.job.job_id && r.round_name === msg.slots.round_name);
    const topic = msg.slots.topic || round?.default_topic || "Interview";
    const mode = msg.slots.mode || "Video";
    const interview = {
      application_id: msg.candidate.application.id || msg.candidate.application.application_id,
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
    await DB.add("interview_history", { interview_id: id, action: "scheduled", at: new Date().toISOString(), by: currentUser.id });
    await refreshSnapshot();
    setPending(null);
    addMessage({
      role: "assistant", kind: "success", interview_id: id,
      content: `Interview scheduled. ${msg.candidate.candidate.name} with ${msg.interviewer.name} on ${msg.slots.date}, ${msg.slots.time.start}–${msg.slots.time.end}.`
    });
    toast?.success("Interview scheduled");
  }, [snapshot, currentUser, refreshSnapshot, addMessage, toast]);

  const cancelConfirm = useCallback(() => {
    setPending(null);
    addMessage({ role: "assistant", kind: "text", content: "Cancelled. What should I schedule instead?" });
  }, [addMessage]);

  return {
    messages, input, setInput, thinking, pending,
    send, reset,
    selectCandidate, selectInterviewer, selectAlternative,
    chooseNearbySlot, raiseSlotRequest,
    acceptWrongRound, declineWrongRound,
    confirmSchedule, cancelConfirm
  };
}
