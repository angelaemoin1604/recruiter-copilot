// App.jsx - Top-level router: Login → RippleHire replica → Recruiter Copilot
import { useState, useEffect } from "react";
import Login from "./components/Login.jsx";
import RippleHireReplica from "./components/RippleHireReplica.jsx";
import RecruiterCopilot from "./components/RecruiterCopilot.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import * as DB from "./db.js";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("login"); // "login" | "replica" | "prompt2schedule"
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    refreshSnapshot();
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

  if (!snapshot) {
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
    </ToastProvider>
  );
}
