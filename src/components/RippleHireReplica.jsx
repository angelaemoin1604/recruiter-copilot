// ============================================================
// RippleHireReplica.jsx - The "RippleHire candidate page" landing
// Pixel-faithful replica based on slides 4-5 of the wireframes.
// Has a floating chatbot circle bottom-right.
// ============================================================
import { useState, useEffect } from "react";
import {
  Search, Bell, Settings, Grid, ChevronDown, MessageCircle, X, Send,
  ArrowRight, Briefcase, Users, Calendar, Home, BarChart3, FileText, Mail, LogOut
} from "lucide-react";
import ChatbotMini from "./ChatbotMini.jsx";

export default function RippleHireReplica({ db, snapshot, currentUser, onOpenRecruiterCopilot, onLogout }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    // Pulse the chatbot circle for 3s when page first loads, to draw attention
    const t = setTimeout(() => setPulse(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const candidatesWithApps = snapshot.applications.map(a => {
    const cand = snapshot.candidates.find(c => c.rh_id === a.rh_id);
    const job = snapshot.jobs.find(j => j.job_id === a.job_id);
    return { ...a, candidate: cand, job };
  });

  // Helper function for round colors - LIGHTER PROFESSIONAL COLORS
  const getRoundColor = (round) => {
    const colorMap = {
      "Interview 1": "bg-blue-50 text-blue-700 border-blue-200",
      "Interview 2": "bg-purple-50 text-purple-700 border-purple-200",
      "Client": "bg-teal-50 text-teal-700 border-teal-200",
      "HR Stage": "bg-green-50 text-green-700 border-green-200",
      "Shortlisted": "bg-amber-50 text-amber-700 border-amber-200"
    };
    return colorMap[round] || "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* RippleHire Top Bar - LOGO REPLACED */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-6 py-2.5 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="RippleHire" className="w-9 h-9 rounded-lg" />
            <span className="text-xl font-black text-slate-900 tracking-tight">RippleHire</span>
          </div>

          <nav className="flex items-center gap-1">
            {[
              { label: "Dashboard", icon: Home },
              { label: "Jobs", icon: Briefcase },
              { label: "Candidates", icon: Users, active: true },
              { label: "Reports", icon: BarChart3 },
              { label: "Inbox", icon: Mail }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button key={item.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  item.active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                }`}>
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md w-56 bg-slate-50 text-slate-900" placeholder="Search candidates, jobs..." />
            </div>
            <button className="p-1.5 hover:bg-slate-100 rounded-md text-slate-700"><Bell size={16} /></button>
            <button className="p-1.5 hover:bg-slate-100 rounded-md text-slate-700"><Settings size={16} /></button>
            <button className="p-1.5 hover:bg-slate-100 rounded-md text-slate-700"><Grid size={16} /></button>
            <div className="relative group">
              <button className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-md hover:bg-slate-100">
                <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">A</div>
                <ChevronDown size={12} className="text-slate-600" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg py-1 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-900">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-600">{currentUser.email}</div>
                </div>
                <button onClick={onLogout} className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <LogOut size={12} /> Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page header */}
      <div className="px-6 pt-6 pb-3">
        <div className="flex items-baseline justify-between mb-1">
          <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-slate-800 border border-slate-300 rounded-md hover:bg-white">Export</button>
            <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">+ Add candidate</button>
          </div>
        </div>
        <p className="text-sm text-slate-700">Showing {candidatesWithApps.length} active applications across {snapshot.jobs.length} open positions</p>
      </div>

      {/* Filter tabs */}
      <div className="px-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-6 -mb-px">
          {["All", "New", "Shortlisted", "Interview", "Offer", "Rejected"].map((t, i) => (
            <button key={t} className={`px-1 py-3 text-sm font-medium border-b-2 transition ${
              i === 0 ? "border-blue-600 text-blue-700" : "border-transparent text-slate-700 hover:text-slate-900"
            }`}>
              {t} {i === 0 && <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{candidatesWithApps.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates table (RippleHire-style) - LIGHTER ROUND COLORS */}
      <div className="p-6">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-700 font-semibold w-8"><input type="checkbox" /></th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-700 font-semibold">Candidate</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-700 font-semibold">Job</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-700 font-semibold">Stage</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-700 font-semibold">Match</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-700 font-semibold">Applied</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-700 font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody>
              {candidatesWithApps.slice(0, 12).map((row, i) => (
                <tr key={`${row.rh_id}-${row.job_id}`} className="border-t border-slate-100 hover:bg-blue-50/30 transition">
                  <td className="px-4 py-3"><input type="checkbox" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        ["bg-blue-500","bg-emerald-500","bg-purple-500","bg-amber-500","bg-rose-500","bg-cyan-500"][i % 6]
                      }`}>
                        {row.candidate.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{row.candidate.name}</div>
                        <div className="text-[11px] text-slate-600 mono">{row.candidate.rh_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    <div className="font-medium">{row.job.title}</div>
                    <div className="text-[11px] text-slate-600">{row.job.requisition_code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${getRoundColor(row.current_round)}`}>
                      {row.current_round}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${row.match_score >= 85 ? "bg-emerald-500" : row.match_score >= 70 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: row.match_score + "%" }} />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{row.match_score}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 text-xs">{row.applied_at}</td>
                  <td className="px-4 py-3"><button className="text-slate-500 hover:text-slate-800">⋯</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-700">Showing 1–12 of {candidatesWithApps.length}</span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 text-xs border border-slate-300 rounded text-slate-800">Prev</button>
              <button className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded">1</button>
              <button className="px-2.5 py-1 text-xs border border-slate-300 rounded text-slate-800">2</button>
              <button className="px-2 py-1 text-xs border border-slate-300 rounded text-slate-800">Next</button>
            </div>
          </div>
        </div>

        {/* Hint banner - LOGO REPLACED */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg flex items-center gap-3">
          <img src="/logo.png" alt="" className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-slate-900 text-sm">Try Recruiter Copilot</div>
            <div className="text-xs text-slate-700">Click the chat bubble at the bottom-right to schedule any interview in one sentence.</div>
          </div>
          <ArrowRight size={20} className="text-blue-700" />
        </div>
      </div>

      {/* Floating chatbot circle */}
      <button
        onClick={() => setChatOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full shadow-2xl shadow-blue-500/40 flex items-center justify-center text-white hover:scale-110 transition group ${pulse ? "animate-pulse-ring" : ""}`}
        aria-label="Open Recruiter Copilot chatbot"
      >
        <MessageCircle size={24} />
        <span className="absolute right-full mr-3 whitespace-nowrap bg-slate-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none">
          Schedule with Recruiter Copilot
        </span>
      </button>

      {/* Mini chatbot modal */}
      {chatOpen && (
        <ChatbotMini
          db={db}
          snapshot={snapshot}
          currentUser={currentUser}
          onClose={() => setChatOpen(false)}
          onOpenDashboard={() => { setChatOpen(false); onOpenRecruiterCopilot(); }}
        />
      )}
    </div>
  );
}
