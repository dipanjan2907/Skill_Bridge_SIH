import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  Building2,
  Users,
  Brain,
  Briefcase,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  Loader2,
  RotateCw,
  CheckCircle2,
  Award,
  BarChart3,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";

interface DashboardData {
  institution: {
    id: number;
    name: string;
    code: string;
    location: string;
    website: string;
  };
  overview: {
    totalStudents: number;
    completedProfiles: number;
    completedProfilesPercentage: number;
    assessedStudents: number;
    assessedStudentsPercentage: number;
    industryReadyStudents: number;
    industryReadyPercentage: number;
    internshipStudents: number;
    internshipPercentage: number;
    placedStudents: number;
    placedPercentage: number;
  };
  skillReadiness: {
    ready: { count: number; percentage: number };
    developing: { count: number; percentage: number };
    needsImprovement: { count: number; percentage: number };
  };
  skillDemandVsSupply: Array<{
    skillId: number;
    skillName: string;
    category: string;
    opportunityCount: number;
    industryDemandPercentage: number;
    avgRequiredProficiency: number;
    studentCount: number;
    studentCoveragePercentage: number;
    avgStudentProficiency: number;
    gapDelta: number;
    isCriticalGap: boolean;
  }>;
  skillsToPrioritize: Array<{
    skillId: number;
    skillName: string;
    category: string;
    priority: "High" | "Medium" | "Moderate";
    priorityScore: number;
    industryDemandPercentage: number;
    studentCount: number;
    studentCoveragePercentage: number;
    avgRequiredProficiency: number;
    avgStudentProficiency: number;
    gapDelta: number;
    reason: string;
  }>;
  institutionalActions: string[];
  topIndustrySkills: Array<{
    skillId: number;
    skillName: string;
    category: string;
    demandCount: number;
    demandPercentage: number;
    avgRequiredProficiency: number;
  }>;
  topStudentSkills: Array<{
    skillId: number;
    skillName: string;
    category: string;
    studentCount: number;
    studentPercentage: number;
    avgProficiency: number;
  }>;
  internships: {
    totalApplications: number;
    totalApplicants: number;
    applied: number;
    shortlisted: number;
    selected: number;
    rejected: number;
    participatingStudents: number;
    participationRate: number;
  };
  placements: {
    totalApplications: number;
    totalApplicants: number;
    applied: number;
    shortlisted: number;
    selected: number;
    rejected: number;
    placedStudents: number;
    placementRate: number;
  };
  demandedSkills: Array<{
    skillId: number;
    skillName: string;
    category: string;
    demandCount: number;
    avgRequiredProficiency: number;
  }>;
  studentSkillInsights: Array<{
    skillId: number;
    skillName: string;
    category: string;
    industryDemandCount: number;
    avgRequiredProficiency: number;
    avgStudentProficiency: number;
    studentCount: number;
    gap: number;
    status: "Strong" | "Developing" | "Curriculum Gap";
  }>;
  students: Array<{
    studentProfileId: number;
    userId: number;
    name: string;
    email: string;
    degree: string;
    department: string;
    cgpa: number | null;
    currentSem: string;
    assessedSkillsCount: number;
    avgProficiency: number;
    verificationStatus?: string;
  }>;
}

const InstitutionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(`${API_BASE_URL}/institution/dashboard`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load institution dashboard data.",
        );
      }

      setData(result);
      setLastRefreshed(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    } catch (err: any) {
      console.error("InstitutionDashboard fetch error:", err);
      setError(err.message || "Unable to retrieve dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !data) {
    return (
      <MainLayout showRightPanel={false}>
        <div className="w-full max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2
            className="animate-spin text-amber-600 dark:text-indigo-400"
            size={44}
          />
          <p className="text-stone-600 dark:text-slate-400 font-medium text-sm">
            Calculating institutional skill metrics & real-time industry
            analytics...
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 text-stone-900 dark:text-slate-100">
        {/* HEADER HERO CARD */}
        <div className="bg-stone-200/70 border border-stone-300/80 dark:bg-slate-900/80 dark:border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-md dark:shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-amber-600/10 border border-amber-600/20 text-amber-700 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400 rounded-2xl shrink-0">
                <Building2 size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-amber-700/10 border border-amber-700/20 text-amber-800 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300 font-bold text-[11px] rounded-full uppercase tracking-wider">
                    {data?.institution.code || "INSTITUTION"}
                  </span>
                  <span className="text-xs text-stone-600 dark:text-slate-400 font-medium flex items-center gap-1">
                    <ShieldCheck
                      size={13}
                      className="text-emerald-600 dark:text-emerald-400"
                    />{" "}
                    Authenticated Institutional Portal
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-stone-900 dark:text-slate-100 mt-1">
                  {data?.institution.name ||
                    "Institution Smart Analytics Dashboard"}
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-400 mt-0.5">
                  Automated institutional intelligence connecting student skill
                  development, industry demand, and curriculum alignment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {lastRefreshed && (
                <span className="text-xs text-stone-500 dark:text-slate-400 hidden sm:inline-block font-medium">
                  Refreshed: {lastRefreshed}
                </span>
              )}
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-stone-300/80 hover:bg-stone-300 text-stone-800 border-stone-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold dark:border-slate-700 border transition-all cursor-pointer shadow-sm"
              >
                <RotateCw
                  size={14}
                  className={
                    loading
                      ? "animate-spin text-amber-600 dark:text-indigo-400"
                      : ""
                  }
                />
                Refresh Telemetry
              </button>
            </div>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle
              size={18}
              className="text-rose-600 dark:text-rose-400 shrink-0"
            />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <>
            {/* 1. REQUIRED INSTITUTION KPIs (5 CORE METRICS) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Metric 1: Total Students */}
              <div className="bg-stone-200/60 border border-stone-300/80 dark:bg-slate-900/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-amber-600/40 dark:hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                    Total Students
                  </span>
                  <div className="p-2 bg-amber-600/10 text-amber-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-xl">
                    <Users size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-black text-stone-900 dark:text-slate-100">
                    {data.overview.totalStudents.toLocaleString()}
                  </span>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                    <GraduationCap
                      size={12}
                      className="text-amber-600 dark:text-indigo-400"
                    />
                    Enrolled Students
                  </p>
                </div>
              </div>

              {/* Metric 2: Assessed Students */}
              <div className="bg-stone-200/60 border border-stone-300/80 dark:bg-slate-900/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-cyan-600/40 dark:hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                    Assessed
                  </span>
                  <div className="p-2 bg-cyan-600/10 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 rounded-xl">
                    <Brain size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-stone-900 dark:text-slate-100">
                      {data.overview.assessedStudents}
                    </span>
                    <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-400">
                      ({data.overview.assessedStudentsPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-300 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-cyan-600 dark:bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${data.overview.assessedStudentsPercentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Metric 3: Industry Ready Students */}
              <div className="bg-stone-200/60 border border-stone-300/80 dark:bg-slate-900/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-emerald-600/40 dark:hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                    Industry Ready
                  </span>
                  <div className="p-2 bg-emerald-600/10 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl">
                    <Award size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-stone-900 dark:text-slate-100">
                      {data.overview.industryReadyStudents}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                      ({data.overview.industryReadyPercentage}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                    <TrendingUp
                      size={12}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                    ≥75% Proficiency Score
                  </p>
                </div>
              </div>

              {/* Metric 4: Internship Participation */}
              <div className="bg-stone-200/60 border border-stone-300/80 dark:bg-slate-900/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-indigo-600/40 dark:hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                    Internships
                  </span>
                  <div className="p-2 bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-xl">
                    <GraduationCap size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-stone-900 dark:text-slate-100">
                      {data.overview.internshipStudents}
                    </span>
                    <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400">
                      ({data.overview.internshipPercentage}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                    <Briefcase
                      size={12}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                    Participating Students
                  </p>
                </div>
              </div>

              {/* Metric 5: Placement Progress */}
              <div className="bg-stone-200/60 border border-stone-300/80 dark:bg-slate-900/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-purple-600/40 dark:hover:border-purple-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                    Placed
                  </span>
                  <div className="p-2 bg-purple-600/10 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-xl">
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-stone-900 dark:text-slate-100">
                      {data.overview.placedStudents}
                    </span>
                    <span className="text-xs font-extrabold text-purple-700 dark:text-purple-400">
                      ({data.overview.placedPercentage}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-medium">
                    <Award
                      size={12}
                      className="text-purple-600 dark:text-purple-400"
                    />
                    Full-Time Corporate Offers
                  </p>
                </div>
              </div>
            </div>

            {/* 2. SMART AUTOMATION: "WHAT SHOULD WE TEACH?" & PRIORITIZED SKILLS */}
            <div className="bg-stone-200/70 border border-stone-300/80 dark:bg-slate-900/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-300 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-600/10 text-amber-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-xl shrink-0">
                    <Zap size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-stone-900 dark:text-slate-100">
                        Smart Automation: What Should We Teach?
                      </h2>
                      <span className="px-2 py-0.5 bg-amber-600/10 text-amber-800 border border-amber-600/30 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                        Institutional Priority Engine
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-slate-400 mt-0.5">
                      Automated algorithm calculating institutional priority
                      scores based on Industry Demand + Student Coverage Gaps.
                    </p>
                  </div>
                </div>
              </div>

              {/* Priority Skills Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.skillsToPrioritize.map((item, idx) => (
                  <div
                    key={item.skillId}
                    className="p-4 bg-stone-100/90 border border-stone-300/90 dark:bg-slate-950/60 dark:border-slate-800/80 rounded-xl space-y-3 shadow-xs hover:border-amber-600/40 dark:hover:border-indigo-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center bg-stone-300 dark:bg-slate-800 text-stone-700 dark:text-slate-300 rounded-full font-bold text-xs">
                          {idx + 1}
                        </span>
                        <h3 className="font-extrabold text-sm text-stone-900 dark:text-slate-100">
                          {item.skillName}
                        </h3>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          item.priority === "High"
                            ? "bg-rose-500/15 text-rose-700 border border-rose-500/30 dark:text-rose-400"
                            : item.priority === "Medium"
                              ? "bg-amber-500/15 text-amber-700 border border-amber-500/30 dark:text-amber-400"
                              : "bg-stone-300 text-stone-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {item.priority} Priority ({item.priorityScore}/100)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-1 bg-stone-200/50 dark:bg-slate-900/50 p-2.5 rounded-lg text-xs">
                      <div>
                        <span className="text-[10px] text-stone-500 dark:text-slate-400 block font-semibold">
                          Industry Demand
                        </span>
                        <strong className="text-amber-700 dark:text-indigo-400 font-extrabold">
                          {item.industryDemandPercentage}%
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 dark:text-slate-400 block font-semibold">
                          Student Coverage
                        </span>
                        <strong className="text-cyan-700 dark:text-cyan-400 font-extrabold">
                          {item.studentCoveragePercentage}% ({item.studentCount}{" "}
                          students)
                        </strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-600 dark:text-slate-400 leading-relaxed font-medium bg-stone-200/30 dark:bg-slate-900/30 p-2 rounded-md">
                      💡 {item.reason}
                    </p>
                  </div>
                ))}
              </div>

              {/* ACTIONABLE RECOMMENDATIONS BOX */}
              <div className="p-4 bg-amber-600/5 border border-amber-600/20 dark:bg-indigo-500/10 dark:border-indigo-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-indigo-300 uppercase tracking-wider">
                  <Sparkles size={15} /> Recommended Institutional Curriculum
                  Actions
                </div>
                <ul className="space-y-1.5 pt-1">
                  {data.institutionalActions.map((action, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-stone-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <ChevronRight
                        size={14}
                        className="text-amber-600 dark:text-indigo-400 shrink-0 mt-0.5"
                      />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 3. SKILL DEMAND VS STUDENT SUPPLY COMPARISON */}
            <div className="bg-stone-200/70 border border-stone-300/80 dark:bg-slate-900/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-300 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-600/10 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 rounded-xl">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-slate-100">
                      Skill Demand vs Student Supply Analysis
                    </h2>
                    <p className="text-xs text-stone-600 dark:text-slate-400">
                      Direct comparison of industry hiring demand percentage
                      against student coverage & proficiency.
                    </p>
                  </div>
                </div>
              </div>

              {data.skillDemandVsSupply.length === 0 ? (
                <div className="py-8 text-center text-stone-500 dark:text-slate-400 text-sm bg-stone-100 dark:bg-slate-950/40 rounded-xl border border-stone-300 dark:border-slate-800">
                  No active skill telemetry recorded yet.
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {data.skillDemandVsSupply.map((skill) => (
                    <div
                      key={skill.skillId}
                      className="p-4 bg-stone-100/90 border border-stone-300/90 dark:bg-slate-950/50 dark:border-slate-800/80 rounded-xl space-y-2 hover:border-stone-400 dark:hover:border-slate-700 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-stone-900 dark:text-slate-100">
                            {skill.skillName}
                          </span>
                          <span className="px-2 py-0.5 bg-stone-200 dark:bg-slate-800 text-stone-600 dark:text-slate-400 text-[10px] rounded-md font-semibold">
                            {skill.category}
                          </span>
                          {skill.isCriticalGap && (
                            <span className="px-2 py-0.5 bg-rose-500/15 text-rose-700 border border-rose-500/30 dark:text-rose-400 text-[10px] font-bold rounded-md uppercase">
                              ⚠ Critical Gap
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-stone-600 dark:text-slate-400 text-xs">
                          <span>
                            Students Assessed:{" "}
                            <strong className="text-stone-900 dark:text-slate-200">
                              {skill.studentCount} (
                              {skill.studentCoveragePercentage}%)
                            </strong>
                          </span>
                          <span>
                            Avg Student Prof:{" "}
                            <strong className="text-cyan-700 dark:text-cyan-400">
                              {skill.avgStudentProficiency}%
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Demand vs Supply Visual Bars */}
                      <div className="space-y-1.5 pt-1">
                        {/* Industry Demand Bar */}
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="w-28 font-bold text-amber-800 dark:text-indigo-400 shrink-0">
                            Industry Demand
                          </span>
                          <div className="w-full bg-stone-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${skill.industryDemandPercentage}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-right font-extrabold text-amber-800 dark:text-indigo-400">
                            {skill.industryDemandPercentage}%
                          </span>
                        </div>

                        {/* Student Supply Bar */}
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="w-28 font-bold text-cyan-700 dark:text-cyan-400 shrink-0">
                            Student Supply
                          </span>
                          <div className="w-full bg-stone-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-cyan-600 dark:bg-cyan-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${skill.studentCoveragePercentage}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-right font-extrabold text-cyan-700 dark:text-cyan-400">
                            {skill.studentCoveragePercentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. TOP INDUSTRY SKILLS VS TOP STUDENT SKILLS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Industry Skills */}
              <div className="bg-stone-200/70 border border-stone-300/80 dark:bg-slate-900/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-300 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-600/10 text-amber-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-xl">
                      <Briefcase size={18} />
                    </div>
                    <h2 className="text-base font-bold text-stone-900 dark:text-slate-100">
                      Top Industry Demanded Skills
                    </h2>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {data.topIndustrySkills.map((sk) => (
                    <div
                      key={sk.skillId}
                      className="p-3 bg-stone-100 dark:bg-slate-950/40 border border-stone-300 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-stone-900 dark:text-slate-100 block">
                          {sk.skillName}
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-slate-400">
                          {sk.category} • Target Required:{" "}
                          {sk.avgRequiredProficiency}%
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-600/10 text-amber-800 border border-amber-600/20 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 font-extrabold rounded-lg">
                        {sk.demandCount} Opportunities
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Student Skills */}
              <div className="bg-stone-200/70 border border-stone-300/80 dark:bg-slate-900/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-300 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-600/10 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 rounded-xl">
                      <GraduationCap size={18} />
                    </div>
                    <h2 className="text-base font-bold text-stone-900 dark:text-slate-100">
                      Top Student Possessed Skills
                    </h2>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {data.topStudentSkills.map((sk) => (
                    <div
                      key={sk.skillId}
                      className="p-3 bg-stone-100 dark:bg-slate-950/40 border border-stone-300 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-stone-900 dark:text-slate-100 block">
                          {sk.skillName}
                        </span>
                        <span className="text-[10px] text-stone-500 dark:text-slate-400">
                          {sk.category} • Avg Student Score: {sk.avgProficiency}
                          %
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-cyan-600/10 text-cyan-800 border border-cyan-600/20 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30 font-extrabold rounded-lg">
                        {sk.studentCount} Students
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. INTERNSHIP & PLACEMENT FUNNEL PIPELINES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Internship Pipeline */}
              <div className="bg-stone-200/70 border border-stone-300/80 dark:bg-slate-900/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-300 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-600/10 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-xl">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-stone-900 dark:text-slate-100">
                        Internship Participation
                      </h2>
                      <p className="text-xs text-stone-600 dark:text-slate-400">
                        Real-time student internship application metrics.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-stone-800 bg-stone-300 dark:text-slate-200 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    {data.internships.totalApplications} Applications
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 size={16} /> Selected / Hired Interns
                    </div>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                      {data.internships.selected}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-800 dark:text-cyan-300">
                      <Award size={16} /> Shortlisted
                    </div>
                    <span className="text-sm font-black text-cyan-700 dark:text-cyan-400">
                      {data.internships.shortlisted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-stone-100 dark:bg-slate-800/50 border border-stone-300 dark:border-slate-700/60 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-slate-300">
                      <Briefcase
                        size={16}
                        className="text-amber-600 dark:text-indigo-400"
                      />{" "}
                      Pending Review
                    </div>
                    <span className="text-sm font-black text-stone-900 dark:text-slate-200">
                      {data.internships.applied}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                      <AlertCircle size={16} /> Not Selected
                    </div>
                    <span className="text-sm font-black text-rose-700 dark:text-rose-400">
                      {data.internships.rejected}
                    </span>
                  </div>
                </div>
              </div>

              {/* Placement Pipeline */}
              <div className="bg-stone-200/70 border border-stone-300/80 dark:bg-slate-900/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-300 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-600/10 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 rounded-xl">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-stone-900 dark:text-slate-100">
                        Placement Progress
                      </h2>
                      <p className="text-xs text-stone-600 dark:text-slate-400">
                        Corporate recruitment telemetry & offer acceptances.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-stone-800 bg-stone-300 dark:text-slate-200 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    {data.placements.totalApplications} Applications
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 size={16} /> Offers Extended / Placed
                    </div>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                      {data.placements.selected}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300">
                      <Award size={16} /> Shortlisted / Interviewing
                    </div>
                    <span className="text-sm font-black text-purple-700 dark:text-purple-400">
                      {data.placements.shortlisted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-stone-100 dark:bg-slate-800/50 border border-stone-300 dark:border-slate-700/60 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-slate-300">
                      <Briefcase
                        size={16}
                        className="text-amber-600 dark:text-indigo-400"
                      />{" "}
                      Under Evaluation
                    </div>
                    <span className="text-sm font-black text-stone-900 dark:text-slate-200">
                      {data.placements.applied}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                      <AlertCircle size={16} /> Not Selected
                    </div>
                    <span className="text-sm font-black text-rose-700 dark:text-rose-400">
                      {data.placements.rejected}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. STUDENT COHORT ROSTER */}
            <div className="bg-stone-200/70 border border-stone-300/80 dark:bg-slate-900/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-300 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-600/10 text-amber-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-xl">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-slate-100">
                      Enrolled Student Cohort Roster
                    </h2>
                    <p className="text-xs text-stone-600 dark:text-slate-400">
                      Verified student profiles enrolled under{" "}
                      {data.institution.name}.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-700 bg-stone-300 dark:text-slate-300 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    {data.students.length} Enrolled
                  </span>
                  <button
                    onClick={() => navigate("/institution/students")}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-700 dark:bg-indigo-600 hover:bg-amber-800 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-md"
                  >
                    View All Directory <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {data.students.length === 0 ? (
                <div className="py-8 text-center text-stone-500 dark:text-slate-400 text-sm bg-stone-100 dark:bg-slate-950/40 rounded-xl border border-stone-300 dark:border-slate-800">
                  No students currently enrolled under this institution.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-300 dark:border-slate-800 text-stone-600 dark:text-slate-400 uppercase tracking-wider font-bold">
                        <th className="py-3 px-3">Student Name</th>
                        <th className="py-3 px-3">Degree & Dept</th>
                        <th className="py-3 px-3">CGPA</th>
                        <th className="py-3 px-3">Assessed Skills</th>
                        <th className="py-3 px-3">Avg Proficiency</th>
                        <th className="py-3 px-3 text-center">Readiness</th>
                        <th className="py-3 px-3 text-right">Student Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-300/60 dark:divide-slate-800/60 text-stone-800 dark:text-slate-300">
                      {data.students.map((st) => (
                        <tr
                          key={st.studentProfileId}
                          onClick={() => navigate(`/institution/students?studentId=${st.studentProfileId}`)}
                          className="hover:bg-stone-300/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-3 font-bold text-stone-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {st.name}
                            <span className="block text-[10px] text-stone-500 dark:text-slate-400 font-normal">
                              {st.email}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="font-semibold text-stone-900 dark:text-slate-200">
                              {st.degree}
                            </span>
                            <span className="block text-[10px] text-stone-500 dark:text-slate-400">
                              {st.department} • Sem {st.currentSem}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-extrabold text-stone-900 dark:text-slate-100">
                            {st.cgpa !== null ? st.cgpa.toFixed(2) : "N/A"}
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-stone-800 dark:text-slate-300">
                            {st.assessedSkillsCount} Skills
                          </td>
                          <td className="py-3.5 px-3 font-bold text-cyan-700 dark:text-cyan-400">
                            {st.avgProficiency}%
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                st.avgProficiency >= 75
                                  ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 dark:text-emerald-400"
                                  : st.avgProficiency >= 50
                                    ? "bg-cyan-500/15 text-cyan-700 border border-cyan-500/30 dark:text-cyan-400"
                                    : "bg-amber-500/15 text-amber-700 border border-amber-500/30 dark:text-amber-400"
                              }`}
                            >
                              {st.avgProficiency >= 75
                                ? "Ready"
                                : st.avgProficiency >= 50
                                  ? "Developing"
                                  : "Needs Review"}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/institution/students?studentId=${st.studentProfileId}`);
                              }}
                              className="px-2.5 py-1 bg-amber-600/10 dark:bg-indigo-500/10 text-amber-800 dark:text-indigo-300 border border-amber-600/20 dark:border-indigo-500/30 hover:bg-amber-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default InstitutionDashboard;
