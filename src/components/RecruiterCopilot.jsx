// Recruiter Copilot.jsx - Main app shell with nav + tabs
import { useState, useEffect, useRef } from "react";
import { Sparkles, Home, Users, Briefcase, Calendar, LogOut, ChevronDown, ArrowLeft } from "lucide-react";
import Dashboard from "./Dashboard.jsx";
import CandidatesTab from "./CandidatesTab.jsx";
import EmployeesTab from "./EmployeesTab.jsx";
import InterviewsTab from "./InterviewsTab.jsx";
import ChatbotDock from "./ChatbotDock.jsx";

export default function RecruiterCopilot({ snapshot, refreshSnapshot, currentUser, onLogout, onBack }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dockOpen, setDockOpen] = useState(false);
  const [prefilledMessage, setPrefilledMessage] = useState("");
  // FIX #4: Add state for candidate highlighting
  const [highlightCandidates, setHighlightCandidates] = useState([]);

  // Cmd/Ctrl+K to toggle dock
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setDockOpen(o => !o);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // FIX #4: Callback to jump to candidates tab with highlighting
  const handleJumpToCandidates = (candidateIds) => {
    setActiveTab("candidates");
    setHighlightCandidates(candidateIds);
    setDockOpen(false);

    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightCandidates([]);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-100" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top nav */}
      <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-20">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 px-2 py-1.5 text-slate-700 hover:bg-slate-100 rounded-md text-sm font-semibold mr-2"
                  title="Back to Candidates page"
                >
                  <ArrowLeft size={16} />
                  <span className="text-xs">Back</span>
                </button>
              )}
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className="text-xl font-black text-slate-900">Recruiter Copilot</span>
            </div>

            <nav className="flex items-center gap-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: Home },
                { id: "candidates", label: "Candidates", icon: Users },
                { id: "employees", label: "Employees", icon: Briefcase },
                { id: "interviews", label: "Interviews", icon: Calendar }
              ].map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition ${activeTab === t.id
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-800 hover:bg-slate-100"
                      }`}
                  >
                    <Icon size={14} />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDockOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-sm font-bold shadow-md hover:shadow-lg transition"
            >
              <Sparkles size={14} /> Recruiter Copilot
            </button>
            <div className="relative group">
              <button className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-md hover:bg-slate-100">
                <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
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

      {/* Tab content */}
      <main className="p-6">
        {activeTab === "dashboard" && (
          <Dashboard
            snapshot={snapshot}
            currentUser={currentUser}
            onOpenDock={() => setDockOpen(true)}
            onSwitchTab={setActiveTab}
            onScheduleCandidate={(cand, job, app) => {
              const msg = `Schedule ${app?.current_round || "Interview 1"} for ${cand.name} (${cand.rh_id}) for ${job.title}`;
              setPrefilledMessage(msg);
              setDockOpen(true);
            }}
          />
        )}
        {/* FIX #4: Pass highlightCandidates to CandidatesTab */}
        {activeTab === "candidates" && (
          <CandidatesTab
            snapshot={snapshot}
            highlightCandidates={highlightCandidates}
          />
        )}
        {activeTab === "employees" && <EmployeesTab snapshot={snapshot} refreshSnapshot={refreshSnapshot} currentUser={currentUser} />}
        {activeTab === "interviews" && <InterviewsTab snapshot={snapshot} refreshSnapshot={refreshSnapshot} currentUser={currentUser} />}
      </main>

      {/* Chatbot dock */}
      {dockOpen && (
        <ChatbotDock
          snapshot={snapshot}
          currentUser={currentUser}
          refreshSnapshot={refreshSnapshot}
          prefilledMessage={prefilledMessage}
          onClose={() => { setDockOpen(false); setPrefilledMessage(""); }}
          onJumpToInterviews={() => { setActiveTab("interviews"); setDockOpen(false); setPrefilledMessage(""); }}
          onJumpToCandidates={handleJumpToCandidates}
        />
      )}
    </div>
  );
}
