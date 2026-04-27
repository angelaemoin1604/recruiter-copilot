import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  const { data, error } = await supabase.from(tableName).insert(record).select();
  if (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    throw error;
  }
  return data?.[0]?.id || data?.[0];
}

// Update an existing row
export async function put(tableName, record) {
  let idField = 'id';
  if (tableName === 'employees') idField = 'employee_id';
  else if (tableName === 'candidates') idField = 'rh_id';
  else if (tableName === 'jobs') idField = 'job_id';
  
  const idValue = record[idField];
  const { data, error } = await supabase
    .from(tableName)
    .update(record)
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

// Init function (does nothing for Supabase - already initialized)
export async function initDB() {
  return Promise.resolve();
}

// Already seeded - data is in Supabase
export async function ensureSeeded() {
  return Promise.resolve();
}