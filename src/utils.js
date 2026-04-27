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
