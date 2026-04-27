// ============================================================
// db.js - IndexedDB persistence layer
// ============================================================
// All data persists across browser refreshes.
// First load seeds the DB. Subsequent loads read from disk.

const DB_NAME = "recruitercopilot_v4";
const DB_VERSION = 4;

const STORES = [
  "employees", "assessment_ability_rounds", "assessment_ability_skills", "assessment_ability_grades",
  "jobs", "job_required_skill", "interview_round",
  "candidates", "applications",
  "interviewer_availability", "time_slot_request",
  "interviews", "interview_history",
  "chatbot_conversations", "chatbot_messages",
  "meta"
];

let _db = null;

export async function openDB() {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          // Use auto-increment for log-style stores; explicit keyPath for entity stores
          if (["employees"].includes(name)) {
            db.createObjectStore(name, { keyPath: "employee_id" });
          } else if (["candidates"].includes(name)) {
            db.createObjectStore(name, { keyPath: "rh_id" });
          } else if (["jobs"].includes(name)) {
            db.createObjectStore(name, { keyPath: "job_id" });
          } else if (["meta"].includes(name)) {
            db.createObjectStore(name, { keyPath: "key" });
          } else {
            db.createObjectStore(name, { keyPath: "id", autoIncrement: true });
          }
        }
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
  });
}

