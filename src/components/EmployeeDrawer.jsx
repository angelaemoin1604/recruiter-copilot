// EmployeeDrawer.jsx
import { useState } from "react";
import { X, User, Mail, Phone, Building, Award, Plus, Trash2, Check, XIcon, Calendar, Clock } from "lucide-react";
import * as DB from "../db.js";
import { useToast } from "./Toast.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import AddTimeslotForm from "./AddTimeslotForm.jsx";
import { getEmployeeRounds, getEmployeeSkills, getEmployeeGrades } from "../resolution.js";
import { formatDate, formatTime } from "../utils.js";

export default function EmployeeDrawer({ employee, snapshot, refreshSnapshot, currentUser, onClose }) {
  const [tab, setTab] = useState("profile");
  const [addingSkill, setAddingSkill] = useState(false);
  const [addingRound, setAddingRound] = useState(false);
  const [addingGrade, setAddingGrade] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const toast = useToast();

  // Always read LIVE data from snapshot — not the stale prop
  const live = snapshot.employees.find(e => e.employee_id === employee.employee_id) || employee;
  const empRounds = getEmployeeRounds(employee.employee_id, snapshot);
  const empSkills = getEmployeeSkills(employee.employee_id, snapshot);
  const empGrades = getEmployeeGrades(employee.employee_id, snapshot);
  const confirmedSlots = snapshot.interviewer_availability.filter(s => s.employee_id === employee.employee_id && s.status === "confirmed");
  const pendingRequests = snapshot.time_slot_request.filter(r => r.employee_id === employee.employee_id && r.status === "pending");

  // supabase.js sanitize() will strip any extra fields automatically
  const toggleCertified = async () => {
    try {
      await DB.put("employees", { ...live, is_certified_panelist: !live.is_certified_panelist });
      await refreshSnapshot();
      toast.success(live.is_certified_panelist ? "Certification removed. Skills, Rounds & Grades hidden." : "Employee is now a Certified Panelist!");
    } catch (err) { toast.error(`Failed: ${err?.message}`); }
  };

  const removeSkill = async (skill) => {
    const rec = snapshot.assessment_ability_skills.find(s => s.employee_id === employee.employee_id && s.skill_name === skill);
    if (!rec) return;
    await DB.del("assessment_ability_skills", rec.id);
    await refreshSnapshot(); toast.success(`Removed skill: ${skill}`); setConfirmDel(null);
  };
  const removeRound = async (round) => {
    const rec = snapshot.assessment_ability_rounds.find(r => r.employee_id === employee.employee_id && r.round_name === round);
    if (!rec) return;
    await DB.del("assessment_ability_rounds", rec.id);
    await refreshSnapshot(); toast.success(`Removed round: ${round}`); setConfirmDel(null);
  };
  const removeGrade = async (grade) => {
    const rec = snapshot.assessment_ability_grades.find(g => g.employee_id === employee.employee_id && g.grade_name === grade);
    if (!rec) return;
    await DB.del("assessment_ability_grades", rec.id);
    await refreshSnapshot(); toast.success(`Removed grade: ${grade}`); setConfirmDel(null);
  };
  const addSkill = async (skill) => {
    if (!skill.trim() || empSkills.includes(skill.trim())) return;
    await DB.add("assessment_ability_skills", { employee_id: employee.employee_id, skill_name: skill.trim() });
    await refreshSnapshot(); toast.success(`Added skill: ${skill}`); setAddingSkill(false);
  };
  const addRound = async (round) => {
    if (!round || empRounds.includes(round)) return;
    await DB.add("assessment_ability_rounds", { employee_id: employee.employee_id, round_name: round });
    await refreshSnapshot(); toast.success(`Added round: ${round}`); setAddingRound(false);
  };
  const addGrade = async (grade) => {
    if (!grade || empGrades.includes(grade)) return;
    await DB.add("assessment_ability_grades", { employee_id: employee.employee_id, grade_name: grade });
    await refreshSnapshot(); toast.success(`Added grade: ${grade}`); setAddingGrade(false);
  };
  const deleteSlot = async (slotId) => { await DB.del("interviewer_availability", slotId); await refreshSnapshot(); toast.success("Timeslot deleted"); setConfirmDel(null); };

  const confirmRequest = async (reqId) => {
    const req = snapshot.time_slot_request.find(r => r.id === reqId);
    if (!req) return;
    try {
      await DB.add("interviewer_availability", { employee_id: req.employee_id, slot_date: req.slot_date, start_time: req.start_time, end_time: req.end_time, status: "confirmed", added_by: currentUser.id, added_by_self: false });
      await DB.put("time_slot_request", { ...req, status: "confirmed" });
      await refreshSnapshot(); toast.success("Request confirmed!");
    } catch (err) { toast.error(`Failed: ${err?.message}`); }
  };

  const rejectRequest = async (reqId) => {
    const req = snapshot.time_slot_request.find(r => r.id === reqId);
    if (!req) return;
    try {
      await DB.put("time_slot_request", { ...req, status: "rejected" });
      await refreshSnapshot(); toast.success("Request rejected"); setConfirmDel(null);
    } catch (err) { toast.error(`Failed: ${err?.message}`); }
  };

  const handleAddSlot = async (data) => {
    try {
      if (data.mode === "confirmed") {
        await DB.add("interviewer_availability", { employee_id: employee.employee_id, slot_date: data.date, start_time: data.start, end_time: data.end, status: "confirmed", added_by: currentUser.id, added_by_self: currentUser.id === employee.employee_id });
        toast.success(`Confirmed timeslot added for ${employee.name}!`);
      } else {
        await DB.add("time_slot_request", { employee_id: employee.employee_id, requested_by: currentUser.id, slot_date: data.date, start_time: data.start, end_time: data.end, repeat_pattern: data.repeat || "none", status: "pending", created_at: new Date().toISOString() });
        toast.success(`Pending request sent for ${employee.name}!`);
      }
      await refreshSnapshot(); setShowAddSlot(false);
    } catch (err) { toast.error(`Failed to add timeslot: ${err?.message || "Unknown error"}`); }
  };

  const getName = (id) => { const e = snapshot.employees.find(x => x.employee_id === id); return e ? (e.employee_id === currentUser.id ? `${e.name} (me)` : e.name) : "Unknown"; };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 z-[70]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[650px] bg-white shadow-2xl z-[71] overflow-y-auto animate-slide-right">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">{employee.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
            <div><h2 className="text-xl font-bold">{employee.name}</h2><p className="text-xs text-purple-100 mono">{employee.employee_id}</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/15 rounded"><X size={18} /></button>
        </div>

        <div className="border-b border-slate-200 bg-white sticky top-[72px] z-[9]">
          <div className="flex px-6">
            {[{ id: "profile", label: "Profile & Assessment Ability" }, { id: "availability", label: "Availability & Timeslots" }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${tab === t.id ? "border-purple-600 text-purple-700 bg-purple-50" : "border-transparent text-slate-700 hover:bg-slate-50"}`}>{t.label}</button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {tab === "profile" && (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3 flex items-center gap-2"><User size={14} /> Profile</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Mail size={12} className="text-slate-600" /><span>{employee.email}</span></div>
                  <div className="flex items-center gap-2"><Phone size={12} className="text-slate-600" /><span>{employee.phone}</span></div>
                  <div className="flex items-center gap-2"><Building size={12} className="text-slate-600" /><span>{employee.department} · {employee.location}</span></div>
                  <div className="flex items-center gap-2"><Award size={12} className="text-slate-600" /><span>{employee.grade} · {employee.level}</span></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white border-2 border-slate-300 rounded-lg">
                <div><div className="font-bold text-slate-900 text-sm">Certified Panelist</div><div className="text-xs text-slate-700">Allow this employee to conduct interviews</div></div>
                <button onClick={toggleCertified} className={`relative w-12 h-6 rounded-full transition ${live.is_certified_panelist ? "bg-emerald-600" : "bg-slate-300"}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${live.is_certified_panelist ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Skills/Rounds/Grades only visible when certified — uses LIVE state */}
              {live.is_certified_panelist && (
                <div className="space-y-4">
                  {[
                    { label: "Skills", items: empSkills, adding: addingSkill, setAdding: setAddingSkill, onAdd: addSkill, onRemove: (s) => setConfirmDel({ type: "skill", item: s }), color: "blue", options: ["Java","Python","JavaScript","React","Spring Boot","Microservices","System Design","Node.js","MongoDB","MySQL","Selenium","Test Automation","CSS","HTML","Leadership","Java J2EE"].filter(s => !empSkills.includes(s)) },
                    { label: "Rounds", items: empRounds, adding: addingRound, setAdding: setAddingRound, onAdd: addRound, onRemove: (r) => setConfirmDel({ type: "round", item: r }), color: "indigo", options: ["Interview 1","Interview 2","Client","HR Stage"].filter(r => !empRounds.includes(r)) },
                    { label: "Grades", items: empGrades, adding: addingGrade, setAdding: setAddingGrade, onAdd: addGrade, onRemove: (g) => setConfirmDel({ type: "grade", item: g }), color: "purple", options: ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6"].filter(g => !empGrades.includes(g)) }
                  ].map(({ label, items, adding, setAdding, onAdd, onRemove, color, options }) => (
                    <div key={label} className="bg-white border-2 border-slate-300 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">{label} <span className="text-red-600">*</span></h3>
                        <button onClick={() => setAdding(true)} className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"><Plus size={12} /> Add {label.slice(0,-1).toLowerCase()}</button>
                      </div>
                      {items.length === 0 && !adding && <div className="text-xs text-slate-600">No {label.toLowerCase()} assigned</div>}
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(item => (
                          <span key={item} className={`inline-flex items-center gap-1 px-2 py-0.5 bg-${color}-100 border border-${color}-300 text-${color}-900 text-xs font-semibold rounded group`}>
                            {item}
                            <button onClick={() => onRemove(item)} className="opacity-0 group-hover:opacity-100 rounded-full"><XIcon size={10} /></button>
                          </span>
                        ))}
                        {adding && (
                          <select autoFocus onChange={e => { if (e.target.value) onAdd(e.target.value); }} onBlur={() => setAdding(false)} className={`px-2 py-0.5 text-xs border-2 border-${color}-500 rounded`}>
                            <option value="">Select...</option>
                            {options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "availability" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2"><Calendar size={14} className="text-emerald-600" /> Confirmed Availability</h3>
                  <button onClick={() => setShowAddSlot(true)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded"><Plus size={12} /> Add Timeslot</button>
                </div>
                {confirmedSlots.length === 0 ? <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-700">No confirmed slots</div> : (
                  <div className="space-y-1.5">
                    {confirmedSlots.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-300 rounded-lg group">
                        <div className="flex items-center gap-2.5"><Clock size={14} className="text-emerald-700" /><div><div className="font-bold text-sm text-slate-900">{formatDate(s.slot_date)} · {formatTime(s.start_time)}–{formatTime(s.end_time)}</div><div className="text-[10px] text-slate-700">Added by {getName(s.added_by)}</div></div></div>
                        <button onClick={() => setConfirmDel({ type: "slot", item: s })} className="p-1.5 text-red-700 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3 flex items-center gap-2"><Clock size={14} className="text-amber-600" /> Pending Requests</h3>
                {pendingRequests.length === 0 ? <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-700">No pending requests</div> : (
                  <div className="space-y-1.5">
                    {pendingRequests.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-300 rounded-lg">
                        <div className="flex items-center gap-2.5"><Clock size={14} className="text-amber-700" /><div><div className="font-bold text-sm text-slate-900">{formatDate(r.slot_date)} · {formatTime(r.start_time)}–{formatTime(r.end_time)}</div><div className="text-[10px] text-slate-700">Requested by {getName(r.requested_by)}</div></div></div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => confirmRequest(r.id)} className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700" title="Confirm"><Check size={12} /></button>
                          <button onClick={() => setConfirmDel({ type: "request", item: r })} className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700" title="Reject"><XIcon size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showAddSlot && <AddTimeslotForm employee={employee} currentUser={currentUser} onClose={() => setShowAddSlot(false)} onSave={handleAddSlot} />}
      <ConfirmDialog
        open={!!confirmDel}
        title={confirmDel?.type === "slot" ? "Delete timeslot?" : confirmDel?.type === "request" ? "Reject request?" : `Remove ${confirmDel?.type}?`}
        message={confirmDel?.type === "slot" ? "Permanently delete this timeslot?" : confirmDel?.type === "request" ? "Reject this timeslot request?" : `Remove this ${confirmDel?.type}?`}
        danger={true}
        confirmLabel={confirmDel?.type === "request" ? "Reject" : "Delete"}
        onConfirm={() => {
          if (confirmDel.type === "skill") removeSkill(confirmDel.item);
          else if (confirmDel.type === "round") removeRound(confirmDel.item);
          else if (confirmDel.type === "grade") removeGrade(confirmDel.item);
          else if (confirmDel.type === "slot") deleteSlot(confirmDel.item.id);
          else if (confirmDel.type === "request") rejectRequest(confirmDel.item.id);
        }}
        onCancel={() => setConfirmDel(null)}
      />
    </>
  );
}
