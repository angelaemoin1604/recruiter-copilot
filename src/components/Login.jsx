// ============================================================
// Login.jsx - RippleHire-styled login screen
// ============================================================
import { useState } from "react";
import { Sparkles, Eye, EyeOff, AlertCircle, Lock, Mail } from "lucide-react";

const VALID_EMAIL = "recruiter@sandbox.com";
const VALID_PASSWORD = "Ripplehire123";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [pwdErr, setPwdErr] = useState("");

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setEmailErr(""); setPwdErr(""); setError("");

    let bad = false;
    if (!email.trim()) { setEmailErr("Email is required"); bad = true; }
    else if (!/^[\w.-]+@[\w.-]+\.\w+$/.test(email.trim())) { setEmailErr("Invalid email format"); bad = true; }
    if (!password) { setPwdErr("Password is required"); bad = true; }
    if (bad) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);

    if (email.trim().toLowerCase() === VALID_EMAIL && password === VALID_PASSWORD) {
      onLogin({ email: email.trim().toLowerCase(), name: "Angela Michael Emoin", id: "REC0001" });
    } else {
      setError("Invalid email or password. Use recruiter@sandbox.com / Ripplehire123");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-blob-2" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-blob-3" />

      <div className={`relative w-full max-w-md ${shake ? "animate-shake" : ""}`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
              <Sparkles size={26} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-3xl font-black text-white tracking-tight">RippleHire</div>
              <div className="text-xs text-blue-200 tracking-wide">Recruiter Workspace</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-700 mb-6">Sign in to access your recruiter workspace</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-900 font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Email <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailErr(""); }}
                  placeholder="recruiter@sandbox.com"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 ${emailErr ? "border-red-400" : "border-slate-300"}`}
                />
              </div>
              {emailErr && <span className="text-xs text-red-600 mt-1 block">{emailErr}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPwdErr(""); }}
                  placeholder="••••••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 text-sm border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 ${pwdErr ? "border-red-400" : "border-slate-300"}`}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwdErr && <span className="text-xs text-red-600 mt-1 block">{pwdErr}</span>}
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                <input type="checkbox" className="rounded" /> Remember me
              </label>
              <button type="button" className="text-blue-700 hover:text-blue-900 font-medium">Forgot password?</button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-md shadow-md disabled:opacity-60 transition"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">Demo credentials</div>
            <div className="bg-slate-50 rounded-md p-3 border border-slate-200 mono">
              <div className="text-xs text-slate-800"><span className="font-semibold">Email:</span> recruiter@sandbox.com</div>
              <div className="text-xs text-slate-800"><span className="font-semibold">Password:</span> Ripplehire123</div>
            </div>
          </div>
        </form>

        <p className="text-center text-xs text-blue-200 mt-6">© 2026 RippleHire · Recruiter Workspace</p>
      </div>
    </div>
  );
}
