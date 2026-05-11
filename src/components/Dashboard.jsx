// ============================================================
// Dashboard.jsx - Bold, redesigned dashboard
// ============================================================
import { useState, useEffect, useMemo } from "react";
import {
  Sparkles, ArrowRight, Calendar, Users, Briefcase, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Activity, Send, X, MessageSquare, ExternalLink
} from "lucide-react";
import CollabPopup from "./CollabPopup.jsx";
import InterviewDetailPopup from "./InterviewDetailPopup.jsx";
import { formatDate, formatTime } from "../utils.js";

// Animated count-up
function CountUp({ to, duration = 1200 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let start;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{n}</>;
}

// Sparkline with progressive animation following data trend
function Sparkline({ values = [], color = "#3b82f6" }) {
  if (values.length < 2) return null;
  const w = 80, h = 24;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  
  // Calculate points for line
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * w,
    y: h - ((v - min) / range) * h,
    value: v
  }));
  
  const pts = points.map(p => `${p.x},${p.y}`).join(" ");
  
  // Calculate approximate path length
  let pathLength = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i-1].x;
    const dy = points[i].y - points[i-1].y;
    pathLength += Math.sqrt(dx * dx + dy * dy);
  }
  
  const lastPoint = points[points.length - 1];
  
  return (
    <svg width={w} height={h} className="overflow-visible">
      {/* Animated line - draws from start to end following the data */}
      <polyline 
        points={pts} 
        fill="none" 
        stroke={color} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="sparkline-path"
        style={{
          strokeDasharray: pathLength,
          strokeDashoffset: 0,
          filter: `drop-shadow(0 0 2px ${color}40)`
        }}
      />
      
      {/* Data dots at each point - appear sequentially */}
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="2.5"
          fill={color}
          className="data-dot"
          style={{
            filter: `drop-shadow(0 0 3px ${color}80)`
          }}
        />
      ))}
      
      {/* Final dot at endpoint - pulses after line completes */}
      <circle 
        cx={lastPoint.x} 
        cy={lastPoint.y} 
        r="3.5" 
        fill={color}
        className="pulse-dot"
        style={{
          filter: `drop-shadow(0 0 4px ${color})`
        }}
      />
      
      {/* Outer pulsing ring - radiates from final dot */}
      <circle 
        cx={lastPoint.x} 
        cy={lastPoint.y} 
        r="5" 
        fill="none"
        stroke={color}
        strokeWidth="2"
        className="pulse-ring"
      />
    </svg>
  );
}

