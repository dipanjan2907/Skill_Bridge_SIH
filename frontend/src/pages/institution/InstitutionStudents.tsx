import React, { useState, useEffect, useCallback, useMemo } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  Users,
  Search,
  RotateCw,
  Loader2,
  AlertCircle,
  Filter,
  BookOpen,
  X,
  GraduationCap,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";

interface StudentData {
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
}

interface DashboardResponse {
  institution: {
    id: number;
    name: string;
    code: string;
    location: string;
    website: string;
    verification_status?: string;
  };
  students: StudentData[];
}

const InstitutionStudents: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Multi-filter states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedReadiness, setSelectedReadiness] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const handleVerifyStudent = async (studentId: number, status: "approved" | "rejected") => {
    setActionLoadingId(studentId);
    const authToken = token || localStorage.getItem("skillbridge_token");
    try {
      const res = await fetch(`${API_BASE_URL}/institution/students/${studentId}/verification`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        fetchStudentsData();
      } else {
        alert(result.message || "Failed to update student verification status");
      }
    } catch (err: any) {
      alert("Error updating student verification status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const fetchStudentsData = useCallback(async () => {
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
        throw new Error(result.message || "Failed to load enrolled student data.");
      }

      setData(result);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error("InstitutionStudents fetch error:", err);
      setError(err.message || "Unable to retrieve student roster.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStudentsData();
  }, [fetchStudentsData]);

  // Extract unique departments & semesters dynamically from live student data
  const availableDepartments = useMemo(() => {
    if (!data?.students) return [];
    const depts = new Set<string>();
    data.students.forEach((s) => {
      if (s.department && s.department !== "N/A") depts.add(s.department);
    });
    return Array.from(depts).sort();
  }, [data]);

  const availableSemesters = useMemo(() => {
    if (!data?.students) return [];
    const sems = new Set<string>();
    data.students.forEach((s) => {
      if (s.currentSem && s.currentSem !== "N/A") sems.add(s.currentSem);
    });
    return Array.from(sems).sort();
  }, [data]);

  // Simultaneous multi-filtering logic (AND logic)
  const filteredStudents = useMemo(() => {
    return (data?.students || []).filter((st) => {
      // 1. Search term match
      const matchesSearch =
        !searchTerm.trim() ||
        st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.degree.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.department.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Branch / Department match
      if (selectedDepartment !== "all" && st.department !== selectedDepartment) {
        return false;
      }

      // 3. Semester match
      if (selectedSemester !== "all" && st.currentSem !== selectedSemester) {
        return false;
      }

      // 4. Readiness Classification match
      if (selectedReadiness === "ready") {
        if (st.assessedSkillsCount === 0 || st.avgProficiency < 75) return false;
      } else if (selectedReadiness === "developing") {
        if (st.assessedSkillsCount === 0 || st.avgProficiency < 50 || st.avgProficiency >= 75) return false;
      } else if (selectedReadiness === "needs_focus") {
        if (st.assessedSkillsCount === 0 || st.avgProficiency >= 50) return false;
      } else if (selectedReadiness === "unassessed") {
        if (st.assessedSkillsCount > 0) return false;
      }

      return true;
    });
  }, [data, searchTerm, selectedDepartment, selectedSemester, selectedReadiness]);

  // Check if any filter is actively applied
  const isAnyFilterActive =
    searchTerm.trim() !== "" ||
    selectedReadiness !== "all" ||
    selectedDepartment !== "all" ||
    selectedSemester !== "all";

  const resetAllFilters = () => {
    setSearchTerm("");
    setSelectedReadiness("all");
    setSelectedDepartment("all");
    setSelectedSemester("all");
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading && !data) {
    return (
      <MainLayout showRightPanel={false}>
        <div className="w-full max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-indigo-400" size={42} />
          <p className="text-slate-400 font-medium text-sm">
            Retrieving enrolled student details & skill evaluations...
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
                <Users size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold text-[11px] rounded-full uppercase tracking-wider">
                    {data?.institution.code || "INSTITUTION"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Student Roster Telemetry
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-100 mt-1">
                  Enrolled Student Details & Skill DNA
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Detailed roster of students registered under {data?.institution?.name ? data.institution.name : "your institution"}.
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
                onClick={fetchStudentsData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer shadow-md"
              >
                <RotateCw size={14} className={loading ? "animate-spin text-indigo-400" : ""} />
                Refresh Roster
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

        {/* MULTI-FILTER CONTROL BAR */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <Filter size={14} className="text-indigo-400" />
              Multi-Filter Roster Telemetry
            </div>

            {isAnyFilterActive && (
              <button
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <X size={13} />
                Reset All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, degree..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Branch / Department Filter */}
            <div className="relative">
              <GraduationCap size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Branches / Departments</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Filter */}
            <div className="relative">
              <Layers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Semesters</option>
                {availableSemesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            {/* Readiness Classification Filter */}
            <div className="relative">
              <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={selectedReadiness}
                onChange={(e) => setSelectedReadiness(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Skill Readiness</option>
                <option value="ready">Ready (≥75% Avg)</option>
                <option value="developing">Developing (50-74%)</option>
                <option value="needs_focus">Needs Focus (&lt;50%)</option>
                <option value="unassessed">Unassessed</option>
              </select>
            </div>
          </div>
        </div>

        {/* STUDENT ROSTER TABLE */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-400" />
              Student Roster Directory
            </h2>

            <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
              Showing {filteredStudents.length} of {data?.students.length || 0} Students
            </span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
              <p className="font-semibold text-slate-300">No students match your active filter combination.</p>
              <p className="text-xs text-slate-500">Try adjusting or clearing your search, department, semester, or readiness filters.</p>
              {isAnyFilterActive && (
                <button
                  onClick={resetAllFilters}
                  className="mt-2 px-4 py-1.5 bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold hover:bg-indigo-600/50 transition-all cursor-pointer"
                >
                  Clear All Active Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-3">Student Name & Email</th>
                    <th className="py-3.5 px-3">Degree & Department</th>
                    <th className="py-3.5 px-3">Semester</th>
                    <th className="py-3.5 px-3">Verification</th>
                    <th className="py-3.5 px-3">Assessed Skills</th>
                    <th className="py-3.5 px-3">Avg Proficiency</th>
                    <th className="py-3.5 px-3 text-right">Institute Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredStudents.map((st) => {
                    const currentStatus = (st.verificationStatus || "pending").toLowerCase();
                    let vBadge = { text: "Pending Approval", class: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
                    if (currentStatus === "approved") {
                      vBadge = { text: "Verified Student", class: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
                    } else if (currentStatus === "rejected") {
                      vBadge = { text: "Rejected", class: "bg-rose-500/15 text-rose-400 border-rose-500/30" };
                    }

                    return (
                      <tr key={st.studentProfileId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30 shrink-0">
                              {getInitials(st.name)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-100 block">{st.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{st.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-medium text-slate-200 block">{st.degree || "N/A"}</span>
                          <span className="text-[10px] text-slate-400">{st.department || "N/A"}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-medium text-[11px] rounded-md border border-slate-700">
                            {st.currentSem}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${vBadge.class}`}>
                            {vBadge.text}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-300">
                          {st.assessedSkillsCount} {st.assessedSkillsCount === 1 ? "skill" : "skills"}
                        </td>
                        <td className="py-3.5 px-3">
                          {st.assessedSkillsCount > 0 ? (
                            <span className="font-bold text-cyan-400 text-sm">{st.avgProficiency}%</span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {currentStatus !== "approved" && (
                              <button
                                disabled={actionLoadingId === st.studentProfileId}
                                onClick={() => handleVerifyStudent(st.studentProfileId, "approved")}
                                className="px-2.5 py-1 bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[11px] font-semibold hover:bg-emerald-600/60 transition-all cursor-pointer disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}
                            {currentStatus !== "rejected" && (
                              <button
                                disabled={actionLoadingId === st.studentProfileId}
                                onClick={() => handleVerifyStudent(st.studentProfileId, "rejected")}
                                className="px-2.5 py-1 bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-[11px] font-semibold hover:bg-rose-600/60 transition-all cursor-pointer disabled:opacity-50"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default InstitutionStudents;
