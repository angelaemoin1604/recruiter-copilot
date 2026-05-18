// CandidatesTab.jsx - UPDATED with CandidateDrawer
import { useState, useEffect, useRef } from "react";
import DataTable from "./DataTable.jsx";
import { ExternalLink, Eye, Download, Calendar } from "lucide-react";
import JobDrawer from "./JobDrawer.jsx";
import CandidateDrawer from "./CandidateDrawer.jsx";  // NEW IMPORT
import ResumePreview from "./ResumePreview.jsx";
import CandidateAvailabilityPopup from "./CandidateAvailabilityPopup.jsx";
import { downloadResumePDF } from "../pdf.js";
import { useToast } from "./Toast.jsx";
import { formatDate } from "../utils.js";
import * as DB from "../supabase.jsx";

export default function CandidatesTab({ snapshot, highlightCandidates = [], currentUser, refreshSnapshot }) {
  const [jobDrawer, setJobDrawer] = useState(null);
  const [candidateDrawer, setCandidateDrawer] = useState(null);  // NEW STATE
  const [previewFor, setPreviewFor] = useState(null);
  const [availabilityPopup, setAvailabilityPopup] = useState(null); // Now stores { candidate, job }
  const toast = useToast();

  // Get all unique candidates for navigation
  const allCandidates = snapshot.candidates;

  const handleCandidateNavigation = (direction) => {
    if (!candidateDrawer) return;
    
    const currentIndex = allCandidates.findIndex(c => c.rh_id === candidateDrawer.rh_id);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % allCandidates.length;
    } else {
      newIndex = (currentIndex - 1 + allCandidates.length) % allCandidates.length;
    }
    
    setCandidateDrawer(allCandidates[newIndex]);
  };

  const handleSendAvailability = async (slots) => {
    try {
      // Send email to candidate with job title
      await DB.sendAvailabilityEmail(availabilityPopup.candidate, slots, availabilityPopup.job.title);

      toast.success(`Availability request sent to ${availabilityPopup.candidate.name}`);
      setAvailabilityPopup(null);
      if (refreshSnapshot) await refreshSnapshot();
    } catch (error) {
      console.error("Error sending availability:", error);
      toast.error("Failed to send availability request");
    }
  };

  const rows = snapshot.applications.map(a => {
    const cand = snapshot.candidates.find(c => c.rh_id === a.rh_id);
    const job = snapshot.jobs.find(j => j.job_id === a.job_id);
    const shouldHighlight = highlightCandidates.includes(cand?.rh_id);
    return { ...a, candidate: cand, job, shouldHighlight };
  }).filter(r => r.candidate && r.job);

  const columns = [
    {
      key: "candidate_name",
      label: "Candidate",
      accessor: r => r.candidate.name,
      render: r => (
        <div className={`flex items-center gap-2.5 ${r.shouldHighlight ? 'animate-highlight-pulse' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
            {r.candidate.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            {/* UPDATED: Make name clickable */}
            <button 
              onClick={() => setCandidateDrawer(r.candidate)} 
              className="font-bold text-blue-600 hover:text-blue-800 underline text-left cursor-pointer"
            >
              {r.candidate.name}
            </button>
            <div className="mono text-[10px] text-slate-700">{r.candidate.rh_id}</div>
          </div>
        </div>
      ),
      sortValue: r => r.candidate.name
    },
    {
      key: "job",
      label: "Job",
      accessor: r => r.job.title,
      render: r => (
        <div className={r.shouldHighlight ? 'animate-highlight-pulse' : ''}>
          <button onClick={() => setJobDrawer(r.job)} className="font-semibold text-blue-700 hover:text-blue-900 underline text-left">
            {r.job.title}
          </button>
          <div className="mono text-[10px] text-slate-700">JobSeq: {r.job.job_seq || '-'} | Job code: {r.job.requisition_code}</div>
        </div>
      ),
      filterValue: r => r.job.title
    },
    {
      key: "current_round",
      label: "Round",
      render: r => (
        <span className={`inline-block px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-300 text-xs font-semibold rounded ${r.shouldHighlight ? 'animate-highlight-pulse' : ''}`}>
          {r.current_round}
        </span>
      ),
      filterValue: r => r.current_round
    },
    {
      key: "match_score",
      label: "Match %",
      render: r => {
        const color = r.match_score >= 85 ? "emerald" : r.match_score >= 70 ? "blue" : r.match_score >= 15 ? "amber" : "red";
        const colors = {
          emerald: "bg-emerald-50 text-emerald-900 border-emerald-300",
          blue: "bg-blue-50 text-blue-900 border-blue-300",
          amber: "bg-amber-50 text-amber-900 border-amber-300",
          red: "bg-red-50 text-red-900 border-red-300"
        };
        return (
          <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded border ${colors[color]} ${r.shouldHighlight ? 'animate-highlight-pulse' : ''}`}>
            {r.match_score}%
          </span>
        );
      },
      sortValue: r => r.match_score,
      filterValue: r => {
        if (r.match_score >= 85) return "85-100";
        if (r.match_score >= 70) return "70-84";
        if (r.match_score >= 50) return "50-69";
        if (r.match_score >= 15) return "15-49";
        return "<15";
      }
    },
    {
      key: "applied_at",
      label: "Applied",
      render: r => <span className={`text-xs text-slate-800 ${r.shouldHighlight ? 'animate-highlight-pulse' : ''}`}>{formatDate(r.applied_at)}</span>,
      filterValue: r => { const d = new Date(r.applied_at + "T00:00:00"); const day = d.getDate(); const months = ["January","February","March","April","May","June","July","August","September","October","November","December"]; return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`; }
    },
    {
      key: "resume",
      label: "Resume",
      sortable: false,
      filterable: false,
      render: r => {
        const jobSkills = snapshot.job_required_skill.filter(s => s.job_id === r.job_id);
        return (
          <div className={`flex items-center gap-1.5 ${r.shouldHighlight ? 'animate-highlight-pulse' : ''}`}>
            <button
              onClick={() => setPreviewFor({ candidate: r.candidate, application: r, job: r.job, jobSkills })}
              className="p-1.5 bg-blue-50 border border-blue-300 text-blue-800 hover:bg-blue-100 rounded"
              title="Preview CV"
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => {
                downloadResumePDF(r.candidate, r, r.job, jobSkills);
                toast.success(`Resume downloaded: ${r.candidate.name}_${r.candidate.rh_id}_Resume.pdf`);
              }}
              className="p-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded"
              title="Download CV"
            >
              <Download size={14} />
            </button>
          </div>
        );
      }
    },
    {
      key: "availability",
      label: "Actions",
      sortable: false,
      filterable: false,
      render: r => (
        <div className={r.shouldHighlight ? 'animate-highlight-pulse' : ''}>
          <button
            onClick={() => setAvailabilityPopup({ candidate: r.candidate, job: r.job })}
            className="px-3 py-1.5 bg-indigo-50 border border-indigo-300 text-indigo-800 hover:bg-indigo-100 rounded flex items-center gap-1.5 text-xs font-semibold transition"
            title="Request Availability"
          >
            <Calendar size={14} />
            Request Availability
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <style>{`
        @keyframes highlight-pulse {
          0%, 100% {
            background-color: rgba(59, 130, 246, 0.1);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          50% {
            background-color: rgba(59, 130, 246, 0.25);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          }
        }
        .animate-highlight-pulse {
          animation: highlight-pulse 1.5s ease-in-out 2;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
        }
      `}</style>
      
      <DataTable
        rows={rows}
        columns={columns}
        searchPlaceholder="Search by name, RH ID, job, JobSeq, or Job code..."
        searchableFields={[
          r => r.candidate.name,
          r => r.candidate.rh_id,
          r => r.job.title,
          r => r.job.requisition_code,
          r => r.job.job_seq || ''
        ]}
        emptyMessage="No candidates found"
        rowKey={r => `${r.rh_id}-${r.job_id}`}
      />
      
      {jobDrawer && <JobDrawer job={jobDrawer} snapshot={snapshot} onClose={() => setJobDrawer(null)} />}
      {candidateDrawer && (
        <CandidateDrawer 
          candidate={candidateDrawer} 
          snapshot={snapshot} 
          onClose={() => setCandidateDrawer(null)}
          onNavigate={handleCandidateNavigation}
        />
      )}
      {previewFor && <ResumePreview {...previewFor} onClose={() => setPreviewFor(null)} />}
      {availabilityPopup && (
        <CandidateAvailabilityPopup
          candidate={availabilityPopup.candidate}
          job={availabilityPopup.job}
          onClose={() => setAvailabilityPopup(null)}
          onSend={handleSendAvailability}
        />
      )}
    </div>
  );
}
