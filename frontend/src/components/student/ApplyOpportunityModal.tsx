import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Send, FileText, Link, Loader2, AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Opportunity } from "../../types/opportunity";

import { API_BASE_URL } from "../../config/api";

interface ApplyOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  onSuccess?: () => void;
}

export const ApplyOpportunityModal: React.FC<ApplyOpportunityModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset form and error state whenever modal is opened or target opportunity changes
  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setCoverLetter("");
      setResumeUrl("");
    }
  }, [isOpen, opportunity?.id]);

  if (!isOpen || !opportunity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) {
      setError("Authentication session expired. Please sign in again.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/student/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          coverLetter: coverLetter.trim() || undefined,
          resumeUrl: resumeUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 409) {
          throw new Error("You have already applied to this opportunity.");
        }
        throw new Error(data.message || "Failed to submit application.");
      }

      setSuccessMsg("Application submitted successfully!");
      setCoverLetter("");
      setResumeUrl("");

      setTimeout(() => {
        onSuccess?.();
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
              {opportunity.company_logo ? (
                <img
                  src={opportunity.company_logo}
                  alt={opportunity.company_name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                (opportunity.company_name || "C").charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Apply for {opportunity.title}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Building2 size={12} className="text-indigo-400" />
                {opportunity.company_name || "Verified Industry Partner"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* COVER LETTER */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText size={14} className="text-indigo-400" />
              Cover Letter / Statement of Interest
            </label>
            <textarea
              rows={5}
              placeholder="Introduce yourself, highlight relevant projects, and explain why you're a great fit for this position..."
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all resize-none"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>

          {/* RESUME LINK / URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Link size={14} className="text-indigo-400" />
              Resume Link / Document URL
            </label>
            <input
              type="url"
              placeholder="https://drive.google.com/... or https://linkedin.com/in/... or PDF link"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
            />
            <p className="text-[11px] text-slate-500">
              Provide a accessible Google Drive, Portfolio, or Cloud link to your latest resume.
            </p>
          </div>

          {/* SUMMARY RECAP */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Position Type:</span>
              <span className="font-semibold text-slate-200 uppercase">{opportunity.type}</span>
            </div>
            <div className="flex justify-between">
              <span>Work Mode:</span>
              <span className="font-semibold text-slate-200">{opportunity.work_mode}</span>
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send size={14} /> Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
