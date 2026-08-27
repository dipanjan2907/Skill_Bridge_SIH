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
  PieChart,
  ShieldCheck,
  Target,
} from "lucide-react";
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
  };
  skillReadiness: {
    ready: { count: number; percentage: number };
    developing: { count: number; percentage: number };
    needsImprovement: { count: number; percentage: number };
  };
  internships: {
    totalApplications: number;
    applied: number;
    shortlisted: number;
    selected: number;
    rejected: number;
  };
  placements: {
    totalApplications: number;
    applied: number;
    shortlisted: number;
    selected: number;
    rejected: number;
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
  }>;
}

const InstitutionDashboard: React.FC = () => {
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
        throw new Error(result.message || "Failed to load institution dashboard data.");
      }

      setData(result);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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
        <div className="w-full max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-indigo-400" size={42} />
          <p className="text-slate-400 font-medium text-sm">
            Fetching institution student analytics & placement telemetry...
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* HEADER HERO CARD */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
                <Building2 size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] rounded-full uppercase tracking-wider">
                    {data?.institution.code || "INSTITUTION"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-400" /> Authenticated Portal
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-100 mt-1">
                  {data?.institution.name || "Institution Intelligence Dashboard"}
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Real-time analytics for student skill readiness, placement pipelines, and curriculum demand alignment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {lastRefreshed && (
                <span className="text-xs text-slate-400 hidden sm:inline-block">
                  Updated: {lastRefreshed}
                </span>
              )}
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer shadow-md"
              >
                <RotateCw size={14} className={loading ? "animate-spin text-indigo-400" : ""} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* OVERVIEW KPI CARDS */}
        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Registered Students */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Students
                  </span>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Users size={20} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-extrabold text-slate-100">
                    {data.overview.totalStudents.toLocaleString()}
                  </span>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <GraduationCap size={12} className="text-indigo-400" />
                    Enrolled at {data.institution.code}
                  </p>
                </div>
              </div>

              {/* Profile Completion */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Profiles Completed
                  </span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <CheckCircle2 size={20} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-100">
                      {data.overview.completedProfiles}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      ({data.overview.completedProfilesPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.overview.completedProfilesPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Assessed Students */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Skills Assessed
                  </span>
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                    <Brain size={20} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-100">
                      {data.overview.assessedStudents}
                    </span>
                    <span className="text-xs font-bold text-cyan-400">
                      ({data.overview.assessedStudentsPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.overview.assessedStudentsPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Industry Ready Students */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Industry Ready
                  </span>
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                    <Award size={20} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-100">
                      {data.skillReadiness.ready.count}
                    </span>
                    <span className="text-xs font-bold text-purple-400">
                      ({data.skillReadiness.ready.percentage}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <TrendingUp size={12} className="text-purple-400" />
                    ≥75% Proficiency Benchmark
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: SKILL READINESS BREAKDOWN */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <PieChart size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">
                      Student Skill Readiness Index
                    </h2>
                    <p className="text-xs text-slate-400">
                      Automated classification based on verified student skill assessment evaluations.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
                  Backend Evaluation Threshold
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Ready */}
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Ready (≥75%)
                    </span>
                    <span className="text-sm font-extrabold text-emerald-300">
                      {data.skillReadiness.ready.count} Students
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.skillReadiness.ready.percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {data.skillReadiness.ready.percentage}% of cohort meets high-priority job placement standards.
                  </p>
                </div>

                {/* Developing */}
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Developing (50% - 74%)
                    </span>
                    <span className="text-sm font-extrabold text-cyan-300">
                      {data.skillReadiness.developing.count} Students
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.skillReadiness.developing.percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {data.skillReadiness.developing.percentage}% of cohort requires targeted intermediate skill enhancement.
                  </p>
                </div>

                {/* Needs Improvement */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Needs Improvement (&lt;50%)
                    </span>
                    <span className="text-sm font-extrabold text-amber-300">
                      {data.skillReadiness.needsImprovement.count} Students
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.skillReadiness.needsImprovement.percentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {data.skillReadiness.needsImprovement.percentage}% of cohort requires foundational training or assessment completion.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3: INTERNSHIP & PLACEMENT PIPELINES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Internship Participation Statistics */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-100">
                        Internship Pipeline
                      </h2>
                      <p className="text-xs text-slate-400">
                        Applications and hiring funnel for student internships.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-slate-200 bg-slate-800 px-3 py-1 rounded-lg">
                    {data.internships.totalApplications} Total Apps
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Selected */}
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 size={16} /> Selected / Hired
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400">
                      {data.internships.selected}
                    </span>
                  </div>

                  {/* Shortlisted */}
                  <div className="flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                      <Award size={16} /> Shortlisted
                    </div>
                    <span className="text-sm font-extrabold text-cyan-400">
                      {data.internships.shortlisted}
                    </span>
                  </div>

                  {/* Applied */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Briefcase size={16} className="text-indigo-400" /> Pending Review
                    </div>
                    <span className="text-sm font-extrabold text-slate-200">
                      {data.internships.applied}
                    </span>
                  </div>

                  {/* Rejected */}
                  <div className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                      <AlertCircle size={16} /> Not Selected
                    </div>
                    <span className="text-sm font-extrabold text-rose-400">
                      {data.internships.rejected}
                    </span>
                  </div>
                </div>
              </div>

              {/* Full-Time Placement Statistics */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-100">
                        Full-Time Job Placements
                      </h2>
                      <p className="text-xs text-slate-400">
                        Corporate recruitment telemetry and offer acceptance statistics.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-slate-200 bg-slate-800 px-3 py-1 rounded-lg">
                    {data.placements.totalApplications} Total Apps
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Selected / Placed */}
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 size={16} /> Offers Extended / Placed
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400">
                      {data.placements.selected}
                    </span>
                  </div>

                  {/* Shortlisted */}
                  <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                      <Award size={16} /> Shortlisted / Interviewing
                    </div>
                    <span className="text-sm font-extrabold text-purple-400">
                      {data.placements.shortlisted}
                    </span>
                  </div>

                  {/* Pending Review */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Briefcase size={16} className="text-indigo-400" /> Under Evaluation
                    </div>
                    <span className="text-sm font-extrabold text-slate-200">
                      {data.placements.applied}
                    </span>
                  </div>

                  {/* Rejected */}
                  <div className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
                      <AlertCircle size={16} /> Not Selected
                    </div>
                    <span className="text-sm font-extrabold text-rose-400">
                      {data.placements.rejected}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: MOST DEMANDED INDUSTRY SKILLS */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">
                      Most Demanded Industry Skills
                    </h2>
                    <p className="text-xs text-slate-400">
                      Aggregated demand frequencies calculated directly from live industry job listings.
                    </p>
                  </div>
                </div>
              </div>

              {data.demandedSkills.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm bg-slate-950/40 rounded-xl border border-slate-800">
                  No active industry opportunities recorded yet.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {data.demandedSkills.map((sk) => {
                    const maxDemand = Math.max(...data.demandedSkills.map((d) => d.demandCount), 1);
                    const percentWidth = Math.round((sk.demandCount / maxDemand) * 100);

                    return (
                      <div
                        key={sk.skillId}
                        className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2 hover:border-indigo-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{sk.skillName}</span>
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded-md font-medium">
                              {sk.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 text-xs">
                            <span>Req Prof: <strong className="text-slate-200">{sk.avgRequiredProficiency}%</strong></span>
                            <span className="font-extrabold text-indigo-400">
                              {sk.demandCount} {sk.demandCount === 1 ? "Listing" : "Listings"}
                            </span>
                          </div>
                        </div>

                        {/* Bar chart representation - soft, dimmer elegant colors */}
                        <div className="w-full bg-slate-800/90 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                          <div
                            className="bg-gradient-to-r from-indigo-900/80 via-slate-700/80 to-indigo-600/50 h-full rounded-full transition-all duration-500 opacity-85"
                            style={{ width: `${percentWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 5: INSTITUTION STUDENT SKILL INSIGHTS & GAP MATRIX */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Target size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">
                      Curriculum & Student Skill Gap Matrix
                    </h2>
                    <p className="text-xs text-slate-400">
                      Comparison of industry required benchmarks against actual student proficiency at {data.institution.name}.
                    </p>
                  </div>
                </div>
              </div>

              {data.studentSkillInsights.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm bg-slate-950/40 rounded-xl border border-slate-800">
                  No skill evaluation data recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Skill / Technology</th>
                        <th className="py-3 px-3">Industry Demand</th>
                        <th className="py-3 px-3">Target Required</th>
                        <th className="py-3 px-3">Student Avg Proficiency</th>
                        <th className="py-3 px-3">Gap Delta</th>
                        <th className="py-3 px-3 text-right">Strategic Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {data.studentSkillInsights.map((insight) => (
                        <tr key={insight.skillId} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-3 font-bold text-slate-100">
                            {insight.skillName}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {insight.category} • {insight.studentCount} Students Assessed
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-300">
                            {insight.industryDemandCount} active roles
                          </td>
                          <td className="py-3.5 px-3 font-bold text-indigo-400">
                            {insight.avgRequiredProficiency}%
                          </td>
                          <td className="py-3.5 px-3 font-bold text-cyan-400">
                            {insight.avgStudentProficiency}%
                          </td>
                          <td className="py-3.5 px-3">
                            {insight.gap > 0 ? (
                              <span className="text-amber-400 font-bold">-{insight.gap}%</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">Aligned (+{Math.abs(insight.gap)}%)</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                insight.status === "Strong"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : insight.status === "Developing"
                                  ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {insight.status}
                            </span>
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
