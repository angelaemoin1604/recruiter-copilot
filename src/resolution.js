// ============================================================
// resolution.js - Candidate / Interviewer / Availability resolution
// ============================================================
// Pure functions over a snapshot of the DB (passed in as `db`).

import { extractSlots } from "./nlu.js";

export function resolveCandidates(slots, db) {
  if (!slots.candidate_name) return { status: "missing" };
  const matches = db.candidates.filter(c => c.name.toLowerCase() === slots.candidate_name.toLowerCase());
  if (matches.length === 0) return { status: "not_found" };

  let apps = db.applications.filter(a => matches.some(c => c.rh_id === a.rh_id));
  if (slots.job) apps = apps.filter(a => a.job_id === slots.job.matched.job_id);

  // Per the new requirement: candidate can be in any round and the interview can be scheduled.
  // If the user specified a round, try filtering — if it matches, great.
  // If it doesn't match, return "wrong_round" with the apps in their current rounds (soft warning),
  // and the orchestrator handles the [Yes/No] decision.
  let appsByRound = apps;
  if (slots.round_name) appsByRound = apps.filter(a => a.current_round === slots.round_name);

  if (appsByRound.length === 0) {
    if (apps.length > 0 && slots.round_name) {
      return { status: "wrong_round", apps_in_other_rounds: apps, requested_round: slots.round_name };
    }
    return { status: "not_found" };
  }

  if (appsByRound.length === 1) {
    const app = appsByRound[0];
    const cand = db.candidates.find(c => c.rh_id === app.rh_id);
    const job = db.jobs.find(j => j.job_id === app.job_id);
    return { status: "resolved", application: app, candidate: cand, job };
  }

  return {
    status: "multiple",
    options: appsByRound.map(app => ({
      application: app,
      candidate: db.candidates.find(c => c.rh_id === app.rh_id),
      job: db.jobs.find(j => j.job_id === app.job_id)
    }))
  };
}

export function getEmployeeRounds(empId, db) {
  return db.assessment_ability_rounds.filter(r => r.employee_id === empId).map(r => r.round_name);
}
export function getEmployeeSkills(empId, db) {
  return db.assessment_ability_skills.filter(r => r.employee_id === empId).map(r => r.skill_name);
}
export function getEmployeeGrades(empId, db) {
  return db.assessment_ability_grades.filter(r => r.employee_id === empId).map(r => r.grade_name);
}

export function isInterviewerQualified(emp, jobRequiredSkills, roundName, db) {
  if (!emp.is_certified_panelist || !emp.is_active) return false;
  const empRounds = getEmployeeRounds(emp.employee_id, db);
  if (!empRounds.includes(roundName)) return false;
  const empSkills = getEmployeeSkills(emp.employee_id, db).map(s => s.toLowerCase());
  const mandatorySkills = jobRequiredSkills.filter(s => s.is_mandatory).map(s => s.skill_name.toLowerCase());
  return mandatorySkills.some(s => empSkills.includes(s));
}

export function scoreInterviewer(emp, job, jobRequiredSkills, roundName, db) {
  let score = 0;
  const empSkills = getEmployeeSkills(emp.employee_id, db).map(s => s.toLowerCase());
  const jobSkills = jobRequiredSkills.map(s => s.skill_name.toLowerCase());
  const overlap = jobSkills.filter(s => empSkills.includes(s)).length;
  score += jobSkills.length > 0 ? (overlap / jobSkills.length) * 40 : 0;
  if (getEmployeeRounds(emp.employee_id, db).includes(roundName)) score += 20;
  if (getEmployeeGrades(emp.employee_id, db).includes(job.required_grade)) score += 20;
  if (emp.department === job.department) score += 10;
  const recent = db.interviews.filter(i => i.interviewer_id === emp.employee_id).length;
  score += Math.max(0, 10 - recent * 2);
  return Math.round(score);
}

export function findAvailability(empId, date, startTime, endTime, db) {
  if (!date || !startTime || !endTime) return { available: false, nearby: [] };
  const slots = db.interviewer_availability.filter(s =>
    s.employee_id === empId && s.slot_date === date && s.status === "confirmed"
  );
  const covering = slots.find(s => s.start_time <= startTime && s.end_time >= endTime);
  if (covering) return { available: true, slot: covering };
  const nearby = db.interviewer_availability.filter(s =>
    s.employee_id === empId && s.status === "confirmed"
  );
  return { available: false, nearby };
}

