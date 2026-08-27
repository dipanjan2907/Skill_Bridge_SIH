import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Calendar,
  MapPin,
  IndianRupee,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import { API_BASE_URL } from "../../config/api";

interface StudentApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number | null;
}

export const StudentApplicationDetailModal: React.FC<
  StudentApplicationDetailModalProps
> = ({ isOpen, onClose, applicationId }) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appDetail, setAppDetail] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !applicationId) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      const authToken = token || localStorage.getItem("skillbridge_token");

      try {
        const res = await fetch(
          `${API_BASE_URL}/student/applications/${applicationId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load application details.",
          );
        }

        setAppDetail(data.application);
      } catch (err: any) {
        console.error("fetchDetail error:", err);
        setError(err.message || "Unable to fetch application details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, applicationId, token]);

  if (!isOpen || !applicationId) return null;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "shortlisted":
        return (
          <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-full uppercase tracking-wider">
            Shortlisted
          </span>
        );
      case "selected":
        return (
          <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-full uppercase tracking-wider">
            Selected 🎉
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-full uppercase tracking-wider">
            Not Selected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold text-xs rounded-full uppercase tracking-wider">
            Applied
          </span>
        );
    }
  };

  const formatStipend = (
    min: number | null,
    max: number | null,
    type: string,
  ) => {
    if (!min && !max) return "Disclosed on interview";
    const unit = type === "internship" ? "/month" : "/annum";
    if (min && max)
      return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${unit}`;
    if (min) return `From ₹${min.toLocaleString()} ${unit}`;
    if (max) return `Up to ₹${max.toLocaleString()} ${unit}`;
    return "Disclosed on interview";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div>
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              Application Tracker
            </span>
            <h2 className="text-lg font-bold text-slate-100">
              Application Details
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="animate-spin text-indigo-400" size={32} />
              <span className="text-xs text-slate-400 font-medium">
                Loading details...
              </span>
            </div>
          ) : error || !appDetail ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
              <AlertCircle size={18} className="text-rose-400 shrink-0" />
              <span>{error || "Details unavailable"}</span>
            </div>
          ) : (
            <>
              {/* STATUS & COMPANY CARD */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                    {appDetail.opportunity?.industry?.logo ? (
                      <img
                        src={appDetail.opportunity.industry.logo}
                        alt={appDetail.opportunity.industry.companyName}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      (appDetail.opportunity?.industry?.companyName || "C")
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      {appDetail.opportunity?.title}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Building2 size={13} className="text-indigo-400" />
                      {appDetail.opportunity?.industry?.companyName ||
                        "Verified Partner"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {renderStatusBadge(appDetail.status)}
                </div>
              </div>

              {/* DATES & METRICS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Applied On
                  </span>
                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                    <Calendar size={13} className="text-indigo-400" />
                    {new Date(appDetail.appliedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Work Location
                  </span>
                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                    <MapPin size={13} className="text-indigo-400" />
                    {appDetail.opportunity?.workMode}{" "}
                    {appDetail.opportunity?.location
                      ? `• ${appDetail.opportunity.location}`
                      : ""}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                    Compensation
                  </span>
                  <span className="text-slate-200 font-medium flex items-center gap-1.5">
                    <IndianRupee size={13} className="text-emerald-400" />
                    {formatStipend(
                      appDetail.opportunity?.stipendMin,
                      appDetail.opportunity?.stipendMax,
                      appDetail.opportunity?.type,
                    )}
                  </span>
                </div>
              </div>

              {/* COVER LETTER */}
              {appDetail.coverLetter && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileText size={14} className="text-indigo-400" /> Submitted
                    Cover Letter
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl whitespace-pre-line">
                    {appDetail.coverLetter}
                  </p>
                </div>
              )}

              {/* RESUME LINK
              {appDetail.resumeUrl && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ExternalLink size={14} className="text-indigo-400" /> Resume / Attachment
                  </h4>
                  <a
                    href={appDetail.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl text-xs text-indigo-300 hover:text-indigo-200 font-medium transition-all"
                  >
                    <ExternalLink size={13} /> View Submitted Resume Link
                  </a>
                </div>
              )} */}

              {/* REQUIRED SKILLS BENCHMARKS */}
              {appDetail.opportunity?.requiredSkills &&
                appDetail.opportunity.requiredSkills.length > 0 && (
                  <div className="space-y-2.5 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-400" /> Role
                      Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {appDetail.opportunity.requiredSkills.map(
                        (s: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-slate-800 border border-slate-700/60 rounded-lg text-xs font-medium text-slate-300 flex items-center gap-1.5"
                          >
                            <CheckCircle2
                              size={12}
                              className="text-emerald-400"
                            />
                            {s.skill_name || `Skill #${s.skill_id}`} (≥
                            {s.required_proficiency}%)
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