// Funnel segment with hover animation
function FunnelStage({ label, count, total, color, onClick }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  
  // FIX: If count is 0, don't show any bar at all
  const shouldShowBar = count > 0;
  const targetHeight = shouldShowBar ? Math.max(pct, 8) : 0; // Minimum 8% for visibility when > 0
  
  return (
    <button onClick={onClick} className="flex-1 group min-w-0 funnel-card">
      <div className="text-[10px] uppercase tracking-wider text-slate-700 font-bold mb-1 truncate">{label}</div>
      <div className="relative h-16 rounded-md overflow-hidden border border-slate-300 bg-slate-50 group-hover:shadow-lg group-hover:border-blue-300 transition" style={{ padding: 0, margin: 0 }}>
        {/* Animated bar that grows from bottom on hover - ONLY if count > 0 */}
        {shouldShowBar && (
          <div 
            className={`funnel-bar ${color}`}
            style={{ 
              '--target-height': `${targetHeight}%`,
              bottom: 0,
              margin: 0,
              padding: 0
            }}
          />
        )}
        {/* Content stays in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="text-2xl font-black text-slate-900"><CountUp to={count} /></div>
          <div className="text-[10px] text-slate-700 font-medium">{Math.round(pct)}%</div>
        </div>
      </div>
    </button>
  );
}

export default function Dashboard({ snapshot, currentUser, onOpenDock, onSwitchTab, onScheduleCandidate }) {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [collabFor, setCollabFor] = useState(null);
  const [interviewPopup, setInterviewPopup] = useState(null);
  const [now, setNow] = useState(new Date());

  // ✨ ADD LIVE ANIMATIONS CSS
  useEffect(() => {
    const styleId = 'dashboard-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Sparkline drawing animation - DRAWS CLEANLY FROM START TO END */
        @keyframes draw-sparkline {
          from {
            stroke-dashoffset: 200;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        
        .sparkline-path {
          /* Line is HIDDEN by default */
          stroke-dashoffset: 200;
          stroke-dasharray: 200;
        }
        
        /* On hover: draw line cleanly from start to end */
        .stat-card:hover .sparkline-path {
          animation: draw-sparkline 1.8s ease-out forwards;
        }
        
        /* Hide data dots completely - no dots at all */
        .data-dot {
          display: none !important;
        }
        
        /* Show ONLY the final dot at the end - static, no animation */
        .pulse-dot {
          opacity: 1 !important;
          display: block !important;
        }
        
        .pulse-ring {
          display: none !important;
        }
        
        /* Grow up animation for funnel bars - TRIGGERS ON HOVER */
        @keyframes grow-up {
          0% {
            height: 0%;
          }
          100% {
            height: var(--target-height);
          }
        }
        
        .funnel-bar {
          /* Bar is always visible at its target height */
          height: var(--target-height);
          opacity: 1;
          position: absolute;
          bottom: 0 !important;  /* Force stick to bottom */
          left: 0;
          right: 0;
          margin: 0 !important;
          padding: 0 !important;
          border-radius: 0 0 calc(0.375rem - 1px) calc(0.375rem - 1px);
          transition: all 0.3s ease;
        }
        
        /* On hover: animate from 0 to target height, staying at bottom */
        .funnel-card:hover .funnel-bar {
          animation: grow-up 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation-fill-mode: both;
        }
        
        /* Add a shine effect when hovering */
        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }
        
        .funnel-card:hover .funnel-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          animation: shine 1.5s ease-in-out 0.2s infinite;
        }
        
        /* Ticker fade animation */
        @keyframes ticker-fade {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          10% {
            opacity: 1;
            transform: translateY(0);
          }
          90% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(10px);
          }
        }
        
        .animate-ticker-fade {
          animation: ticker-fade 4.5s ease-in-out forwards;
        }
        
        /* Hide data dots by default, show on hover */
        .data-dot {
          opacity: 0;
          transform: scale(0);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTickerIndex(i => i + 1), 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const today = "2026-04-29"; // demo "today"
    return {
      candidates: snapshot.candidates.length,
      activeApps: snapshot.applications.filter(a => a.status === "active").length,
      interviewers: snapshot.employees.filter(e => e.is_certified_panelist).length,
      scheduled: snapshot.interviews.length,
      pending: snapshot.time_slot_request.filter(t => t.status === "pending").length,
      todayCount: snapshot.interviews.filter(i => i.slot_date === today).length
    };
  }, [snapshot]);

  // Funnel
  const funnel = useMemo(() => {
    const counts = { "Shortlisted": 0, "Interview 1": 0, "Interview 2": 0, "Client": 0, "HR Stage": 0 };
    for (const a of snapshot.applications) if (counts[a.current_round] !== undefined) counts[a.current_round]++;
    return counts;
  }, [snapshot]);

  const todayInterviews = useMemo(() => {
    const today = "2026-04-29";
    return snapshot.interviews
      .filter(i => i.slot_date === today)
      .map(i => {
        const cand = snapshot.candidates.find(c => c.rh_id === i.rh_id);
        const job = snapshot.jobs.find(j => j.job_id === i.job_id);
        const interviewer = snapshot.employees.find(e => e.employee_id === i.interviewer_id);
        return { ...i, cand, job, interviewer };
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [snapshot]);

  const recentScheduled = useMemo(() => {
    return [...snapshot.interviews].sort((a, b) =>
      (b.created_at || "").localeCompare(a.created_at || "")
    ).slice(0, 8).map(i => {
      const cand = snapshot.candidates.find(c => c.rh_id === i.rh_id);
      const job = snapshot.jobs.find(j => j.job_id === i.job_id);
      const interviewer = snapshot.employees.find(e => e.employee_id === i.interviewer_id);
      const histories = snapshot.interview_history.filter(h => h.interview_id === i.id);
      const wasRescheduled = histories.some(h => h.action === "rescheduled");
      return { ...i, cand, job, interviewer, wasRescheduled };
    });
  }, [snapshot]);

  const tickerEntries = useMemo(() => {
    const entries = [];
    for (const i of recentScheduled.slice(0, 5)) {
      entries.push(`${i.cand?.name} scheduled with ${i.interviewer?.name} for ${i.job?.title}`);
    }
    if (entries.length === 0) entries.push("No interviews scheduled yet — open Recruiter Copilot to start");
    return entries;
  }, [recentScheduled]);

  // Pending requests "needs your attention" — updates live with snapshot
  const needs = useMemo(() => {
    const items = [];
    // 1. Pending timeslot requests
    for (const r of snapshot.time_slot_request.filter(r => r.status === "pending").slice(0, 3)) {
      const emp = snapshot.employees.find(e => e.employee_id === r.employee_id);
      items.push({ kind: "pending_slot", emp, request: r });
    }
    // 2. Recently scheduled interviews (last 3) for awareness
    const recentlyBooked = [...snapshot.interviews]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 3);
    for (const i of recentlyBooked) {
      if (items.length >= 5) break;
      const cand = snapshot.candidates.find(c => c.rh_id === i.rh_id);
      const interviewer = snapshot.employees.find(e => e.employee_id === i.interviewer_id);
      const job = snapshot.jobs.find(j => j.job_id === i.job_id);
      items.push({ kind: "recent_schedule", interview: i, cand, interviewer, job });
    }
    // 3. Idle candidates (no interview scheduled)
    const scheduledRhIds = new Set(snapshot.interviews.map(i => i.rh_id));
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    for (const a of snapshot.applications) {
      if (items.length >= 7) break;
      if (scheduledRhIds.has(a.rh_id)) continue;
      if (new Date(a.applied_at) < cutoff) {
        const cand = snapshot.candidates.find(c => c.rh_id === a.rh_id);
        const job = snapshot.jobs.find(j => j.job_id === a.job_id);
        items.push({ kind: "idle_candidate", cand, job, app: a });
      }
    }
    return items.slice(0, 7);
  }, [snapshot]);

  const sparkData = [3, 5, 4, 7, 6, 8, stats.scheduled || 9];

  return (
    <div className="animate-fade-in">
      {/* HERO BAND */}
      <div className="relative bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 rounded-2xl overflow-hidden mb-6 shadow-2xl">
        {/* animated mesh */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl animate-blob-2" />
        <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-blob-3" />

        {/* grid overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative px-8 py-10">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full mb-4 border border-white/20">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-xs text-blue-100 font-semibold">Live · {now.toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Prompt<span className="text-blue-400">2</span>Schedule
              </h1>
              <p className="text-blue-100 text-lg mb-5 max-w-xl">Schedule interviews in one sentence. The recruiter copilot built into RippleHire.</p>
              <div className="flex items-center gap-3">
                <button onClick={onOpenDock} className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 rounded-lg font-bold shadow-lg hover:scale-105 transition">
                  <img src="/logo.png" alt="" className="w-4 h-4" />
                  Start scheduling
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
                </button>
                <button onClick={() => onSwitchTab("interviews")} className="px-4 py-2.5 text-white border-2 border-white/30 rounded-lg font-semibold hover:bg-white/10 transition">
                  View interviews ({stats.scheduled})
                </button>
              </div>
            </div>

            {/* Today timeline preview */}
            <div className="hidden lg:block w-72 bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-blue-200" />
                <span className="text-xs text-blue-100 font-bold uppercase tracking-wider">Today</span>
                <span className="ml-auto text-2xl font-black text-white"><CountUp to={stats.todayCount} /></span>
              </div>
              <div className="space-y-1.5">
                {todayInterviews.length === 0 ? (
                  <div className="text-xs text-blue-200">Nothing scheduled today.</div>
                ) : todayInterviews.slice(0, 3).map(i => (
                  <button key={i.id} onClick={() => setInterviewPopup(i)} className="w-full text-left px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{i.start_time}</span>
                      <span className="text-blue-100 truncate">{i.cand?.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live ticker */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/50 px-2 py-1 rounded">
                <Activity size={12} className="text-emerald-300" />
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Activity</span>
              </div>
              <div className="overflow-hidden flex-1 h-5">
                <div key={tickerIndex} className="text-sm text-blue-100 animate-ticker-fade">
                  {tickerEntries[tickerIndex % tickerEntries.length]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: "Candidates", value: stats.candidates, color: "blue", Icon: Users, spark: [12, 15, 14, 18, 17, 20, stats.candidates], tab: "candidates", tooltip: "View all candidates" },
          { label: "Active applications", value: stats.activeApps, color: "indigo", Icon: Briefcase, spark: [8, 11, 10, 13, 12, 14, stats.activeApps], tab: "candidates", tooltip: "View active applications" },
          { label: "Certified panel", value: stats.interviewers, color: "purple", Icon: CheckCircle2, spark: [6, 7, 7, 8, 8, 9, stats.interviewers], tab: "employees", tooltip: "View certified panelists" },
          { label: "Scheduled", value: stats.scheduled, color: "emerald", Icon: Calendar, spark: sparkData, tab: "interviews", tooltip: "View scheduled interviews" },
          { label: "Pending requests", value: stats.pending, color: "amber", Icon: Clock, spark: [1, 2, 1, 2, 3, 2, stats.pending], tab: "employees", tooltip: "View pending timeslot requests" }
        ].map(s => {
          const Icon = s.Icon;
          const colorClass = {
            blue: { ring: "ring-blue-200", icon: "text-blue-700", bg: "bg-blue-50", spark: "#3b82f6" },
            indigo: { ring: "ring-indigo-200", icon: "text-indigo-700", bg: "bg-indigo-50", spark: "#6366f1" },
            purple: { ring: "ring-purple-200", icon: "text-purple-700", bg: "bg-purple-50", spark: "#a855f7" },
            emerald: { ring: "ring-emerald-200", icon: "text-emerald-700", bg: "bg-emerald-50", spark: "#10b981" },
            amber: { ring: "ring-amber-200", icon: "text-amber-700", bg: "bg-amber-50", spark: "#f59e0b" }
          }[s.color];
          return (
            <button
              key={s.label}
              onClick={() => onSwitchTab(s.tab)}
              title={s.tooltip}
              className="stat-card bg-white border-2 border-slate-200 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300 transition group text-left w-full cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${colorClass.bg} flex items-center justify-center group-hover:scale-110 transition`}>
                  <Icon size={18} className={colorClass.icon} />
                </div>
                <Sparkline values={s.spark} color={colorClass.spark} />
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1"><CountUp to={s.value} /></div>
              <div className="text-xs font-semibold text-slate-700">{s.label}</div>
              <div className="text-[10px] text-blue-600 font-semibold mt-1 opacity-0 group-hover:opacity-100 transition">Click to view →</div>
            </button>
          );
        })}
      </div>

      {/* PIPELINE FUNNEL */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pipeline at a glance</h2>
            <p className="text-xs text-slate-700">Active applications by stage</p>
          </div>
          <button onClick={() => onSwitchTab("candidates")} className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1">
            View candidates <ArrowRight size={12} />
          </button>
        </div>
        <div className="flex items-end gap-2">
          <FunnelStage label="Shortlisted" count={funnel["Shortlisted"]} total={stats.activeApps} color="battery-card battery-amber bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-900" onClick={() => onSwitchTab("candidates")} />
          <ArrowRight size={14} className="text-slate-400 mb-6 flex-shrink-0" />
          <FunnelStage label="Interview 1" count={funnel["Interview 1"]} total={stats.activeApps} color="battery-card battery-blue bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-blue-300 text-blue-900" onClick={() => onSwitchTab("candidates")} />
          <ArrowRight size={14} className="text-slate-400 mb-6 flex-shrink-0" />
          <FunnelStage label="Interview 2" count={funnel["Interview 2"]} total={stats.activeApps} color="battery-card battery-purple bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-300 text-purple-900" onClick={() => onSwitchTab("candidates")} />
          <ArrowRight size={14} className="text-slate-400 mb-6 flex-shrink-0" />
          <FunnelStage label="Client" count={funnel["Client"]} total={stats.activeApps} color="battery-card battery-pink bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-300 text-pink-900" onClick={() => onSwitchTab("candidates")} />
          <ArrowRight size={14} className="text-slate-400 mb-6 flex-shrink-0" />
          <FunnelStage label="HR Stage" count={funnel["HR Stage"]} total={stats.activeApps} color="battery-card battery-green bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-300 text-emerald-900" onClick={() => onSwitchTab("candidates")} />
        </div>
      </div>

      {/* TWO-COLUMN BOTTOM */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Recently scheduled (with Collab tab + Interview link columns) */}
        <div className="col-span-2 bg-white border-2 border-slate-200 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recently scheduled</h2>
            <button onClick={() => onSwitchTab("interviews")} className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1">
              All interviews <ArrowRight size={12} />
            </button>
          </div>
          {recentScheduled.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">No interviews yet</p>
              <p className="text-xs text-slate-600 mb-4">Open Recruiter Copilot and schedule your first interview.</p>
              <button onClick={onOpenDock} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                <Sparkles size={14} /> Open Recruiter Copilot
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-slate-700 font-bold">Candidate</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-slate-700 font-bold">When</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-slate-700 font-bold">Interviewer</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-slate-700 font-bold">Collaboration</th>
                  <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider text-slate-700 font-bold">Interview Details</th>
                </tr>
              </thead>
              <tbody>
                {recentScheduled.map(i => (
                  <tr key={i.id} className="border-t border-slate-100 hover:bg-blue-50/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                          {i.cand?.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{i.cand?.name}</div>
                          <div className="text-[10px] text-slate-700 truncate">{i.job?.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      <div className="font-semibold text-xs">{formatDate(i.slot_date)}</div>
                      <div className="text-[10px] text-slate-700">{formatTime(i.start_time)}–{formatTime(i.end_time)}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-800 text-xs font-medium">{i.interviewer?.name}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setInterviewPopup({ ...i, _initialTab: "collaboration" })} className="text-blue-700 hover:text-blue-900 underline text-xs font-semibold flex items-center gap-1">
                        <MessageSquare size={11} /> Collaboration tab
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setInterviewPopup(i)} className="text-blue-700 hover:text-blue-900 underline text-xs font-semibold flex items-center gap-1">
                        <ExternalLink size={11} /> {i.status === "rescheduled" ? "Rescheduled interview details" : i.status === "cancelled" ? "Cancelled interview details" : "Scheduled interview details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Needs your attention */}
        <div className="bg-white border-2 border-slate-200 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-700" />
            <h2 className="text-base font-bold text-slate-900">Needs your attention</h2>
          </div>
          <div className="p-3 space-y-2 max-h-[450px] overflow-y-auto">
            {needs.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-700 font-medium">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2" />
                All caught up!
              </div>
            )}
            {needs.map((item, i) => (
              <div key={i} className={`p-3 border rounded-md text-xs ${
                item.kind === "recent_schedule"
                  ? "bg-emerald-50 border-emerald-200"
                  : item.kind === "pending_slot"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-orange-50 border-orange-200"
              }`}>
                {item.kind === "pending_slot" && (
                  <>
                    <div className="font-bold text-slate-900 mb-0.5">⏳ Pending timeslot request</div>
                    <div className="text-slate-800">{item.emp?.name} on {formatDate(item.request.slot_date)} {item.request.start_time}</div>
                    <button onClick={() => onSwitchTab("employees")} className="mt-1.5 text-blue-700 hover:text-blue-900 font-semibold">Review →</button>
                  </>
                )}
                {item.kind === "recent_schedule" && (
                  <>
                    <div className="font-bold text-emerald-900 mb-0.5">✅ Interview scheduled</div>
                    <div className="text-slate-800">{item.cand?.name} · {item.job?.title}</div>
                    <div className="text-slate-700">{formatDate(item.interview.slot_date)} {formatTime(item.interview.start_time)} with {item.interviewer?.name}</div>
                    <button onClick={() => onSwitchTab("interviews")} className="mt-1.5 text-blue-700 hover:text-blue-900 font-semibold">View in Interviews →</button>
                  </>
                )}
                {item.kind === "idle_candidate" && (
                  <>
                    <div className="font-bold text-slate-900 mb-0.5">⚠️ {item.cand?.name} needs scheduling</div>
                    <div className="text-slate-800">{item.job?.title} · applied {formatDate(item.app?.applied_at)}</div>
                    <button
                      onClick={() => onScheduleCandidate ? onScheduleCandidate(item.cand, item.job, item.app) : onOpenDock()}
                      className="mt-1.5 text-blue-700 hover:text-blue-900 font-semibold"
                    >
                      Schedule now →
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {collabFor && <CollabPopup interview={collabFor} snapshot={snapshot} onClose={() => setCollabFor(null)} />}
      {interviewPopup && <InterviewDetailPopup interview={interviewPopup} snapshot={snapshot} onClose={() => setInterviewPopup(null)} />}
    </div>
  );
}
