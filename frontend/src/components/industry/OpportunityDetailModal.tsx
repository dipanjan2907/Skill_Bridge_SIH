import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  Sparkles,
  Send,
  Target,
  Loader2,
  Award,
} from "lucide-react";
import type { Opportunity } from "../../types/opportunity";
import type { OpportunityMatchData } from "../../types/matching";
import { useAuth } from "../../context/AuthContext";
import { ApplyOpportunityModal } from "../student/ApplyOpportunityModal";
import { SkillAssessment } from "../student/SkillAssessment";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../../config/api";

interface OpportunityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
  onApplicationSuccess?: () => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  onApplicationSuccess,
}) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [matchData, setMatchData] = useState<OpportunityMatchData | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);

  // Active skill assessment state
  const [activeAssessmentSkill, setActiveAssessmentSkill] = useState<{
    skillId: number;
    skillName: string;
  } | null>(null);

  const storedUserStr = localStorage.getItem("skillbridge_user");
  let storedUserRole = "";
  try {
    storedUserRole = storedUserStr ? JSON.parse(storedUserStr).role : "";
  } catch (_e) {}
  
  const effectiveRole = (user?.role || storedUserRole || "student").toString().toLowerCase();
  const userRole = effectiveRole;
  const isStudentView = effectiveRole === "student" || effectiveRole === "admin" || window.location.pathname.includes("student");

  // Fetch student application status and match score breakdown
  const fetchMatchAndStatus = useCallback(async () => {
    if (!opportunity || !isStudentView) return;

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setLoadingMatch(true);
    try {
      const res = await fetch(`${API_BASE_URL}/student/opportunities/${opportunity.id}/match`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMatchData(data);
        setHasApplied(Boolean(data.hasApplied));
      }
    } catch (err) {
      console.error("Error fetching match data:", err);
    } finally {
      setLoadingMatch(false);
    }
  }, [opportunity, isStudentView, token]);

  const handleApplySuccess = () => {
    setHasApplied(true);
    fetchMatchAndStatus();
    onApplicationSuccess?.();
  };

  const handleAssessmentComplete = () => {
    setActiveAssessmentSkill(null);
    fetchMatchAndStatus();
  };

  useEffect(() => {
    if (isOpen && opportunity) {
      fetchMatchAndStatus();
    }
  }, [isOpen, opportunity, fetchMatchAndStatus]);

  if (!isOpen || !opportunity) return null;

  const formatStipend = (min: number | null, max: number | null, type: string) => {
    if (!min && !max) return "Not specified";
    const unit = type === "internship" ? "/month" : "/annum";
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${unit}`;
    if (min) return `From ₹${min.toLocaleString()} ${unit}`;
    if (max) return `Up to ₹${max.toLocaleString()} ${unit}`;
    return "Not specified";
  };

  const isDeadlinePassed = () => {
    if (!opportunity.application_deadline) return false;
    const deadline = new Date(opportunity.application_deadline);
    deadline.setHours(23, 59, 59, 999);
    return new Date() > deadline;
  };



  const getMatchCategoryBadge = (category: string, score: number | null) => {
    if (score === null || category === "Match Unavailable") {
      return (
        <span className="px-3 py-1 bg-slate-800 text-slate-400 font-semibold text-xs rounded-full border border-slate-700">
          Match Unavailable
        </span>
      );
    }

    if (category === "Incomplete Profile") {
      return (
        <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold text-xs rounded-full">
          Incomplete Profile
        </span>
      );
    }

    if (score >= 80) {
      return (
        <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-full">
          🎯 {score}% Match • {category}
        </span>
      );
    } else if (score >= 65) {
      return (
        <span className="px-3 py-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold text-xs rounded-full">
          🎯 {score}% Match • {category}
        </span>
      );
    } else if (score >= 50) {
      return (
        <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs rounded-full">
          🎯 {score}% Match • {category}
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-full">
          🎯 {score}% Match • {category}
        </span>
      );
    }
  };

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[9999] overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100 relative my-auto">
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    opportunity.type === "internship"
                      ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
                      : "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                  }`}
                >
                  {opportunity.type === "internship" ? (
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap size={13} /> Internship
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Briefcase size={13} /> Full-Time Job
                    </span>
                  )}
                </span>

                {opportunity.status === "published" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Published
                  </span>
                )}

                {/* STUDENT MATCH SCORE BADGE IN HEADER */}
                {userRole === "student" && matchData && (
                  <div>{getMatchCategoryBadge(matchData.matchCategory, matchData.matchScore)}</div>
                )}
              </div>

              <h2 className="text-xl font-bold text-slate-100">{opportunity.title}</h2>
              {opportunity.company_name && (
                <p className="text-xs text-indigo-400 font-semibold">{opportunity.company_name}</p>
              )}
            </div>

            <button
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {/* METRICS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0">
                  <small className="text-[10px] uppercase font-bold text-slate-500 block">
                    Mode / City
                  </small>
                  <strong className="text-xs text-slate-200 block truncate">
                    {opportunity.work_mode} {opportunity.location ? `• ${opportunity.location}` : ""}
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0">
                  <IndianRupee size={18} />
                </div>
                <div className="min-w-0">
                  <small className="text-[10px] uppercase font-bold text-slate-500 block">
                    Compensation
                  </small>
                  <strong className="text-xs text-slate-200 block truncate">
                    {formatStipend(opportunity.stipend_min, opportunity.stipend_max, opportunity.type)}
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shrink-0">
                  <Clock size={18} />
                </div>
                <div className="min-w-0">
                  <small className="text-[10px] uppercase font-bold text-slate-500 block">
                    Duration
                  </small>
                  <strong className="text-xs text-slate-200 block truncate">
                    {opportunity.duration || "Standard"}
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="min-w-0">
                  <small className="text-[10px] uppercase font-bold text-slate-500 block">
                    Deadline
                  </small>
                  <strong className="text-xs text-slate-200 block truncate">
                    {opportunity.application_deadline
                      ? new Date(opportunity.application_deadline).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Open"}
                  </strong>
                </div>
              </div>
            </div>

            {/* SKILL MATCH BREAKDOWN SECTION FOR STUDENTS */}
            {userRole === "student" && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                      <Target size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        Skill Match Analysis
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Calculated dynamically from your verified skill benchmarks
                      </p>
                    </div>
                  </div>

                  {loadingMatch && <Loader2 size={16} className="animate-spin text-indigo-400" />}
                </div>

                {!matchData?.hasStudentSkills ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-amber-300 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                      <span>
                        Complete your skill profile or take assessments to get personalized match scores.
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        navigate("/student/details");
                      }}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg font-semibold shrink-0 cursor-pointer"
                    >
                      Update Profile
                    </button>
                  </div>
                ) : matchData.requiredSkills.length === 0 ? (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                    No specific skill requirements defined by industry for this opportunity.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Summary Pills */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-medium">
                        ✓ {matchData.summary.matchedSkills} Matched
                      </span>
                      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg font-medium">
                        ◐ {matchData.summary.partialSkills} Partial
                      </span>
                      <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg font-medium">
                        ⚠ {matchData.summary.missingSkills} Missing
                      </span>
                    </div>

                    {/* Skill Breakdown Checklist with Assess Skill Button for EACH Required Skill */}
                    <div className="space-y-2.5 pt-1">
                      {matchData.requiredSkills.map((sk) => (
                        <div
                          key={sk.skillId}
                          className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              {sk.status === "matched" && (
                                <span className="p-1 bg-emerald-500/15 text-emerald-400 rounded-md font-bold">
                                  ✓
                                </span>
                              )}
                              {sk.status === "partial" && (
                                <span className="p-1 bg-amber-500/15 text-amber-400 rounded-md font-bold">
                                  ◐
                                </span>
                              )}
                              {sk.status === "missing" && (
                                <span className="p-1 bg-rose-500/15 text-rose-400 rounded-md font-bold">
                                  ⚠
                                </span>
                              )}
                              <span className="font-bold text-slate-200">{sk.skillName}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-[11px] font-semibold">
                                {sk.status === "matched" && (
                                  <span className="text-emerald-400">
                                    Level: {sk.studentProficiency}% • Req: {sk.requiredProficiency}%
                                  </span>
                                )}
                                {sk.status === "partial" && (
                                  <span className="text-amber-400">
                                    Level: {sk.studentProficiency}% • Req: {sk.requiredProficiency}%
                                  </span>
                                )}
                                {sk.status === "missing" && (
                                  <span className="text-rose-400">
                                    Not Added • Req: {sk.requiredProficiency}%
                                  </span>
                                )}
                              </div>

                              {/* ASSESS SKILL BUTTON FOR EVERY SKILL */}
                              <button
                                onClick={() =>
                                  setActiveAssessmentSkill({
                                    skillId: sk.skillId,
                                    skillName: sk.skillName,
                                  })
                                }
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer border ${
                                  sk.status === "matched"
                                    ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                                    : "bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border-indigo-500/40"
                                }`}
                              >
                                <Award size={12} />
                                {sk.status === "matched" ? "Re-assess" : "Assess Skill"}
                              </button>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
                            <div
                              className={`h-full rounded-full transition-all ${
                                sk.status === "matched"
                                  ? "bg-emerald-400"
                                  : sk.status === "partial"
                                  ? "bg-amber-400"
                                  : "bg-rose-500/40"
                              }`}
                              style={{ width: `${sk.matchPercentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SKILL GAP SUMMARY BANNER */}
                {matchData?.skillsToImprove && matchData.skillsToImprove.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-300">
                      <PieChart size={16} className="text-amber-400 shrink-0" />
                      <span>
                        <strong>Skill Improvement Tip:</strong> Take assessments for{" "}
                        <strong>{matchData.skillsToImprove.map((s) => s.skillName).join(", ")}</strong>{" "}
                        above to increase your match percentage!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ROLE DESCRIPTION */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Role Description
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {opportunity.description}
              </p>
            </div>

            {/* ELIGIBILITY CRITERIA */}
            {opportunity.eligibility && (
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap size={16} className="text-indigo-400" /> Eligibility Criteria
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
                  {opportunity.eligibility}
                </p>
              </div>
            )}

            {/* REQUIRED SKILLS BENCHMARKS FOR INDUSTRY / PUBLIC */}
            {userRole !== "student" && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={16} className="text-indigo-400" /> Required Skill Benchmarks
                </h3>

                {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 ? (
                  <div className="space-y-3">
                    {opportunity.requiredSkills.map((s, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-400" />
                            {s.skill_name || `Skill #${s.skill_id}`}
                          </span>
                          <span className="font-bold text-indigo-400">
                            {s.required_proficiency}% Required
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                            style={{ width: `${s.required_proficiency}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No skill benchmarks specified for this opportunity.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* FOOTER ACTION BUTTONS */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
            <button
              type="button"
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-semibold transition-all border border-slate-700/50 cursor-pointer"
              onClick={onClose}
            >
              Close
            </button>

            {isStudentView && (
              <div>
                {hasApplied ? (
                  <button
                    disabled
                    className="px-5 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed"
                  >
                    <CheckCircle2 size={15} /> Already Applied
                  </button>
                ) : opportunity.status !== "published" ? (
                  <button
                    disabled
                    className="px-5 py-2 bg-slate-800 border border-slate-700 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed"
                  >
                    Applications Closed
                  </button>
                ) : isDeadlinePassed() ? (
                  <button
                    disabled
                    className="px-5 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold cursor-not-allowed"
                  >
                    Deadline Passed
                  </button>
                ) : (
                  <button
                    onClick={() => setIsApplyModalOpen(true)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Send size={15} /> Apply Now
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* APPLY MODAL */}
      <ApplyOpportunityModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        opportunity={opportunity}
        onSuccess={handleApplySuccess}
      />

      {/* LIVE INLINE SKILL ASSESSMENT MODAL */}
      {activeAssessmentSkill && (
        <SkillAssessment
          skillId={activeAssessmentSkill.skillId}
          skillName={activeAssessmentSkill.skillName}
          onClose={() => setActiveAssessmentSkill(null)}
          onComplete={handleAssessmentComplete}
        />
      )}
    </>
  );

  return createPortal(modalContent, document.body);
};
