import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  User,
  Mail,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Award,
  Sparkles,
  Users,
  RotateCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

import { API_BASE_URL } from "../../config/api";

interface IndustryApplicantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: number | null;
  opportunityTitle?: string;
}

export const IndustryApplicantsModal: React.FC<IndustryApplicantsModalProps> = ({
  isOpen,
  onClose,
  opportunityId,
  opportunityTitle,
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [applications, setApplications] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchApplicants = useCallback(async () => {
    if (!opportunityId) return;
    setLoading(true);
    setError(null);
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(
        `${API_BASE_URL}/industry/opportunities/${opportunityId}/applications`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load applicants.");
      }

      setApplications(Array.isArray(data.applications) ? data.applications : []);
    } catch (err: any) {
      console.error("fetchApplicants error:", err);
      setError(err.message || "Could not fetch applicants.");
    } finally {
      setLoading(false);
    }
  }, [opportunityId, token]);

  useEffect(() => {
    if (isOpen && opportunityId) {
      fetchApplicants();
    }
  }, [isOpen, opportunityId, fetchApplicants]);

  const handleUpdateStatus = async (appId: number, newStatus: string) => {
    setUpdatingId(appId);
    setError(null);
    setSuccessMsg(null);
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(
        `${API_BASE_URL}/industry/applications/${appId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status.");
      }

      setSuccessMsg(`Applicant status updated to '${newStatus}'.`);
      await fetchApplicants();
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: any) {
      console.error("handleUpdateStatus error:", err);
      setError(err.message || "Error updating application status.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isOpen || !opportunityId) return null;

  const filteredApps = applications.filter((a) => {
    if (statusFilter === "all") return true;
    return a.status === statusFilter;
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "shortlisted":
        return (
          <span className="px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[11px] rounded-full uppercase tracking-wider">
            Shortlisted
          </span>
        );
      case "selected":
        return (
          <span className="px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] rounded-full uppercase tracking-wider">
            Selected
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-[11px] rounded-full uppercase tracking-wider">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold text-[11px] rounded-full uppercase tracking-wider">
            Applied
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Users size={22} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
                Applicant Management
              </span>
              <h2 className="text-lg font-bold text-slate-100">
                {opportunityTitle ? `Applicants: ${opportunityTitle}` : "Applicant List"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchApplicants()}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium"
              title="Refresh applicants list"
            >
              <RotateCw size={15} className={loading ? "animate-spin text-indigo-400" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* FEEDBACK MESSAGES */}
        {(error || successMsg) && (
          <div className="px-6 pt-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle size={16} className="text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* FILTER BAR */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-2">
            Filter:
          </span>

          <button
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800"
            }`}
            onClick={() => setStatusFilter("all")}
          >
            All ({applications.length})
          </button>

          <button
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "applied"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800"
            }`}
            onClick={() => setStatusFilter("applied")}
          >
            Applied ({applications.filter((a) => a.status === "applied").length})
          </button>

          <button
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "shortlisted"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800"
            }`}
            onClick={() => setStatusFilter("shortlisted")}
          >
            Shortlisted ({applications.filter((a) => a.status === "shortlisted").length})
          </button>

          <button
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "selected"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800"
            }`}
            onClick={() => setStatusFilter("selected")}
          >
            Selected ({applications.filter((a) => a.status === "selected").length})
          </button>

          <button
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === "rejected"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800"
            }`}
            onClick={() => setStatusFilter("rejected")}
          >
            Rejected ({applications.filter((a) => a.status === "rejected").length})
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="animate-spin text-indigo-400" size={36} />
              <span className="text-xs text-slate-400 font-medium">
                Fetching applicants for this opportunity...
              </span>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <User size={40} className="mx-auto text-slate-600" />
              <p className="font-semibold text-slate-300 text-sm">No Applicants Found</p>
              <span className="text-xs text-slate-500">
                {statusFilter === "all"
                  ? "No students have applied to this opportunity yet."
                  : `No applicants matching status '${statusFilter}'.`}
              </span>
            </div>
          ) : (
            filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-all"
              >
                {/* APPLICANT HEADER */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 text-base">
                      {(app.student?.name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-100">
                          {app.student?.name || "Student"}
                        </h4>
                        {renderStatusBadge(app.status)}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <Mail size={12} className="text-slate-500" />
                        {app.student?.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5 shrink-0">
                    <Clock size={13} className="text-amber-400" />
                    Applied: {new Date(app.appliedAt).toLocaleDateString("en-IN")}
                  </div>
                </div>

                {/* ACADEMIC INFO */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Institution
                    </span>
                    <strong className="text-slate-200 block truncate">
                      {app.student?.institution || "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Program / Degree
                    </span>
                    <strong className="text-slate-200 block truncate">
                      {[app.student?.degree, app.student?.department]
                        .filter(Boolean)
                        .join(" • ") || "N/A"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      CGPA Score
                    </span>
                    <strong className="text-emerald-400 block font-bold">
                      {app.student?.cgpa ? `${app.student.cgpa} / 10.0` : "Not specified"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Semester
                    </span>
                    <strong className="text-slate-200 block">
                      {app.student?.currentSem || "N/A"}
                    </strong>
                  </div>
                </div>

                {/* VERIFIED SKILLS */}
                {app.student?.skills && app.student.skills.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={11} className="text-indigo-400" /> Student Verified Skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {app.student.skills.map((s: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-800 border border-slate-700/60 rounded-md text-[11px] text-slate-300 flex items-center gap-1 font-medium"
                        >
                          <Award size={11} className="text-emerald-400" />
                          {s.skill_name}: {s.proficiency_score}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* COVER LETTER & RESUME */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  {app.coverLetter && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <FileText size={12} className="text-indigo-400" /> Cover Letter:
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-lg border border-slate-800/60 whitespace-pre-line">
                        {app.coverLetter}
                      </p>
                    </div>
                  )}

                  {app.resumeUrl && (
                    <div className="pt-1">
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <ExternalLink size={13} /> View Applicant Resume
                      </a>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Status Workflow Action
                  </span>

                  <div className="flex items-center gap-2">
                    {updatingId === app.id ? (
                      <span className="text-xs text-indigo-400 flex items-center gap-1 font-medium">
                        <Loader2 size={14} className="animate-spin" /> Updating...
                      </span>
                    ) : (
                      <>
                        {app.status === "applied" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(app.id, "shortlisted")}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 size={13} /> Shortlist
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(app.id, "rejected")}
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}

                        {app.status === "shortlisted" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(app.id, "selected")}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 size={13} /> Select Candidate
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(app.id, "rejected")}
                              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}

                        {app.status === "selected" && (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                            <CheckCircle2 size={13} /> Candidate Selected
                          </span>
                        )}

                        {app.status === "rejected" && (
                          <span className="text-xs text-rose-400 font-bold flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-lg">
                            <XCircle size={13} /> Application Rejected
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
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
