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
  candidate_availability: ['id','rh_id','slot_date','start_time','end_time','status','requested_by','created_at'],
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
    'interviewer_availability', 'time_slot_request', 'candidate_availability'
  ];

  const result = {};
  for (const table of tables) {
    result[table] = await getAll(table);
  }
  result.meta = [];
  return result;
}

// Send availability request email to candidate
export async function sendAvailabilityEmail(candidate, slots) {
  try {
    console.log('📧 Sending availability email to:', candidate.email);
    console.log('📅 Slots:', slots);

    // Validate candidate has email
    if (!candidate.email) {
      throw new Error('Candidate does not have an email address');
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

    const emailBody = {
      to: candidate.email,
      subject: 'Interview Availability Request from RippleHire',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Interview Availability Request</h2>
          <p>Hello ${candidate.name},</p>
          <p>We would like to schedule an interview with you. Please confirm your availability for any of the following time slots:</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <pre style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.8; margin: 0;">${slotList}</pre>
          </div>
          <p>Please reply to this email with your preferred slot(s).</p>
          <p style="margin-top: 30px;">Best regards,<br/>Recruitment Team<br/>RippleHire</p>
        </div>
      `
    };

    console.log('📤 Calling Edge Function with body:', {
      to: emailBody.to,
      subject: emailBody.subject,
      htmlLength: emailBody.html.length
    });

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailBody
    });

    console.log('📨 Edge Function response:', { data, error });

    if (error) {
      console.error('❌ Edge Function error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    if (!data || !data.success) {
      console.error('❌ Email sending failed:', data);
      throw new Error('Email sending failed - no success confirmation');
    }

    console.log('✅ Email sent successfully! ID:', data.data?.id);
    return data;
  } catch (error) {
    console.error('❌ Error in sendAvailabilityEmail:', error);
    throw error;
  }
}

export async function initDB() {
  return Promise.resolve();
}

export async function ensureSeeded() {
  return Promise.resolve();
}
