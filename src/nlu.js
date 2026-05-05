// ============================================================
// nlu.js - Deterministic NLU parser for chat input
// ============================================================

const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9,
  nov: 10, november: 10, dec: 11, december: 11
};

export function parseDate(text) {
  const lower = text.toLowerCase();
  let m = lower.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*(\d{4})?/);
  if (m) {
    const day = parseInt(m[1]);
    const month = MONTHS[m[2]];
    const year = m[3] ? parseInt(m[3]) : 2026;
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  m = lower.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\s*(\d{4})?/);
  if (m) {
    const day = parseInt(m[2]);
    const month = MONTHS[m[1]];
    const year = m[3] ? parseInt(m[3]) : 2026;
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  // ISO format YYYY-MM-DD
  m = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}

export function parseTimeRange(text) {
  const lower = text.toLowerCase();
  let m = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–—to]+\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (m) {
    let h1 = parseInt(m[1]); const min1 = m[2] ? parseInt(m[2]) : 0;
    let h2 = parseInt(m[4]); const min2 = m[5] ? parseInt(m[5]) : 0;
    const mer1 = m[3] || m[6]; const mer2 = m[6];
    if (mer1 === "pm" && h1 < 12) h1 += 12;
    if (mer1 === "am" && h1 === 12) h1 = 0;
    if (mer2 === "pm" && h2 < 12) h2 += 12;
    if (mer2 === "am" && h2 === 12) h2 = 0;
    return {
      start: `${String(h1).padStart(2, "0")}:${String(min1).padStart(2, "0")}`,
      end: `${String(h2).padStart(2, "0")}:${String(min2).padStart(2, "0")}`
    };
  }
  m = lower.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (m) {
    let h1 = parseInt(m[1]); const min1 = m[2] ? parseInt(m[2]) : 0;
    if (m[3] === "pm" && h1 < 12) h1 += 12;
    if (m[3] === "am" && h1 === 12) h1 = 0;
    const h2 = h1 + 1;
    return {
      start: `${String(h1).padStart(2, "0")}:${String(min1).padStart(2, "0")}`,
      end: `${String(h2).padStart(2, "0")}:${String(min1).padStart(2, "0")}`
    };
  }
  return null;
}

export function parseRound(text) {
  const lower = text.toLowerCase();
  if (/\binterview\s*1\b|\bround\s*1\b|\bint\s*1\b/.test(lower)) return "Interview 1";
  if (/\binterview\s*2\b|\bround\s*2\b|\bint\s*2\b/.test(lower)) return "Interview 2";
  if (/\bclient\s*round\b|\bclient\b/.test(lower)) return "Client";
  if (/\bhr\s*stage\b|\bhr\s*round\b|\bhr\b/.test(lower)) return "HR Stage";
  if (/\bshortlist/.test(lower)) return "Shortlisted";
  return null;
}

export function parseMode(text) {
  const lower = text.toLowerCase();
  if (/telephonic|phone\s*call|over\s*phone/.test(lower)) return "Telephonic";
  if (/face[\s-]*to[\s-]*face|in[\s-]*person|onsite/.test(lower)) return "In-person";
  if (/video|zoom|teams|google\s*meet|virtual/.test(lower)) return "Video";
  return null;
}

export function parseTopic(text) {
  const m = text.match(/topic\s+(?:is\s+)?["']?([A-Za-z][A-Za-z0-9\s+&#./()-]{2,50}?)["']?(?=\s*(?:,|\.|with|on|for|at|$))/i);
  return m ? m[1].trim() : null;
}

export function parseCandidateName(text, allCandidates) {
  const uniqueNames = [...new Set(allCandidates.map(c => c.name))];
  for (const n of uniqueNames) {
    const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) return n;
  }
  // Try "for FirstName LastName" pattern
  const m = text.match(/\bfor\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
  if (m) return m[1];
  return null;
}

export function parseJob(text, allJobs) {
  const lower = text.toLowerCase();
  for (const j of allJobs) {
    if (lower.includes(j.title.toLowerCase())) return { matched: j, raw: j.title };
    if (j.requisition_code && lower.includes(j.requisition_code)) return { matched: j, raw: j.requisition_code };
  }
  if (/app\s*dev\s*ii|application\s*developer\s*ii|app\s*dev\s*2/.test(lower)) {
    const j = allJobs.find(x => x.title === "Application Developer II");
    if (j) return { matched: j, raw: "App Dev II" };
  }
  if (/senior\s*java/.test(lower)) {
    const j = allJobs.find(x => x.title === "Senior Java Developer");
    if (j) return { matched: j, raw: "Senior Java Developer" };
  }
  if (/frontend|front[\s-]end/.test(lower)) {
    const j = allJobs.find(x => x.title === "Frontend Engineer");
    if (j) return { matched: j, raw: "Frontend Engineer" };
  }
  if (/\bqa\b|quality/.test(lower)) {
    const j = allJobs.find(x => x.title === "QA Engineer");
    if (j) return { matched: j, raw: "QA Engineer" };
  }
  if (/\bhr\s*business|hrbp/.test(lower)) {
    const j = allJobs.find(x => x.title === "HR Business Partner");
    if (j) return { matched: j, raw: "HR Business Partner" };
  }
  return null;
}

export function parseInterviewer(text, allEmployees) {
  const m = text.match(/\bwith\s+([A-Za-z][A-Za-z\s.]{2,40}?)(?=\s*(?:,|\.|topic|on|at|for|$))/i);
  let candidate = null;
  if (m) candidate = m[1].trim();
  const uniqueNames = [...new Set(allEmployees.map(e => e.name))];
  for (const n of uniqueNames) {
    const re = new RegExp(`\\bwith\\s+${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) return n;
  }
  const em = text.match(/\bwith\s+([\w.-]+@[\w.-]+)/i);
  if (em) return em[1];
  return candidate;
}

export function parseIntent(text) {
  const lower = text.toLowerCase();
  if (/\b(reschedule|move|shift)\b/.test(lower) && /\binterview\b/.test(lower)) return "reschedule_interview";
  if (/\b(schedule|book|set\s*up|arrange)\b/.test(lower) && /\binterview\b/.test(lower)) return "schedule_interview";
  if (/\b(schedule|book)\b/.test(lower)) return "schedule_interview";
  return "unknown";
}

export function extractSlots(text, db) {
  const slots = {
    intent: parseIntent(text),
    candidate_name: parseCandidateName(text, db.candidates),
    job: parseJob(text, db.jobs),
    round_name: parseRound(text),
    interviewer_ref: parseInterviewer(text, db.employees),
    topic: parseTopic(text),
    mode: parseMode(text),
    date: parseDate(text),
    time: parseTimeRange(text),
    raw: text
  };

  // FIX #1: Validate all required fields
  const missing = [];
  if (!slots.candidate_name) missing.push("candidate name");
  if (!slots.job) missing.push("job title");
  if (!slots.round_name) missing.push("interview round (e.g., Interview 1, Interview 2)");
  if (!slots.interviewer_ref) missing.push("interviewer name");
  if (!slots.topic) missing.push("interview topic");
  if (!slots.mode) missing.push("interview mode (Video/Telephonic/In-person)");
  if (!slots.date) missing.push("interview date");
  if (!slots.time) missing.push("interview time");
  
  if (missing.length > 0) {
    slots.validation_errors = missing;
  }
  
  return slots;
}
