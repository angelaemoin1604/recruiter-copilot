// utils.js - Date formatting and message utilities

// Get today's date in YYYY-MM-DD format (for HTML date input min attribute)
export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get current time in HH:MM format
export function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Validate that a date is not in the past
export function isDatePast(dateStr) {
  if (!dateStr) return false;
  const today = getTodayDateString();
  return dateStr < today;
}

// Validate that a time is not in the past (only matters if date is today)
export function isTimePast(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  const today = getTodayDateString();
  if (dateStr !== today) return false; // Only check time if date is today
  const currentTime = getCurrentTimeString();
  return timeStr < currentTime;
}

// Validate date+time combination
export function validateDateTime(dateStr, startTimeStr, endTimeStr) {
  if (!dateStr) return "Date is required";
  if (isDatePast(dateStr)) return "Past dates are not allowed. Please select today or a future date.";
  if (startTimeStr && isTimePast(dateStr, startTimeStr)) return "Start time cannot be in the past for today's date.";
  if (endTimeStr && isTimePast(dateStr, endTimeStr)) return "End time cannot be in the past for today's date.";
  if (startTimeStr && endTimeStr && startTimeStr >= endTimeStr) return "End time must be after start time.";
  return null; // No errors
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  // If already formatted, return as-is
  if (/\d+(st|nd|rd|th)\s+\w+\s+\d{4}/.test(dateStr)) return dateStr;
  
  let date;
  if (dateStr.includes('T')) {
    date = new Date(dateStr);
  } else {
    date = new Date(dateStr + "T00:00:00");
  }
  
  if (isNaN(date.getTime())) return dateStr;
  
  const day = date.getDate();
  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  else if (day % 10 === 2 && day !== 12) suffix = "nd";
  else if (day % 10 === 3 && day !== 13) suffix = "rd";
  
  const months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}${suffix} ${month} ${year}`;
}

export function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return "";
  const date = new Date(dateTimeStr);
  if (isNaN(date.getTime())) return dateTimeStr;
  
  const datePart = formatDate(dateTimeStr.includes('T') ? dateTimeStr.split('T')[0] : dateTimeStr);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${datePart}, ${displayHours}:${displayMinutes} ${ampm}`;
}

export function formatTime(timeStr) {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

// Cancellation/Reschedule reasons
export const RESCHEDULE_REASONS = [
  "Candidate did not show up",
  "Interviewer is unavailable",
  "Scheduled against wrong interviewer",
  "Scheduled against wrong candidate",
  "Interviewer on planned leave",
  "Interviewer is unavailable at the requested time"
];

export const CANCELLATION_REASONS = [
  "Candidate did not show up",
  "Interviewer is unavailable",
  "Scheduled against wrong interviewer",
  "Scheduled against wrong candidate",
  "Interviewer on planned leave",
  "Interviewer is unavailable at the requested time"
];

// ========================================
// EMAIL TEMPLATES FOR AVAILABILITY REQUESTS
// ========================================

export const generateAvailabilityRequestEmail = (candidate, slots, token) => {
  // Generate the confirmation URL with unique token
  const confirmationUrl = `${window.location.origin}/confirm-availability/${token}`;
  
  // Format slots for email display
  const formattedSlots = slots.map(slot => {
    const date = new Date(slot.date + 'T00:00:00');
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    return `• ${dateStr} at ${slot.display}`;
  }).join('\n');

  const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Availability Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                Interview Availability Request from RippleHire
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hello <strong>${candidate.name}</strong>,
              </p>
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We would like to schedule an interview with you for the position of <strong>${candidate.job}</strong>. 
                Please confirm your availability for any of the following time slots:
              </p>
              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 6px;">
                <p style="color: #1e293b; font-size: 15px; line-height: 1.8; margin: 0; white-space: pre-line; font-family: 'Courier New', monospace;">
${formattedSlots}
                </p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                      Confirm My Availability
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                Or copy and paste this link into your browser:<br>
                <a href="${confirmationUrl}" style="color: #3b82f6; word-break: break-all;">
                  ${confirmationUrl}
                </a>
              </p>
              <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; margin: 20px 0; border-radius: 6px;">
                <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.5;">
                  <strong>📌 Note:</strong> Please respond within 48 hours. After confirmation, you'll receive a calendar invite with interview details.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 10px 0;">
                Best regards,<br>
                <strong>Recruitment Team</strong><br>
                RippleHire
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>
        </table>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
          © ${new Date().getFullYear()} RippleHire. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textEmail = `
Interview Availability Request from RippleHire

Hello ${candidate.name},

We would like to schedule an interview with you for the position of ${candidate.job}. 
Please confirm your availability for any of the following time slots:

${formattedSlots}

To confirm your availability, please click the link below:
${confirmationUrl}

Note: Please respond within 48 hours. After confirmation, you'll receive a calendar invite with interview details.

Best regards,
Recruitment Team
RippleHire
  `;

  return {
    html: htmlEmail,
    text: textEmail,
    subject: `Interview Availability Request from RippleHire`,
    confirmationUrl
  };
};

export const sendAvailabilityEmail = async (candidate, slots) => {
  try {
    const token = generateUniqueToken();
    
    await fetch('/api/availability/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        job: candidate.job,
        slots: slots,
        status: 'pending',
        createdAt: new Date().toISOString()
      })
    });

    const emailContent = generateAvailabilityRequestEmail(candidate, slots, token);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: candidate.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return {
      success: true,
      confirmationUrl: emailContent.confirmationUrl
    };

  } catch (error) {
    console.error('Error sending availability email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

function generateUniqueToken() {
  return `avail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