export async function getAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function put(store, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function add(store, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).add(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function del(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clear(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Read entire DB into a plain JS snapshot
export async function snapshot() {
  const out = {};
  for (const s of STORES) out[s] = await getAll(s);
  return out;
}

// ============================================================
// SEED DATA
// ============================================================

const SEED = {
  employees: [
    { employee_id: "EMP1001", name: "Rajesh Kumar", email: "rajesh.kumar@yopmail.com", phone: "+91 98000 10001", department: "Engineering", level: "L4", grade: "Grade 6", employee_type: "FTE", location: "Bangalore", joining_date: "2019-03-15", hired_job_title: "Senior Java Developer", is_certified_panelist: true, is_active: true },
    { employee_id: "EMP1002", name: "Meera Nambiar", email: "meera.nambiar@yopmail.com", phone: "+91 98000 10002", department: "Human Resources", level: "L5", grade: "Grade 5", employee_type: "FTE", location: "Mumbai", joining_date: "2017-08-20", hired_job_title: "HR Business Partner", is_certified_panelist: true, is_active: true },
    { employee_id: "EMP1003", name: "Aarav Mehta", email: "aarav.mehta@yopmail.com", phone: "+91 98000 10003", department: "Engineering", level: "L5", grade: "Grade 6", employee_type: "FTE", location: "Bangalore", joining_date: "2016-01-10", hired_job_title: "Principal Engineer", is_certified_panelist: true, is_active: true },
    { employee_id: "EMP1004", name: "Priya Iyer", email: "priya.iyer@yopmail.com", phone: "+91 98000 10004", department: "Engineering", level: "L4", grade: "Grade 5", employee_type: "FTE", location: "Chennai", joining_date: "2020-06-01", hired_job_title: "Frontend Engineer", is_certified_panelist: true, is_active: true },
    { employee_id: "EMP1005", name: "Rahul Verma", email: "rahul.verma@yopmail.com", phone: "+91 98000 10005", department: "Engineering", level: "L3", grade: "Grade 4", employee_type: "FTE", location: "Pune", joining_date: "2021-11-12", hired_job_title: "Application Developer", is_certified_panelist: true, is_active: true },
    { employee_id: "EMP1006", name: "Neha Kapoor", email: "neha.kapoor@yopmail.com", phone: "+91 98000 10006", department: "Quality Assurance", level: "L4", grade: "Grade 5", employee_type: "FTE", location: "Hyderabad", joining_date: "2019-09-22", hired_job_title: "QA Lead", is_certified_panelist: true, is_active: true },
    { employee_id: "EMP1007", name: "Vikram Singh", email: "vikram.singh@yopmail.com", phone: "+91 98000 10007", department: "Engineering", level: "L4", grade: "Grade 5", employee_type: "FTE", location: "Bangalore", joining_date: "2018-04-03", hired_job_title: "Backend Engineer", is_certified_panelist: true, is_active: true },
    { employee_id: "EMP1008", name: "Sneha Reddy", email: "sneha.reddy@yopmail.com", phone: "+91 98000 10008", department: "Engineering", level: "L3", grade: "Grade 4", employee_type: "FTE", location: "Hyderabad", joining_date: "2022-02-14", hired_job_title: "Frontend Engineer", is_certified_panelist: false, is_active: true },
    { employee_id: "EMP1009", name: "Arjun Nair", email: "arjun.nair@yopmail.com", phone: "+91 98000 10009", department: "Human Resources", level: "L4", grade: "Grade 5", employee_type: "FTE", location: "Mumbai", joining_date: "2018-12-05", hired_job_title: "Talent Acquisition Lead", is_certified_panelist: true, is_active: true },
    { employee_id: "EMP1010", name: "Kavya Pillai", email: "kavya.pillai@yopmail.com", phone: "+91 98000 10010", department: "Engineering", level: "L5", grade: "Grade 6", employee_type: "FTE", location: "Bangalore", joining_date: "2015-07-19", hired_job_title: "Engineering Manager", is_certified_panelist: true, is_active: true },
    { employee_id: "REC0001", name: "Sanjay Krishnan", email: "recruiter@sandbox.com", phone: "+91 98000 99999", department: "Talent Acquisition", level: "L5", grade: "Grade 6", employee_type: "FTE", location: "Bangalore", joining_date: "2014-01-01", hired_job_title: "Recruiter Lead", is_certified_panelist: false, is_active: true }
  ],

  assessment_ability_rounds: [
    { employee_id: "EMP1001", round_name: "Interview 1" },
    { employee_id: "EMP1001", round_name: "Interview 2" },
    { employee_id: "EMP1001", round_name: "HR Stage" },
    { employee_id: "EMP1002", round_name: "HR Stage" },
    { employee_id: "EMP1003", round_name: "Interview 1" },
    { employee_id: "EMP1003", round_name: "Interview 2" },
    { employee_id: "EMP1003", round_name: "Client" },
    { employee_id: "EMP1004", round_name: "Interview 1" },
    { employee_id: "EMP1005", round_name: "Interview 1" },
    { employee_id: "EMP1006", round_name: "Interview 1" },
    { employee_id: "EMP1006", round_name: "Interview 2" },
    { employee_id: "EMP1007", round_name: "Interview 1" },
    { employee_id: "EMP1007", round_name: "Interview 2" },
    { employee_id: "EMP1009", round_name: "HR Stage" },
    { employee_id: "EMP1010", round_name: "Interview 2" },
    { employee_id: "EMP1010", round_name: "Client" }
  ],

  assessment_ability_skills: [
    { employee_id: "EMP1001", skill_name: "Java" }, { employee_id: "EMP1001", skill_name: "Java J2EE" }, { employee_id: "EMP1001", skill_name: "Python" }, { employee_id: "EMP1001", skill_name: "Behavioral" }, { employee_id: "EMP1001", skill_name: "Culture Fit" },
    { employee_id: "EMP1002", skill_name: "Behavioral" }, { employee_id: "EMP1002", skill_name: "Culture Fit" },
    { employee_id: "EMP1003", skill_name: "Java" }, { employee_id: "EMP1003", skill_name: "Java J2EE" }, { employee_id: "EMP1003", skill_name: "System Design" }, { employee_id: "EMP1003", skill_name: "Python" },
    { employee_id: "EMP1004", skill_name: "HTML" }, { employee_id: "EMP1004", skill_name: "CSS" }, { employee_id: "EMP1004", skill_name: "JavaScript" }, { employee_id: "EMP1004", skill_name: "React" },
    { employee_id: "EMP1005", skill_name: "PHP" },
    { employee_id: "EMP1006", skill_name: "Selenium" }, { employee_id: "EMP1006", skill_name: "Java" }, { employee_id: "EMP1006", skill_name: "Test Automation" },
    { employee_id: "EMP1007", skill_name: "Java" }, { employee_id: "EMP1007", skill_name: "Spring" }, { employee_id: "EMP1007", skill_name: "MySQL" },
    { employee_id: "EMP1009", skill_name: "Behavioral" }, { employee_id: "EMP1009", skill_name: "Culture Fit" },
    { employee_id: "EMP1010", skill_name: "Java" }, { employee_id: "EMP1010", skill_name: "System Design" }, { employee_id: "EMP1010", skill_name: "Leadership" }
  ],

  assessment_ability_grades: [
    { employee_id: "EMP1001", grade_name: "Grade 4" }, { employee_id: "EMP1001", grade_name: "Grade 5" }, { employee_id: "EMP1001", grade_name: "Grade 6" },
    { employee_id: "EMP1002", grade_name: "Grade 4" }, { employee_id: "EMP1002", grade_name: "Grade 5" },
    { employee_id: "EMP1003", grade_name: "Grade 5" }, { employee_id: "EMP1003", grade_name: "Grade 6" },
    { employee_id: "EMP1004", grade_name: "Grade 4" }, { employee_id: "EMP1004", grade_name: "Grade 5" },
    { employee_id: "EMP1005", grade_name: "Grade 3" }, { employee_id: "EMP1005", grade_name: "Grade 4" },
    { employee_id: "EMP1006", grade_name: "Grade 4" }, { employee_id: "EMP1006", grade_name: "Grade 5" },
    { employee_id: "EMP1007", grade_name: "Grade 4" }, { employee_id: "EMP1007", grade_name: "Grade 5" },
    { employee_id: "EMP1009", grade_name: "Grade 4" }, { employee_id: "EMP1009", grade_name: "Grade 5" },
    { employee_id: "EMP1010", grade_name: "Grade 5" }, { employee_id: "EMP1010", grade_name: "Grade 6" }
  ],

  jobs: [
    { job_id: 1, title: "Application Developer II", job_seq: "JS001", requisition_code: "550050", department: "Engineering", location: "Bangalore", required_grade: "Grade 5", job_description: "We are seeking an Application Developer II to design, develop, and maintain enterprise Java applications. The ideal candidate has 4+ years of experience with Java/J2EE, exposure to microservices, and a deep understanding of relational databases. You will collaborate with product managers, QA, and DevOps to ship high-quality features on a fortnightly cadence.", is_open: true, hiring_manager_id: "EMP1010", opened_on: "2026-04-01" },
    { job_id: 2, title: "Senior Java Developer", job_seq: "JS002", requisition_code: "550051", department: "Engineering", location: "Bangalore", required_grade: "Grade 6", job_description: "Lead the design and development of Java-based microservices powering our core platform. You will mentor mid-level engineers, drive technical roadmaps, and own production reliability of services serving 10M+ daily requests.", is_open: true, hiring_manager_id: "EMP1010", opened_on: "2026-03-20" },
    { job_id: 3, title: "Frontend Engineer", job_seq: "JS003", requisition_code: "550052", department: "Engineering", location: "Chennai", required_grade: "Grade 5", job_description: "Build modern, performant React-based UIs that delight our users. Strong CSS, accessibility awareness, and experience with state management at scale required.", is_open: true, hiring_manager_id: "EMP1010", opened_on: "2026-04-05" },
    { job_id: 4, title: "QA Engineer", job_seq: "JS004", requisition_code: "550053", department: "Quality Assurance", location: "Hyderabad", required_grade: "Grade 4", job_description: "Own end-to-end test automation using Selenium and Java. Collaborate with engineering to embed quality early in the SDLC.", is_open: true, hiring_manager_id: "EMP1006", opened_on: "2026-04-10" },
    { job_id: 5, title: "HR Business Partner", job_seq: "JS005", requisition_code: "550054", department: "Human Resources", location: "Mumbai", required_grade: "Grade 5", job_description: "Strategic HR partnership for the Engineering org. Drive engagement, performance management, and organizational design.", is_open: true, hiring_manager_id: "EMP1009", opened_on: "2026-03-15" }
  ],

  job_required_skill: [
    { job_id: 1, skill_name: "Java", is_mandatory: true }, { job_id: 1, skill_name: "Java J2EE", is_mandatory: true }, { job_id: 1, skill_name: "Python", is_mandatory: false }, { job_id: 1, skill_name: "MySQL", is_mandatory: false },
    { job_id: 2, skill_name: "Java", is_mandatory: true }, { job_id: 2, skill_name: "System Design", is_mandatory: true }, { job_id: 2, skill_name: "Spring", is_mandatory: false }, { job_id: 2, skill_name: "Leadership", is_mandatory: false },
    { job_id: 3, skill_name: "HTML", is_mandatory: true }, { job_id: 3, skill_name: "CSS", is_mandatory: true }, { job_id: 3, skill_name: "JavaScript", is_mandatory: true }, { job_id: 3, skill_name: "React", is_mandatory: false },
    { job_id: 4, skill_name: "Selenium", is_mandatory: true }, { job_id: 4, skill_name: "Java", is_mandatory: true }, { job_id: 4, skill_name: "Test Automation", is_mandatory: false },
    { job_id: 5, skill_name: "Behavioral", is_mandatory: true }, { job_id: 5, skill_name: "Culture Fit", is_mandatory: true }
  ],

  interview_round: [
    { job_id: 1, round_name: "Interview 1", sequence_no: 1, default_topic: "Java Coding" },
    { job_id: 1, round_name: "Interview 2", sequence_no: 2, default_topic: "System Design" },
    { job_id: 1, round_name: "Client", sequence_no: 3, default_topic: "Client Round" },
    { job_id: 1, round_name: "HR Stage", sequence_no: 4, default_topic: "HR Discussion" },
    { job_id: 2, round_name: "Interview 1", sequence_no: 1, default_topic: "Java Coding" },
    { job_id: 2, round_name: "Interview 2", sequence_no: 2, default_topic: "System Design" },
    { job_id: 3, round_name: "Interview 1", sequence_no: 1, default_topic: "Frontend Coding" },
    { job_id: 4, round_name: "Interview 1", sequence_no: 1, default_topic: "Test Automation" },
    { job_id: 5, round_name: "HR Stage", sequence_no: 1, default_topic: "Behavioral" }
  ],

  candidates: [
    { rh_id: "RH00081234", name: "Anjali Sharma", email: "anjali.sharma1@yopmail.com", phone: "+1 555 0101" },
    { rh_id: "RH00081235", name: "Anjali Sharma", email: "anjali.s@yopmail.com", phone: "+1 555 0102" },
    { rh_id: "RH00081236", name: "Anjali Sharma", email: "anjalish3@yopmail.com", phone: "+1 555 0103" },
    { rh_id: "RH00081240", name: "Rohan Gupta", email: "rohan.g1@yopmail.com", phone: "+91 99000 10001" },
    { rh_id: "RH00081241", name: "Rohan Gupta", email: "rohan.g2@yopmail.com", phone: "+91 99000 10002" },
    { rh_id: "RH00081245", name: "Manish Pandey", email: "manish.p@yopmail.com", phone: "+91 99000 10003" },
    { rh_id: "RH00081246", name: "Aditi Desai", email: "aditi.d@yopmail.com", phone: "+91 99000 10004" },
    { rh_id: "RH00081247", name: "Karthik Raman", email: "karthik.r@yopmail.com", phone: "+91 99000 10005" },
    { rh_id: "RH00081248", name: "Meera Joshi", email: "meera.j@yopmail.com", phone: "+91 99000 10006" },
    { rh_id: "RH00081249", name: "Anil Kumar", email: "anil.k@yopmail.com", phone: "+91 99000 10007" },
    { rh_id: "RH00081250", name: "Pooja Bhat", email: "pooja.b@yopmail.com", phone: "+91 99000 10008" },
    { rh_id: "RH00081251", name: "Sandeep Roy", email: "sandeep.r@yopmail.com", phone: "+91 99000 10009" },
    { rh_id: "RH00081252", name: "Divya Menon", email: "divya.m@yopmail.com", phone: "+91 99000 10010" },
    { rh_id: "RH00081253", name: "Rahul Mishra", email: "rahul.m@yopmail.com", phone: "+91 99000 10011" },
    { rh_id: "RH00081254", name: "Tanvi Desai", email: "tanvi.d@yopmail.com", phone: "+91 99000 10012" },
    { rh_id: "RH00081255", name: "Vivek Saxena", email: "vivek.s@yopmail.com", phone: "+91 99000 10013" },
    { rh_id: "RH00081256", name: "Anjali Bose", email: "anjali.b@yopmail.com", phone: "+91 99000 10014" },
    { rh_id: "RH00081257", name: "Harsh Vora", email: "harsh.v@yopmail.com", phone: "+91 99000 10015" },
    { rh_id: "RH00081258", name: "Lavanya Rao", email: "lavanya.r@yopmail.com", phone: "+91 99000 10016" },
    { rh_id: "RH00081259", name: "Ankit Jain", email: "ankit.j@yopmail.com", phone: "+91 99000 10017" }
  ],

  applications: [
    { rh_id: "RH00081234", job_id: 1, current_round: "Interview 1", match_score: 87, status: "active", applied_at: "2026-04-10" },
    { rh_id: "RH00081235", job_id: 1, current_round: "Interview 1", match_score: 76, status: "active", applied_at: "2026-04-12" },
    { rh_id: "RH00081236", job_id: 3, current_round: "Shortlisted", match_score: 82, status: "active", applied_at: "2026-04-14" },
    { rh_id: "RH00081240", job_id: 1, current_round: "Interview 2", match_score: 91, status: "active", applied_at: "2026-04-08" },
    { rh_id: "RH00081241", job_id: 2, current_round: "Interview 1", match_score: 88, status: "active", applied_at: "2026-04-09" },
    { rh_id: "RH00081245", job_id: 1, current_round: "Interview 1", match_score: 79, status: "active", applied_at: "2026-04-15" },
    { rh_id: "RH00081246", job_id: 3, current_round: "Interview 1", match_score: 84, status: "active", applied_at: "2026-04-11" },
    { rh_id: "RH00081247", job_id: 4, current_round: "Interview 1", match_score: 71, status: "active", applied_at: "2026-04-13" },
    { rh_id: "RH00081248", job_id: 5, current_round: "HR Stage", match_score: 12, status: "active", applied_at: "2026-04-16" },
    { rh_id: "RH00081249", job_id: 1, current_round: "Interview 2", match_score: 80, status: "active", applied_at: "2026-04-07" },
    { rh_id: "RH00081250", job_id: 2, current_round: "Interview 1", match_score: 73, status: "active", applied_at: "2026-04-14" },
    { rh_id: "RH00081251", job_id: 3, current_round: "Interview 1", match_score: 90, status: "active", applied_at: "2026-04-12" },
    { rh_id: "RH00081252", job_id: 4, current_round: "Interview 2", match_score: 77, status: "active", applied_at: "2026-04-08" },
    { rh_id: "RH00081253", job_id: 1, current_round: "Interview 1", match_score: 8, status: "active", applied_at: "2026-04-15" },
    { rh_id: "RH00081254", job_id: 3, current_round: "Interview 1", match_score: 86, status: "active", applied_at: "2026-04-13" }
  ],

  interviewer_availability: [
    { employee_id: "EMP1001", slot_date: "2026-04-29", start_time: "14:00", end_time: "15:00", status: "confirmed", added_by: "EMP1003", added_by_self: false },
    { employee_id: "EMP1001", slot_date: "2026-04-29", start_time: "15:00", end_time: "16:00", status: "confirmed", added_by: "EMP1001", added_by_self: true },
    { employee_id: "EMP1001", slot_date: "2026-04-29", start_time: "16:00", end_time: "17:00", status: "confirmed", added_by: "EMP1001", added_by_self: true },
    { employee_id: "EMP1001", slot_date: "2026-04-30", start_time: "11:00", end_time: "12:00", status: "confirmed", added_by: "REC0001", added_by_self: false },
    { employee_id: "EMP1003", slot_date: "2026-04-29", start_time: "11:00", end_time: "12:00", status: "confirmed", added_by: "REC0001", added_by_self: false },
    { employee_id: "EMP1003", slot_date: "2026-04-30", start_time: "11:00", end_time: "12:00", status: "confirmed", added_by: "REC0001", added_by_self: false },
    { employee_id: "EMP1003", slot_date: "2026-04-29", start_time: "14:00", end_time: "15:00", status: "confirmed", added_by: "EMP1003", added_by_self: true },
    { employee_id: "EMP1004", slot_date: "2026-04-29", start_time: "10:00", end_time: "11:00", status: "confirmed", added_by: "EMP1004", added_by_self: true },
    { employee_id: "EMP1004", slot_date: "2026-04-29", start_time: "16:00", end_time: "17:00", status: "confirmed", added_by: "REC0001", added_by_self: false },
    { employee_id: "EMP1005", slot_date: "2026-04-30", start_time: "10:00", end_time: "11:00", status: "confirmed", added_by: "EMP1005", added_by_self: true },
    { employee_id: "EMP1006", slot_date: "2026-04-29", start_time: "13:00", end_time: "14:00", status: "confirmed", added_by: "REC0001", added_by_self: false },
    { employee_id: "EMP1010", slot_date: "2026-04-29", start_time: "16:00", end_time: "17:00", status: "confirmed", added_by: "EMP1010", added_by_self: true },
    { employee_id: "EMP1009", slot_date: "2026-04-29", start_time: "10:00", end_time: "11:00", status: "confirmed", added_by: "EMP1009", added_by_self: true },
    { employee_id: "EMP1002", slot_date: "2026-04-29", start_time: "15:00", end_time: "16:00", status: "confirmed", added_by: "EMP1002", added_by_self: true }
  ],

  time_slot_request: [
    { employee_id: "EMP1007", requested_by: "REC0001", slot_date: "2026-04-29", start_time: "11:00", end_time: "12:00", repeat_pattern: "none", status: "pending", created_at: "2026-04-25" },
    { employee_id: "EMP1005", requested_by: "REC0001", slot_date: "2026-05-01", start_time: "14:00", end_time: "15:00", repeat_pattern: "none", status: "pending", created_at: "2026-04-26" }
  ],

  interviews: [],
  interview_history: [],
  chatbot_conversations: [],
  chatbot_messages: [],
  meta: [{ key: "seeded", value: true, seeded_at: new Date().toISOString() }]
};

export async function ensureSeeded(force = false) {
  await openDB();
  const m = await getAll("meta");
  const seeded = m.find(x => x.key === "seeded");
  if (seeded && !force) return false;

  // Clear and reseed
  for (const s of STORES) await clear(s);

  for (const row of SEED.employees) await put("employees", row);
  for (const row of SEED.candidates) await put("candidates", row);
  for (const row of SEED.jobs) await put("jobs", row);

  for (const row of SEED.assessment_ability_rounds) await add("assessment_ability_rounds", row);
  for (const row of SEED.assessment_ability_skills) await add("assessment_ability_skills", row);
  for (const row of SEED.assessment_ability_grades) await add("assessment_ability_grades", row);
  for (const row of SEED.job_required_skill) await add("job_required_skill", row);
  for (const row of SEED.interview_round) await add("interview_round", row);
  for (const row of SEED.applications) await add("applications", row);
  for (const row of SEED.interviewer_availability) await add("interviewer_availability", row);
  for (const row of SEED.time_slot_request) await add("time_slot_request", row);

  await put("meta", { key: "seeded", value: true, seeded_at: new Date().toISOString() });
  return true;
}

export async function resetDB() {
  await openDB();
  for (const s of STORES) await clear(s);
  await ensureSeeded(true);
}
