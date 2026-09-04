import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  BookOpen,
  Award,
  Clock,
  Sparkles,
  CheckCircle2,
  Code,
  Brain,
  Cloud,
  Shield,
  Search,
  RotateCw,
  ChevronRight,
  Briefcase,
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  Flame,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";
import { SkillAssessment } from "../../components/student/SkillAssessment";

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessonsCount: number;
  topics: string[];
  status?: "not_started" | "in_progress" | "completed";
  progressPct?: number;
}

export interface LearningPath {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours: number;
  alignedRole: string;
  icon: string;
  modules: LearningModule[];
  overallProgress?: number;
}

export interface StudentActivity {
  id: string;
  userId: number;
  userName: string;
  type: "skill_verification" | "certificate" | "project" | "learning_module" | "application";
  title: string;
  detail: string;
  badge?: string;
  timestamp: string;
  iconType: string;
}

const LearningHub: React.FC = () => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<"paths" | "activity" | "skills">("paths");
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [, setActivities] = useState<StudentActivity[]>([]);
  const [stats, setStats] = useState({
    verifiedSkillsCount: 0,
    completedModulesCount: 0,
    certificatesCount: 0,
    estimatedHoursLearned: 0,
  });

  const [, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Selected Path & Module Modal
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState<boolean>(false);
  const [updatingModuleId, setUpdatingModuleId] = useState<string | null>(null);

  // Skill Assessment Modal
  const [activeAssessmentSkill, setActiveAssessmentSkill] = useState<{
    skillId: number;
    skillName: string;
  } | null>(null);

  // Fetch Learning Paths
  const fetchLearningPaths = useCallback(async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    try {
      const res = await fetch(`${API_BASE_URL}/student/learning/paths`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLearningPaths(data.paths || []);
      }
    } catch (err) {
      console.error("fetchLearningPaths error:", err);
    }
  }, [token]);

  // Fetch Student Recent Activities
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    const authToken = token || localStorage.getItem("skillbridge_token");
    try {
      const res = await fetch(`${API_BASE_URL}/student/learning/activities`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load recent student activities.");
      }

      setActivities(data.activities || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error("fetchActivities error:", err);
      setError(err.message || "Could not load learning activities.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLearningPaths();
    fetchActivities();
  }, [fetchLearningPaths, fetchActivities]);

  // Update Module Progress
  const handleUpdateProgress = async (
    pathId: string,
    moduleId: string,
    progressPct: number,
    status?: "not_started" | "in_progress" | "completed"
  ) => {
    setUpdatingModuleId(moduleId);
    const authToken = token || localStorage.getItem("skillbridge_token");
    try {
      const res = await fetch(`${API_BASE_URL}/student/learning/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ pathId, moduleId, progressPct, status }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh paths & activities
        await fetchLearningPaths();
        await fetchActivities();

        // Update selected module local state if open
        if (selectedModule && selectedModule.id === moduleId) {
          setSelectedModule((prev) =>
            prev
              ? {
                  ...prev,
                  progressPct,
                  status: status || (progressPct === 100 ? "completed" : "in_progress"),
                }
              : null
          );
        }
      }
    } catch (err) {
      console.error("handleUpdateProgress error:", err);
    } finally {
      setUpdatingModuleId(null);
    }
  };

  // Icon Resolver
  const getPathIcon = (iconName: string) => {
    switch (iconName) {
      case "code":
        return <Code size={24} className="text-cyan-400" />;
      case "brain":
        return <Brain size={24} className="text-purple-400" />;
      case "cloud":
        return <Cloud size={24} className="text-indigo-400" />;
      case "shield":
        return <Shield size={24} className="text-emerald-400" />;
      default:
        return <BookOpen size={24} className="text-amber-400" />;
    }
  };

  // Filter paths
  const filteredPaths = learningPaths.filter((path) => {
    return (
      !searchTerm.trim() ||
      path.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      path.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      path.alignedRole.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* TOP HERO & STATS BANNER */}
        <div className="relative overflow-hidden bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-semibold text-amber-400 mb-3">
                <Sparkles size={14} />
                <span>Personalized Career Accelerator</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
                  SkillBridge Learning Hub
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-black tracking-widest uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg shadow-md animate-pulse">
                  BETA
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Explore industry-aligned learning paths, track real-time student activity feed, and verify key technical competencies to boost your career match.
              </p>
            </div>

            {/* STATS COUNTER CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-center shadow-lg">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Clock size={14} className="text-cyan-400" />
                  <span>Hours Learned</span>
                </div>
                <span className="text-xl font-bold text-slate-100">
                  {stats.estimatedHoursLearned}h
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-center shadow-lg">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                  <BookOpen size={14} className="text-purple-400" />
                  <span>Modules</span>
                </div>
                <span className="text-xl font-bold text-slate-100">
                  {stats.completedModulesCount}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-center shadow-lg">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Award size={14} className="text-amber-400" />
                  <span>Verified Skills</span>
                </div>
                <span className="text-xl font-bold text-amber-400">
                  {stats.verifiedSkillsCount}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-center shadow-lg">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Flame size={14} className="text-rose-400" />
                  <span>Active Streak</span>
                </div>
                <span className="text-xl font-bold text-rose-400">7 Days</span>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS & SEARCH BAR */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-slate-950/60 border border-slate-800/80 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab("paths")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "paths"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <BookOpen size={16} />
              <span>Learning Paths</span>
            </button>

            <button
              onClick={() => setActiveTab("skills")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "skills"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Award size={16} />
              <span>Skill Verification</span>
            </button>
          </div>

          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === "paths"
                  ? "Search learning paths by title, role, or technology..."
                  : activeTab === "activity"
                  ? "Search student activities by name, assessment, or certificate..."
                  : "Search skills to verify..."
              }
              className="w-full bg-slate-800/50 border border-slate-700/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-10 pr-4 py-2 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: LEARNING PATHS */}
        {activeTab === "paths" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPaths.map((path) => (
              <div
                key={path.id}
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-indigo-500/40 rounded-3xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* PATH HEADER */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl shrink-0">
                        {getPathIcon(path.icon)}
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                          {path.category}
                        </span>
                        <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                          {path.title}
                        </h3>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border shrink-0 ${
                        path.difficulty === "Beginner"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : path.difficulty === "Intermediate"
                          ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                          : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                      }`}
                    >
                      {path.difficulty}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {path.description}
                  </p>

                  {/* PATH METADATA */}
                  <div className="grid grid-cols-2 gap-3 py-3 px-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl text-xs text-slate-300 mb-5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} className="text-indigo-400" />
                      <span>{path.estimatedHours} hours total</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <Briefcase size={14} className="text-amber-400" />
                      <span className="truncate">{path.alignedRole}</span>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="space-y-1.5 mb-5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-400">Path Completion</span>
                      <span className="text-amber-400 font-bold">
                        {path.overallProgress || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full transition-all duration-500"
                        style={{ width: `${path.overallProgress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* MODULES LIST PREVIEW */}
                  <div className="space-y-2 mb-6">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Modules ({path.modules.length})
                    </h4>

                    {path.modules.map((mod, idx) => (
                      <div
                        key={mod.id}
                        onClick={() => {
                          setSelectedPath(path);
                          setSelectedModule(mod);
                          setIsModuleModalOpen(true);
                        }}
                        className="p-3 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              mod.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : mod.status === "in_progress"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {mod.status === "completed" ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              idx + 1
                            )}
                          </div>

                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                              {mod.title}
                            </h5>
                            <span className="text-[11px] text-slate-400">
                              {mod.duration} • {mod.lessonsCount} lessons
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {mod.status === "completed" ? (
                            <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold rounded-md border border-emerald-500/20">
                              Done
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] bg-indigo-500/10 text-indigo-400 font-semibold rounded-md border border-indigo-500/20">
                              {mod.progressPct ? `${mod.progressPct}%` : "Start"}
                            </span>
                          )}
                          <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}



        {/* TAB 3: SKILL VERIFICATION MATRIX */}
        {activeTab === "skills" && (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">
                Skill Verification Assessments
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Take quick technical assessments to verify your skills. Verified skills boost your Career Match score for industry internships and jobs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 1, name: "React.js", category: "Frontend", level: "Intermediate" },
                { id: 2, name: "Node.js", category: "Backend", level: "Advanced" },
                { id: 3, name: "Python", category: "Data & AI", level: "Intermediate" },
                { id: 4, name: "TypeScript", category: "Languages", level: "Intermediate" },
                { id: 5, name: "MySQL & Database Engineering", category: "Databases", level: "Beginner" },
                { id: 6, name: "Docker & Containerization", category: "DevOps", level: "Intermediate" },
              ].map((skill) => (
                <div
                  key={skill.id}
                  className="p-5 bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {skill.category}
                      </span>
                      <span className="text-[11px] text-slate-400">{skill.level}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-100">{skill.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      10 multiple choice questions • Timed 15 mins
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setActiveAssessmentSkill({ skillId: skill.id, skillName: skill.name })
                    }
                    className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Award size={14} /> Start Verification Test
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE DETAILS MODAL */}
        {selectedPath && selectedModule && isModuleModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
              <button
                onClick={() => setIsModuleModalOpen(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-1.5 rounded-xl bg-slate-800/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
                  <BookOpen size={24} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    {selectedPath.title}
                  </span>
                  <h3 className="text-xl font-bold text-slate-100 mt-0.5">
                    {selectedModule.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedModule.description}
              </p>

              {/* MODULE TOPICS */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Key Topics Covered
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedModule.topics.map((t, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs bg-slate-800 text-slate-300 rounded-xl border border-slate-700/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() =>
                    handleUpdateProgress(
                      selectedPath.id,
                      selectedModule.id,
                      selectedModule.status === "completed" ? 0 : 100,
                      selectedModule.status === "completed" ? "not_started" : "completed"
                    )
                  }
                  disabled={updatingModuleId === selectedModule.id}
                  className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedModule.status === "completed"
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                  }`}
                >
                  {updatingModuleId === selectedModule.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : selectedModule.status === "completed" ? (
                    <>
                      <RotateCw size={16} /> Reset Module
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Mark as 100% Completed
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Close & Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SKILL ASSESSMENT MODAL */}
        {activeAssessmentSkill && (
          <SkillAssessment
            skillId={activeAssessmentSkill.skillId}
            skillName={activeAssessmentSkill.skillName}
            onClose={() => setActiveAssessmentSkill(null)}
            onComplete={() => {
              setActiveAssessmentSkill(null);
              fetchActivities();
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default LearningHub;
