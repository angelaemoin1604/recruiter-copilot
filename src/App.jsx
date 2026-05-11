// App.jsx - Top-level router: Login → RippleHire replica → Recruiter Copilot
import { useState, useEffect } from "react";
import Login from "./components/Login.jsx";
import RippleHireReplica from "./components/RippleHireReplica.jsx";
import RecruiterCopilot from "./components/RecruiterCopilot.jsx";
import CandidateConfirmAvailability from "./components/CandidateConfirmAvailability.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import * as DB from "./db.js";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("login"); // "login" | "replica" | "prompt2schedule" | "confirm-availability"
  const [snapshot, setSnapshot] = useState(null);
  const [availabilityToken, setAvailabilityToken] = useState(null);

  useEffect(() => {
    refreshSnapshot();
    
    // Check if URL has /confirm-availability/:token
    const path = window.location.pathname;
    const match = path.match(/\/confirm-availability\/([^/]+)/);
    if (match) {
      const token = match[1];
      setAvailabilityToken(token);
      setView("confirm-availability");
    }
  }, []);

  const refreshSnapshot = async () => {
    const s = await DB.snapshot();
    setSnapshot(s);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setView("replica");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView("login");
  };

  if (!snapshot && view !== "confirm-availability") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <div className="text-sm font-semibold">Loading Recruiter Copilot...</div>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      {view === "login" && <Login onLogin={handleLogin} />}
      {view === "replica" && (
        <RippleHireReplica
          db={DB}
          snapshot={snapshot}
          currentUser={currentUser}
          onOpenRecruiterCopilot={() => setView("prompt2schedule")}
          onLogout={handleLogout}
          refreshSnapshot={refreshSnapshot}
        />
      )}
      {view === "prompt2schedule" && (
        <RecruiterCopilot
          snapshot={snapshot}
          refreshSnapshot={refreshSnapshot}
          currentUser={currentUser}
          onLogout={handleLogout}
          onBack={() => setView("replica")}
        />
      )}
      {view === "confirm-availability" && (
        <CandidateConfirmAvailability 
          availabilityToken={availabilityToken}
          onClose={() => setView("login")}
        />
      )}
    </ToastProvider>
  );
}
