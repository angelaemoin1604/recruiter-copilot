// ResumePreview.jsx
import { X, Download, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { previewResumePDF, downloadResumePDF } from "../pdf.js";
import { useToast } from "./Toast.jsx";

export default function ResumePreview({ candidate, application, job, jobSkills, onClose }) {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  useEffect(() => {
    // FIX #6: Improved error handling - wrap in try-catch
    setLoading(true);
    setError(null);
    
    try {
      // Validate inputs before generating
      if (!candidate || !application || !job || !jobSkills) {
        throw new Error("Missing required data for PDF generation");
      }
      
      const data = previewResumePDF(candidate, application, job, jobSkills);
      setPdfData(data);
    } catch (err) {
      console.error("PDF generation error:", err);
      setError(err?.message || "Failed to generate PDF preview");
    } finally {
      setLoading(false);
    }
  }, [candidate?.rh_id]);

  const handleDownload = () => {
    try {
      downloadResumePDF(candidate, application, job, jobSkills);
      if (typeof toast?.success === "function") {
        toast.success(`✅ Resume downloaded for ${candidate.name}`);
      } else if (typeof toast === "function") {
        toast(`✅ Resume downloaded for ${candidate.name}`);
      }
    } catch (err) {
      console.error("Download error:", err);
      if (typeof toast?.error === "function") {
        toast.error(`❌ Download failed: ${err?.message || "Unknown error"}`);
      } else if (typeof toast === "function") {
        toast(`❌ Download failed: ${err?.message || "Unknown error"}`);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/70 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[81] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col pointer-events-auto animate-pop-in">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-t-xl">
            <div>
              <h3 className="font-bold text-lg">{candidate.name} · Resume Preview</h3>
              <p className="text-xs text-slate-300 mono">{candidate.rh_id} · {job.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition">
                <Download size={12} /> Download PDF
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-white/15 rounded"><X size={16} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-100" style={{ minHeight: "65vh" }}>
            {loading && (
              <div className="flex items-center justify-center h-full gap-3 text-slate-600">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm font-medium">Generating resume...</span>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                <AlertCircle size={40} className="text-amber-500" />
                <div className="text-center">
                  <div className="font-bold text-slate-900 mb-1">Preview unavailable</div>
                  <div className="text-sm text-slate-600 mb-4">{error}</div>
                  <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg mx-auto">
                    <Download size={14} /> Download PDF instead
                  </button>
                </div>
              </div>
            )}
            {!loading && !error && pdfData && (
              <iframe
                src={pdfData}
                className="w-full border-0"
                style={{ height: "65vh", minHeight: "500px" }}
                title={`${candidate.name} Resume`}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