export function resolveInterviewer(slots, candidateRes, db) {
  if (candidateRes.status !== "resolved") return null;
  const job = candidateRes.job;
  const jobSkills = db.job_required_skill.filter(s => s.job_id === job.job_id);
  const roundName = slots.round_name;

  if (slots.interviewer_ref) {
    const ref = slots.interviewer_ref.toLowerCase();
    const named = db.employees.filter(e =>
      e.name.toLowerCase() === ref || e.email.toLowerCase() === ref
    );
    if (named.length === 0) return { status: "interviewer_not_found", ref: slots.interviewer_ref };
    if (named.length > 1) {
      const qualified = named.filter(e => isInterviewerQualified(e, jobSkills, roundName, db));
      if (qualified.length === 1) return checkChosenInterviewer(qualified[0], slots, job, jobSkills, roundName, db);
      if (qualified.length === 0) return { status: "named_not_qualified", candidates: named, round: roundName };
      return { status: "interviewer_multiple", options: qualified };
    }
    const emp = named[0];
    if (!isInterviewerQualified(emp, jobSkills, roundName, db)) {
      const allQualified = db.employees.filter(e => isInterviewerQualified(e, jobSkills, roundName, db));
      const top3 = allQualified
        .map(e => ({ emp: e, score: scoreInterviewer(e, job, jobSkills, roundName, db) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
      return { status: "not_qualified", named: emp, alternatives: top3, round: roundName };
    }
    return checkChosenInterviewer(emp, slots, job, jobSkills, roundName, db);
  }

  const qualified = db.employees.filter(e => isInterviewerQualified(e, jobSkills, roundName, db));
  if (qualified.length === 0) return { status: "no_qualified" };
  const scored = qualified
    .map(e => ({ emp: e, score: scoreInterviewer(e, job, jobSkills, roundName, db) }))
    .sort((a, b) => b.score - a.score);

  for (const { emp, score } of scored) {
    const avail = findAvailability(emp.employee_id, slots.date, slots.time.start, slots.time.end, db);
    if (avail.available) return { status: "auto_picked", interviewer: emp, score, slot: avail.slot };
  }

  return {
    status: "no_availability",
    top3: scored.slice(0, 3).map(({ emp, score }) => ({
      emp, score,
      nearby: findAvailability(emp.employee_id, slots.date, slots.time.start, slots.time.end, db).nearby
    }))
  };
}

export function checkChosenInterviewer(emp, slots, job, jobSkills, roundName, db) {
  const avail = findAvailability(emp.employee_id, slots.date, slots.time.start, slots.time.end, db);
  if (avail.available) return { status: "ready", interviewer: emp, slot: avail.slot };
  const allQualified = db.employees.filter(e =>
    e.employee_id !== emp.employee_id && isInterviewerQualified(e, jobSkills, roundName, db)
  );
  const top3Alt = allQualified
    .map(e => ({ emp: e, score: scoreInterviewer(e, job, jobSkills, roundName, db) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(x => findAvailability(x.emp.employee_id, slots.date, slots.time.start, slots.time.end, db).available);
  return { status: "no_slot", interviewer: emp, nearby: avail.nearby, alternatives: top3Alt };
}

// ============================================================
// Top-level orchestrator
// ============================================================

export function processMessage(text, db) {
  const slots = extractSlots(text, db);
  if (slots.intent !== "schedule_interview" && slots.intent !== "reschedule_interview") {
    return {
      kind: "text",
      content: "I help you schedule interviews. Try: \"Schedule Interview 1 for Manish Pandey, App Dev II, 2-3 PM, Telephonic, with Rajesh Kumar, topic Java Coding\""
    };
  }

  const missing = [];
  if (!slots.candidate_name) missing.push("candidate name");
  if (!slots.job) missing.push("job");
  if (!slots.round_name) missing.push("round");
  if (!slots.date) missing.push("date");
  if (!slots.time) missing.push("time range");

  if (missing.length > 0) {
    return {
      kind: "ask_missing",
      content: `I need a few more details before scheduling: **${missing.join(", ")}**.`,
      slots
    };
  }

  const cRes = resolveCandidates(slots, db);
  if (cRes.status === "not_found") {
    return { kind: "text", content: `I couldn't find any candidate "${slots.candidate_name}" applying to ${slots.job.matched.title}. Want me to search more broadly?`, slots };
  }
  if (cRes.status === "wrong_round") {
    return { kind: "wrong_round", slots, options: cRes.apps_in_other_rounds, requested_round: cRes.requested_round };
  }
  if (cRes.status === "multiple") {
    return { kind: "candidate_disambig", slots, options: cRes.options };
  }

  const iRes = resolveInterviewer(slots, cRes, db);
  if (!iRes) return { kind: "text", content: "Internal error resolving interviewer." };

  if (iRes.status === "interviewer_not_found") {
    return { kind: "text", content: `I couldn't find an interviewer matching "${iRes.ref}". Try the email or check the Employees tab.`, slots };
  }
  if (iRes.status === "interviewer_multiple") {
    return { kind: "interviewer_disambig", slots, candidate: cRes, options: iRes.options };
  }
  if (iRes.status === "not_qualified") {
    return { kind: "not_qualified", slots, candidate: cRes, named: iRes.named, alternatives: iRes.alternatives, round: iRes.round };
  }
  if (iRes.status === "named_not_qualified") {
    return { kind: "text", content: `None of the matching "${slots.interviewer_ref}" entries are certified to assess ${iRes.round}.`, slots };
  }
  if (iRes.status === "no_qualified") {
    return { kind: "text", content: `No certified interviewers found for ${slots.round_name} with the required skills.`, slots };
  }
  if (iRes.status === "no_slot") {
    return { kind: "no_slot", slots, candidate: cRes, interviewer: iRes.interviewer, nearby: iRes.nearby, alternatives: iRes.alternatives };
  }
  if (iRes.status === "no_availability") {
    return { kind: "no_availability", slots, candidate: cRes, top3: iRes.top3 };
  }

  return {
    kind: "confirm",
    slots,
    candidate: cRes,
    interviewer: iRes.interviewer,
    slot: iRes.slot,
    auto_picked: iRes.status === "auto_picked",
    score: iRes.score
  };
}

// "Schedule anyway" path: bypasses the wrong_round check
export function processMessageWithRoundOverride(text, db, applicationId) {
  const slots = extractSlots(text, db);
  const app = db.applications.find(a => a.id === applicationId || a.rh_id === applicationId);
  // Force the round on the matched application
  if (!app) return { kind: "text", content: "Couldn't find that application." };
  const cand = db.candidates.find(c => c.rh_id === app.rh_id);
  const job = db.jobs.find(j => j.job_id === app.job_id);
  const cRes = { status: "resolved", application: app, candidate: cand, job };

  const iRes = resolveInterviewer(slots, cRes, db);
  if (!iRes) return { kind: "text", content: "Internal error." };
  if (iRes.status === "interviewer_not_found") return { kind: "text", content: `I couldn't find an interviewer matching "${iRes.ref}".`, slots };
  if (iRes.status === "interviewer_multiple") return { kind: "interviewer_disambig", slots, candidate: cRes, options: iRes.options };
  if (iRes.status === "not_qualified") return { kind: "not_qualified", slots, candidate: cRes, named: iRes.named, alternatives: iRes.alternatives, round: iRes.round };
  if (iRes.status === "no_qualified") return { kind: "text", content: "No qualified interviewers for that round." };
  if (iRes.status === "no_slot") return { kind: "no_slot", slots, candidate: cRes, interviewer: iRes.interviewer, nearby: iRes.nearby, alternatives: iRes.alternatives };
  if (iRes.status === "no_availability") return { kind: "no_availability", slots, candidate: cRes, top3: iRes.top3 };

  return {
    kind: "confirm",
    slots,
    candidate: cRes,
    interviewer: iRes.interviewer,
    slot: iRes.slot,
    auto_picked: iRes.status === "auto_picked",
    round_overridden: true
  };
}
