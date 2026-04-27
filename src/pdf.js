// ============================================================
// pdf.js - Generate ATTRACTIVE & UNIQUE resume PDFs per candidate
// ============================================================
import { jsPDF } from "jspdf";

// Deterministic pseudo-random based on RH ID
function seedRand(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return () => {
    h = (h * 9301 + 49297) % 233280;
    return h / 233280;
  };
}

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN(arr, n, rand) {
  const result = [];
  const copy = [...arr];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rand() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

const COMPANIES = [
  "Tata Consultancy Services", "Infosys", "Wipro", "Capgemini", "Mphasis",
  "L&T Infotech", "Tech Mahindra", "Cognizant", "Mindtree", "HCL Technologies",
  "Accenture India", "Microsoft India", "Oracle India", "SAP Labs India",
  "Amazon India", "Flipkart", "Paytm", "Ola Cabs", "Swiggy", "Zomato"
];

const UNIS = [
  "Indian Institute of Technology, Bombay",
  "Indian Institute of Technology, Delhi",
  "Birla Institute of Technology and Science, Pilani",
  "National Institute of Technology, Trichy",
  "Vellore Institute of Technology",
  "Manipal Institute of Technology",
  "Delhi Technological University",
  "Anna University, Chennai",
  "PES University, Bangalore",
  "VJTI Mumbai"
];

const CITIES = ["Bangalore", "Mumbai", "Pune", "Hyderabad", "Chennai", "Delhi", "Gurugram", "Noida"];

const HOBBIES = [
  "Open-source contributions on GitHub",
  "Competitive programming (CodeForces 1800+)",
  "Technical blogging on Medium",
  "Trekking in the Western Ghats",
  "Amateur photography",
  "Running half-marathons",
  "Chess (FIDE rated)",
  "Volunteering at code camps",
  "Building IoT projects",
  "Music production"
];

const CERTS = [
  "AWS Certified Solutions Architect",
  "Google Cloud Professional Cloud Architect",
  "Microsoft Azure Fundamentals (AZ-900)",
  "Oracle Certified Java Professional",
  "Certified Kubernetes Administrator (CKA)",
  "Scrum Master Certified (SMC)",
  "PMP Certified",
  "ISTQB Foundation Level"
];

const ACHIEVEMENTS = [
  "Reduced API response time by 60% through query optimization and caching",
  "Led migration of monolithic services to microservices architecture",
  "Mentored 8+ junior engineers; 3 promoted to senior roles",
  "Won 'Innovator of the Year' award for internal automation tools",
  "Published 2 research papers on distributed systems",
  "Speaker at 3 industry conferences on backend engineering",
  "Architected systems handling 1M+ daily transactions",
  "Reduced infrastructure costs by 40% via cloud optimization",
  "Built ML pipelines processing 10TB+ data daily",
  "Patent holder for novel data compression algorithm"
];

// 5 different color themes - assigned by hash
const THEMES = [
  { primary: [29, 78, 216], secondary: [219, 234, 254], accent: [59, 130, 246], name: "Ocean Blue" },
  { primary: [88, 28, 135], secondary: [243, 232, 255], accent: [147, 51, 234], name: "Royal Purple" },
  { primary: [4, 120, 87], secondary: [209, 250, 229], accent: [16, 185, 129], name: "Forest Green" },
  { primary: [194, 65, 12], secondary: [255, 237, 213], accent: [249, 115, 22], name: "Sunset Orange" },
  { primary: [157, 23, 77], secondary: [253, 232, 232], accent: [219, 39, 119], name: "Ruby Pink" }
];

function pickJobs(rand, yearNow = 2026, totalYears = 5) {
  const out = [];
  let endYear = yearNow;
  let remaining = totalYears;
  const titles = [
    "Software Engineer", "Senior Software Engineer", "Application Developer",
    "Module Lead", "Associate Engineer", "Lead Developer", "Tech Lead",
    "Senior Developer", "Principal Engineer", "Staff Engineer"
  ];
  
  while (remaining > 0 && out.length < 4) {
    const dur = Math.min(remaining, 1 + Math.floor(rand() * 3));
    const startYear = endYear - dur;
    const company = pick(COMPANIES, rand);
    const title = pick(titles, rand);
    out.push({
      company,
      title,
      start: startYear,
      end: out.length === 0 ? "Present" : endYear,
      location: pick(CITIES, rand)
    });
    endYear = startYear;
    remaining -= dur;
  }
  return out;
}

export function generateResumePDF(candidate, application, job, jobSkills) {
  const rand = seedRand(candidate.rh_id);
  const theme = THEMES[Math.floor(rand() * THEMES.length)];
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  
  const yearsExp = 3 + Math.floor(rand() * 8); // 3-10 years
  const city = pick(CITIES, rand);
  
  // ==================== LEFT SIDEBAR (240pt wide) ====================
  const sidebarW = 240;
  doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.rect(0, 0, sidebarW, pageH, "F");
  
  // Profile circle
  doc.setFillColor(255, 255, 255);
  doc.circle(sidebarW / 2, 100, 50, "F");
  doc.setFillColor(theme.accent[0], theme.accent[1], theme.accent[2]);
  doc.circle(sidebarW / 2, 100, 45, "F");
  
  // Initials
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  const initials = candidate.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const initWidth = doc.getTextWidth(initials);
  doc.text(initials, sidebarW / 2 - initWidth / 2, 115);
  
  // Name (centered, white)
  let sy = 180;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  const nameLines = doc.splitTextToSize(candidate.name, sidebarW - 30);
  for (const line of nameLines) {
    const w = doc.getTextWidth(line);
    doc.text(line, sidebarW / 2 - w / 2, sy);
    sy += 22;
  }
  
  // Title
  sy += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const roleLines = ["Aspiring " + job.title];
  for (const line of roleLines) {
    const w = doc.getTextWidth(line);
    doc.text(line, sidebarW / 2 - w / 2, sy);
    sy += 14;
  }
  
  // Decorative line
  sy += 10;
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(40, sy, sidebarW - 40, sy);
  sy += 25;
  
  // CONTACT
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CONTACT", 25, sy);
  sy += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  // Email (with proper wrapping)
  const emailLines = doc.splitTextToSize("✉  " + candidate.email, sidebarW - 35);
  for (const line of emailLines) {
    doc.text(line, 25, sy);
    sy += 12;
  }
  sy += 4;
  doc.text("📞  " + candidate.phone, 25, sy);
  sy += 14;
  doc.text("📍  " + city + ", India", 25, sy);
  sy += 14;
  doc.text("🆔  " + candidate.rh_id, 25, sy);
  sy += 25;
  
  // SKILLS
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SKILLS", 25, sy);
  sy += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  const baseSkills = jobSkills.map(s => s.skill_name);
  const extras = ["Git", "Agile", "JIRA", "REST APIs", "CI/CD", "Docker", "Kubernetes"];
  const allSkills = [...new Set([...baseSkills, ...pickN(extras, 4, rand)])];
  
  // Skill bars
  for (const skill of allSkills.slice(0, 6)) {
    doc.text(skill, 25, sy);
    sy += 8;
    // Background bar
    doc.setFillColor(255, 255, 255, 0.3);
    doc.setDrawColor(255, 255, 255);
    doc.rect(25, sy, sidebarW - 50, 4, "F");
    // Filled portion (random width 70-100%)
    const fillPct = 70 + Math.floor(rand() * 30);
    doc.setFillColor(theme.accent[0], theme.accent[1], theme.accent[2]);
    doc.rect(25, sy, ((sidebarW - 50) * fillPct) / 100, 4, "F");
    sy += 12;
  }
  
  // LANGUAGES
  sy += 10;
  if (sy < pageH - 100) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("LANGUAGES", 25, sy);
    sy += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("• English (Fluent)", 25, sy); sy += 12;
    doc.text("• Hindi (Native)", 25, sy); sy += 12;
    const localLangs = ["Tamil", "Marathi", "Kannada", "Telugu", "Bengali", "Gujarati"];
    doc.text("• " + pick(localLangs, rand) + " (Conversational)", 25, sy);
    sy += 14;
  }
  
  // ==================== RIGHT MAIN CONTENT ====================
  let y = 50;
  const mainX = sidebarW + 30;
  const mainW = pageW - sidebarW - 60;
  
  // PROFILE
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PROFILE", mainX, y);
  doc.setDrawColor(theme.accent[0], theme.accent[1], theme.accent[2]);
  doc.setLineWidth(2);
  doc.line(mainX, y + 4, mainX + 60, y + 4);
  y += 22;
  
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const profiles = [
    `Results-driven ${job.title.toLowerCase()} with ${yearsExp}+ years of hands-on experience delivering production-grade software in fast-paced environments. Expertise in ${baseSkills.slice(0, 2).join(" and ")}, with a passion for clean code and scalable architectures.`,
    `Innovative engineer with ${yearsExp}+ years building robust applications used by millions. Strong background in ${baseSkills[0] || "software development"}, with proven ability to lead cross-functional teams and deliver complex projects on time.`,
    `Detail-oriented ${job.title.toLowerCase()} bringing ${yearsExp} years of experience designing and implementing enterprise solutions. Adept at translating business requirements into elegant technical designs.`
  ];
  
  const summary = pick(profiles, rand);
  const sumLines = doc.splitTextToSize(summary, mainW);
  doc.text(sumLines, mainX, y);
  y += sumLines.length * 13 + 18;
  
  // EXPERIENCE
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("EXPERIENCE", mainX, y);
  doc.line(mainX, y + 4, mainX + 90, y + 4);
  y += 22;
  
  const jobs = pickJobs(rand, 2026, yearsExp);
  for (const j of jobs) {
    if (y > pageH - 120) { doc.addPage(); y = 50; }
    
    // Title
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(j.title, mainX, y);
    
    // Date - right aligned
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2]);
    const dateStr = `${j.start} – ${j.end}`;
    const dateW = doc.getTextWidth(dateStr);
    doc.text(dateStr, mainX + mainW - dateW, y);
    y += 13;
    
    // Company
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`${j.company} • ${j.location}`, mainX, y);
    y += 14;
    
    // Bullets - unique per role
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const bullets = pickN(ACHIEVEMENTS, 3, rand);
    for (const b of bullets) {
      const lines = doc.splitTextToSize("• " + b, mainW - 5);
      for (const line of lines) {
        doc.text(line, mainX + 5, y);
        y += 12;
      }
    }
    y += 8;
  }
  
  // EDUCATION
  if (y > pageH - 100) { doc.addPage(); y = 50; }
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("EDUCATION", mainX, y);
  doc.line(mainX, y + 4, mainX + 80, y + 4);
  y += 22;
  
  const uni = pick(UNIS, rand);
  const degrees = ["Bachelor of Technology", "Bachelor of Engineering", "Master of Technology"];
  const branches = ["Computer Science", "Information Technology", "Software Engineering", "Computer Engineering"];
  
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`${pick(degrees, rand)} in ${pick(branches, rand)}`, mainX, y);
  y += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(uni, mainX, y);
  y += 13;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(theme.accent[0], theme.accent[1], theme.accent[2]);
  const gradYear = 2026 - yearsExp - 4;
  const cgpa = (7 + rand() * 3).toFixed(2);
  doc.text(`Graduated ${gradYear} • CGPA: ${cgpa}/10`, mainX, y);
  y += 22;
  
  // CERTIFICATIONS
  if (y > pageH - 90) { doc.addPage(); y = 50; }
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CERTIFICATIONS", mainX, y);
  doc.line(mainX, y + 4, mainX + 110, y + 4);
  y += 22;
  
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const certs = pickN(CERTS, 3, rand);
  for (const c of certs) {
    doc.text("✓  " + c, mainX, y);
    y += 13;
  }
  y += 10;
  
  // INTERESTS
  if (y > pageH - 80) { doc.addPage(); y = 50; }
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INTERESTS", mainX, y);
  doc.line(mainX, y + 4, mainX + 80, y + 4);
  y += 22;
  
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const hobs = pickN(HOBBIES, 3, rand);
  for (const h of hobs) {
    doc.text("• " + h, mainX, y);
    y += 13;
  }
  
  // Footer on all pages
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated by RippleHire • ${new Date().toLocaleDateString()} • ${candidate.name} • Page ${i} of ${pages}`,
      pageW / 2,
      pageH - 15,
      { align: "center" }
    );
  }
  
  return doc;
}

export function downloadResumePDF(candidate, application, job, jobSkills) {
  const doc = generateResumePDF(candidate, application, job, jobSkills);
  doc.save(`${candidate.name.replace(/\s+/g, "_")}_${candidate.rh_id}_Resume.pdf`);
}

export function previewResumePDF(candidate, application, job, jobSkills) {
  const doc = generateResumePDF(candidate, application, job, jobSkills);
  return doc.output("datauristring");
}
