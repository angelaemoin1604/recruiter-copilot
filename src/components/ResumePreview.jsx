// ResumePreview.jsx
import { X, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { previewResumePDF, downloadResumePDF } from "../pdf.js";
import { useToast } from "./Toast.jsx";

export default function ResumePreview({ candidate, application, job, jobSkills, onClose }) {
  const [pdfData, setPdfData] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const data = previewResumePDF(candidate, application, job, jobSkills);
    setPdfData(data);
  }, [candidate, application, job, jobSkills]);

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/70 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col pointer-events-auto animate-pop-in">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-t-xl">
            <div>
              <h3 className="font-bold text-lg">{candidate.name} · Resume Preview</h3>
              <p className="text-xs text-slate-300 mono">{candidate.rh_id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  downloadResumePDF(candidate, application, job, jobSkills);
                  toast.success(`✅ Resume downloaded: ${candidate.name}_${candidate.rh_id}_Resume.pdf`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded"
              >
                <Download size={12} /> Download PDF
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-white/15 rounded"><X size={16} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-slate-100" style={{ minHeight: '70vh' }}>
            {pdfData ? (
              <iframe
                src={pdfData}
                className="w-full border-2 border-slate-300 rounded"
                style={{ height: '70vh', minHeight: '500px' }}
                title="Resume preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-700">
                Generating preview...
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
