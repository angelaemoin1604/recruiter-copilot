import { createClient } from '@supabase/supabase-js';
import emailjs from '@emailjs/browser';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// EmailJS Configuration - HARDCODED FOR RELIABILITY
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_x3k41yt';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_wkd39cc';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'sTgpTb5NDksjA3krU';

console.log('🔧 EmailJS Configuration:');
console.log('  Service ID:', EMAILJS_SERVICE_ID);
console.log('  Template ID:', EMAILJS_TEMPLATE_ID);
console.log('  Public Key:', EMAILJS_PUBLIC_KEY ? '✅ Present' : '❌ Missing');

// Initialize EmailJS immediately
try {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log('✅ EmailJS initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize EmailJS:', error);
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

// BULLETPROOF: Send availability request email using EmailJS
export async function sendAvailabilityEmail(candidate, slots) {
  try {
    console.log('=' * 50);
    console.log('📧 SENDING EMAIL VIA EMAILJS');
    console.log('=' * 50);
    console.log('Candidate:', candidate);
    console.log('Slots:', slots);

    // Validate candidate
    if (!candidate) {
      throw new Error('❌ Candidate object is null or undefined');
    }

    if (!candidate.email) {
      throw new Error(`❌ Candidate "${candidate.name}" does not have an email address`);
    }

    if (!candidate.name) {
      throw new Error('❌ Candidate does not have a name');
    }

    if (!slots || slots.length === 0) {
      throw new Error('❌ No slots provided');
    }

    console.log('✅ Validation passed');

    // Verify EmailJS is initialized
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      throw new Error('❌ EmailJS configuration is incomplete. Check .env file.');
    }

    console.log('✅ EmailJS configured');

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

    console.log('📋 Formatted slots:', slotList);

    // Prepare template parameters
    const templateParams = {
      to_email: candidate.email,
      to_name: candidate.name,
      slot_list: slotList,
      from_name: 'RippleHire Recruitment Team'
    };

    console.log('📤 Template parameters:', templateParams);

    // Send via EmailJS
    console.log('🔄 Calling emailjs.send()...');
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('Response:', response);
    console.log('=' * 50);

    return { success: true, data: response };

  } catch (error) {
    console.error('=' * 50);
    console.error('❌ ERROR SENDING EMAIL:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('=' * 50);
    throw error;
  }
}

export async function initDB() {
  return Promise.resolve();
}

export async function ensureSeeded() {
  return Promise.resolve();
}
