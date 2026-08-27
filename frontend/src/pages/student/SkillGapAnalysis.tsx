import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Brain,
  RotateCw,
  Loader2,
  AlertCircle,
  Sparkles,
  Filter,
  BarChart2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { SkillAssessment } from "../../components/student/SkillAssessment";
import { API_BASE_URL } from "../../config/api";

interface SkillGapItem {
  skillId: number;
  skillName: string;
  category: string;
  opportunityCount: number;
  requiredProficiency: number;
  studentProficiency: number;
  hasSkill: boolean;
  gapScore: number;
  status: "Strong" | "Needs Improvement" | "Critical Gap";
  recommendation: string;
}

interface GapAnalysisSummary {
  overallReadinessPercentage: number;
  totalDemandedSkills: number;
  strongCount: number;
  needsImprovementCount: number;
  criticalGapCount: number;
  unpossessedDemandedCount: number;
  assessedSkillsCount: number;
}

const SkillGapAnalysisPage: React.FC = () => {
  const { token } = useAuth();

  const [summary, setSummary] = useState<GapAnalysisSummary | null>(null);
  const [skills, setSkills] = useState<SkillGapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Inline assessment modal
  const [activeAssessmentSkill, setActiveAssessmentSkill] = useState<{
    skillId: number;
    skillName: string;
  } | null>(null);

  const fetchGapAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(`${API_BASE_URL}/student/skill-gap-analysis`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch skill gap analysis.");
      }

      setSummary(data.summary);
      setSkills(Array.isArray(data.skills) ? data.skills : []);
    } catch (err: any) {
      console.error("fetchGapAnalysis error:", err);
      setError(err.message || "Could not load skill gap analysis data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchGapAnalysis();
  }, [fetchGapAnalysis]);

  const categories = Array.from(new Set(skills.map((s) => s.category).filter(Boolean)));

  const filteredSkills = skills.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* HEADER / HERO CARD */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
                <BarChart2 size={32} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Real-time Skill Benchmark & Readiness
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mt-0.5">
                  Skill Gap Analysis
                </h1>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Evaluate your verified skill proficiency against real live demand from active industry job opportunities.
                </p>
              </div>
            </div>

            <button
              onClick={fetchGapAnalysis}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer shrink-0"
            >
              <RotateCw size={15} className={loading ? "animate-spin text-indigo-400" : ""} />
              Refresh Analytics
            </button>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
            <Loader2 className="animate-spin text-indigo-400" size={36} />
            <p className="text-slate-400 text-sm font-medium">Calculating skill gap matrices from database...</p>
          </div>
        ) : summary && (
          <>
            {/* OVERVIEW STATS METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* OVERALL READINESS */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Overall Readiness
                  </span>
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-slate-100">
                    {summary.overallReadinessPercentage}%
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${summary.overallReadinessPercentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Industry benchmark fit score based on live hiring requirements.
                  </p>
                </div>
              </div>

              {/* STRONG SKILLS */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Strong / Meets Demand
                  </span>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-emerald-400">
                    {summary.strongCount}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Skills where your proficiency matches or exceeds industry demand.
                  </p>
                </div>
              </div>

              {/* NEEDS IMPROVEMENT */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Needs Improvement
                  </span>
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-amber-400">
                    {summary.needsImprovementCount}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Slightly below target proficiency for active listings.
                  </p>
                </div>
              </div>

              {/* CRITICAL GAPS */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                    Critical Skill Gaps
                  </span>
                  <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                    <HelpCircle size={18} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-extrabold text-rose-400">
                    {summary.criticalGapCount}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {summary.unpossessedDemandedCount} required skills not yet assessed or acquired.
                  </p>
                </div>
              </div>
            </div>

            {/* FILTERS AND SKILLS LIST */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Industry Skill Benchmark Matrix</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time comparison of your verified score vs. active job posting requirements.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-800/50 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
                    <Filter size={14} className="text-indigo-400" />
                    <select
                      className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all" className="bg-slate-900">All Statuses</option>
                      <option value="strong" className="bg-slate-900">Strong / Meets Demand</option>
                      <option value="needs improvement" className="bg-slate-900">Needs Improvement</option>
                      <option value="critical gap" className="bg-slate-900">Critical Gap</option>
                    </select>
                  </div>

                  {categories.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-slate-800/50 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs">
                      <select
                        className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <option value="all" className="bg-slate-900">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {filteredSkills.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Brain size={36} className="mx-auto text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-300">No skill gaps match your filter.</p>
                  <p className="text-xs mt-1">Try selecting a different status or category filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSkills.map((item, idx) => {
                    // Curated soothing theme card variants for distinct visual separation
                    const cardVariants = [
                      "bg-gradient-to-r from-slate-950/80 via-indigo-950/20 to-slate-950/80 border-l-4 border-l-indigo-500 border-slate-800/90 hover:border-indigo-500/50 shadow-md hover:shadow-indigo-500/5",
                      "bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-slate-950/80 border-l-4 border-l-cyan-500 border-slate-800/90 hover:border-cyan-500/50 shadow-md hover:shadow-cyan-500/5",
                      "bg-gradient-to-r from-slate-950/80 via-blue-950/20 to-slate-950/80 border-l-4 border-l-purple-500 border-slate-800/90 hover:border-purple-500/50 shadow-md hover:shadow-purple-500/5",
                      "bg-gradient-to-r from-slate-950/80 via-emerald-950/15 to-slate-950/80 border-l-4 border-l-emerald-500 border-slate-800/90 hover:border-emerald-500/50 shadow-md hover:shadow-emerald-500/5",
                    ];
                    const variantStyle = cardVariants[idx % cardVariants.length];

                    return (
                      <div
                        key={item.skillId}
                        className={`p-5 rounded-xl transition-all duration-300 space-y-3.5 backdrop-blur-md border-t border-r border-b ${variantStyle}`}
                      >
                      {/* TOP ROW: Skill Name, Category, Opportunity count, Status badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-base font-bold text-slate-100">{item.skillName}</h4>
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-md text-[10px] font-semibold uppercase">
                            {item.category}
                          </span>
                          <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-md text-[10px] font-bold">
                            Demanded in {item.opportunityCount} {item.opportunityCount === 1 ? 'Opportunity' : 'Opportunities'}
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-self-start sm:inline-self-auto ${
                            item.status === "Strong"
                              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                              : item.status === "Needs Improvement"
                              ? "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                              : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                          }`}
                        >
                          {item.status === "Strong" && "✓ Meets Industry Demand"}
                          {item.status === "Needs Improvement" && "⚡ Needs Improvement"}
                          {item.status === "Critical Gap" && "⚠ Critical Skill Gap"}
                        </span>
                      </div>

                      {/* COMPARISON PROGRESS BARS */}
                      <div className="space-y-2 pt-1">
                        {/* Student Score Bar */}
                        <div>
                          <div className="flex justify-between text-xs mb-1 font-medium">
                            <span className="text-slate-400 flex items-center gap-1">
                              Your Verified Score:
                            </span>
                            <span className="text-indigo-400 font-bold">
                              {item.hasSkill ? `${item.studentProficiency}%` : "Not Assessed (0%)"}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-700 ${
                                item.status === "Strong"
                                  ? "bg-emerald-500"
                                  : item.status === "Needs Improvement"
                                  ? "bg-amber-500"
                                  : "bg-rose-500"
                              }`}
                              style={{ width: `${item.studentProficiency}%` }}
                            />
                          </div>
                        </div>

                        {/* Industry Required Bar */}
                        <div>
                          <div className="flex justify-between text-xs mb-1 font-medium">
                            <span className="text-slate-400 flex items-center gap-1">
                              Industry Average Target:
                            </span>
                            <span className="text-cyan-400 font-bold">{item.requiredProficiency}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-cyan-500/80 h-2 rounded-full transition-all duration-700"
                              style={{ width: `${item.requiredProficiency}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* ACTION RECOMMENDATION & TAKE ASSESSMENT BUTTON */}
                      <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2 text-xs text-slate-300">
                          <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                          <span>{item.recommendation}</span>
                        </div>

                        <button
                          onClick={() =>
                            setActiveAssessmentSkill({
                              skillId: item.skillId,
                              skillName: item.skillName,
                            })
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer shrink-0"
                        >
                          <Award size={14} /> Take Skill Assessment
                        </button>
                      </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* INLINE SKILL ASSESSMENT MODAL */}
        {activeAssessmentSkill && (
          <SkillAssessment
            skillId={activeAssessmentSkill.skillId}
            skillName={activeAssessmentSkill.skillName}
            onClose={() => setActiveAssessmentSkill(null)}
            onComplete={() => {
              setActiveAssessmentSkill(null);
              fetchGapAnalysis();
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default SkillGapAnalysisPage;
