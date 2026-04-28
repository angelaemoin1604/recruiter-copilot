import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// EXACT column definitions for every table.
// This is the SINGLE source of truth — any field NOT listed here
// gets stripped before it reaches Supabase, preventing "column not found" errors.
// ============================================================
const TABLE_COLUMNS = {
  employees: ['employee_id','name','email','phone','department','location','grade','level','hired_job_title','is_certified_panelist','is_active'],
  candidates: ['rh_id','name','email','phone','location','current_title'],
  jobs: ['job_id','title','department','location','required_grade','job_seq','requisition_code','is_open','opened_on','hiring_manager_id','job_description'],
  applications: ['id','rh_id','job_id','current_round','match_score','status','applied_at'],
  interviews: ['id','rh_id','job_id','round_name','interviewer_id','topic','mode','slot_date','start_time','end_time','status','candidate_invited','scheduled_by','created_at'],
  interview_history: ['id','interview_id','action','at','by_user','metadata'],
  assessment_ability_skills: ['id','employee_id','skill_name'],
  assessment_ability_rounds: ['id','employee_id','round_name'],
  assessment_ability_grades: ['id','employee_id','grade_name'],
  job_required_skill: ['id','job_id','skill_name','is_mandatory'],
  interview_round: ['id','job_id','round_name','sequence_no','default_topic'],
  interviewer_availability: ['id','employee_id','slot_date','start_time','end_time','status','added_by','added_by_self'],
  time_slot_request: ['id','employee_id','requested_by','slot_date','start_time','end_time','repeat_pattern','status','created_at'],
};

// Strip any fields that don't belong to this table
function sanitize(tableName, record) {
  const allowed = TABLE_COLUMNS[tableName];
  if (!allowed) return record; // unknown table — pass through as-is
  const clean = {};
  for (const key of allowed) {
    if (key in record) clean[key] = record[key];
  }
  return clean;
}

// Get all rows from a table
export async function getAll(tableName) {
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return [];
  }
  return data || [];
}

// Add a new row to a table
export async function add(tableName, record) {
  const clean = sanitize(tableName, record);
  const { data, error } = await supabase.from(tableName).insert(clean).select();
  if (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    throw error;
  }
  return data?.[0]?.id ?? data?.[0];
}

// Update an existing row
export async function put(tableName, record) {
  let idField = 'id';
  if (tableName === 'employees') idField = 'employee_id';
  else if (tableName === 'candidates') idField = 'rh_id';
  else if (tableName === 'jobs') idField = 'job_id';

  const idValue = record[idField];
  const clean = sanitize(tableName, record);

  const { data, error } = await supabase
    .from(tableName)
    .update(clean)
    .eq(idField, idValue)
    .select();

  if (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw error;
  }
  return data?.[0];
}

// Delete a row
export async function del(tableName, id) {
  let idField = 'id';
  if (tableName === 'employees') idField = 'employee_id';
  else if (tableName === 'candidates') idField = 'rh_id';
  else if (tableName === 'jobs') idField = 'job_id';

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq(idField, id);

  if (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
  return true;
}

// Get all data from all tables (snapshot)
export async function snapshot() {
  const tables = [
    'employees', 'candidates', 'jobs', 'applications',
    'interviews', 'interview_history',
    'assessment_ability_skills', 'assessment_ability_rounds', 'assessment_ability_grades',
    'job_required_skill', 'interview_round',
    'interviewer_availability', 'time_slot_request'
  ];

  const result = {};
  for (const table of tables) {
    result[table] = await getAll(table);
  }
  result.meta = [];
  return result;
}

export async function initDB() {
  return Promise.resolve();
}

export async function ensureSeeded() {
  return Promise.resolve();
}
