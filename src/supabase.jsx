import { createClient } from '@supabase/supabase-js';
import emailjs from '@emailjs/browser';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// EmailJS Configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Initialize EmailJS
if (EMAILJS_PUBLIC_KEY) {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

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
  candidate_availability: ['id','rh_id','slot_date','start_time','end_time','status','requested_by','created_at'],
};

function sanitize(tableName, record) {
  const allowed = TABLE_COLUMNS[tableName];
  if (!allowed) return record;
  const clean = {};
  for (const key of allowed) {
    if (key in record) clean[key] = record[key];
  }
  return clean;
}

export async function getAll(tableName) {
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`Error fetching ${tableName}:`, error);
    return [];
  }
  return data || [];
}

export async function add(tableName, record) {
  const clean = sanitize(tableName, record);
  const { data, error } = await supabase.from(tableName).insert(clean).select();
  if (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    throw error;
  }
  return data?.[0]?.id ?? data?.[0];
}

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

export async function snapshot() {
  const tables = [
    'employees', 'candidates', 'jobs', 'applications',
    'interviews', 'interview_history',
    'assessment_ability_skills', 'assessment_ability_rounds', 'assessment_ability_grades',
    'job_required_skill', 'interview_round',
    'interviewer_availability', 'time_slot_request', 'candidate_availability'
  ];

  const result = {};
  for (const table of tables) {
    result[table] = await getAll(table);
  }
  result.meta = [];
  return result;
}

// Send availability request email using EmailJS
export async function sendAvailabilityEmail(candidate, slots) {
  try {
    console.log('📧 Sending email via EmailJS to:', candidate.email);

    if (!candidate.email) {
      throw new Error('Candidate does not have an email address');
    }

    // Validate EmailJS configuration
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      throw new Error('EmailJS is not configured. Please check your .env file.');
    }

    // Format slots for email
    const slotList = slots.map(s => {
      const date = new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
      return `• ${date} at ${s.display}`;
    }).join('\n');

    // Prepare template parameters
    const templateParams = {
      to_email: candidate.email,
      to_name: candidate.name,
      slot_list: slotList,
      from_name: 'RippleHire Recruitment Team'
    };

    console.log('📤 Sending with EmailJS...', templateParams);

    // Send via EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Email sent successfully!', response);
    return { success: true, data: response };

  } catch (error) {
    console.error('❌ EmailJS error:', error);
    throw error;
  }
}

export async function initDB() {
  return Promise.resolve();
}

export async function ensureSeeded() {
  return Promise.resolve();
}
