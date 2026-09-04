import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  Briefcase,
  Code2,
  Award,
  Building2,
  Plus,
  Trash2,
  ExternalLink,
  GitBranch,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

interface WorkExperience {
  id: number;
  title: string;
  companyName: string;
  location: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  skillsUsed: string[];
}

interface Project {
  id: number;
  title: string;
  description: string;
  techStack: string[];
  status: string;
  projectUrl: string;
  repoUrl: string;
}

interface Certification {
  id: number;
  title: string;
  issuer: string;
  issueYear: string;
  credentialUrl: string;
  verificationStatus: string;
}

interface OpportunityExperience {
  applicationId: number;
  opportunityId: number;
  title: string;
  companyName: string;
  type: string;
  location: string;
  status: string;
  appliedAt: string;
}

interface ExperiencesData {
  workExperiences: WorkExperience[];
  projects: Project[];
  certifications: Certification[];
  opportunityExperiences: OpportunityExperience[];
}

const ExperiencesPage: React.FC = () => {
  const { token: authContextToken } = useAuth();
  const getAuthToken = useCallback(() => {
    return authContextToken || localStorage.getItem("skillbridge_token") || "";
  }, [authContextToken]);

  const [data, setData] = useState<ExperiencesData>({
    workExperiences: [],
    projects: [],
    certifications: [],
    opportunityExperiences: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "work" | "projects" | "certs" | "opportunities">("all");

  // Modal States
  const [showWorkModal, setShowWorkModal] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [showCertModal, setShowCertModal] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Form States
  const [workForm, setWorkForm] = useState({
    title: "",
    companyName: "",
    location: "",
    employmentType: "Internship",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
    skillsInput: "",
  });

  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    techStackInput: "",
    projectUrl: "",
    repoUrl: "",
  });

  const [certForm, setCertForm] = useState({
    title: "",
    issuer: "",
    issueYear: new Date().getFullYear().toString(),
    credentialUrl: "",
  });

  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/student/experiences`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data);
      } else {
        throw new Error(result.message || "Failed to load experiences from database.");
      }
    } catch (err: any) {
      console.error("fetchExperiences error:", err);
      setError(err.message || "Server error while fetching student experiences.");
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  // Handlers for Adding Data to DB
  const handleAddWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workForm.title || !workForm.companyName) return;

    setActionLoading(true);
    try {
      const token = getAuthToken();
      const skillsUsed = workForm.skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE_URL}/student/experiences/work`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          ...workForm,
          skillsUsed,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setShowWorkModal(false);
        setWorkForm({
          title: "",
          companyName: "",
          location: "",
          employmentType: "Internship",
          startDate: "",
          endDate: "",
          isCurrent: false,
          description: "",
          skillsInput: "",
        });
        fetchExperiences();
      } else {
        alert(result.message || "Failed to add work experience.");
      }
    } catch (err: any) {
      alert("Error adding experience: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title) return;

    setActionLoading(true);
    try {
      const token = getAuthToken();
      const techStack = projectForm.techStackInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE_URL}/student/experiences/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          ...projectForm,
          techStack,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setShowProjectModal(false);
        setProjectForm({
          title: "",
          description: "",
          techStackInput: "",
          projectUrl: "",
          repoUrl: "",
        });
        fetchExperiences();
      } else {
        alert(result.message || "Failed to add project.");
      }
    } catch (err: any) {
      alert("Error adding project: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certForm.title || !certForm.issuer) return;

    setActionLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/student/experiences/certifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(certForm),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setShowCertModal(false);
        setCertForm({
          title: "",
          issuer: "",
          issueYear: new Date().getFullYear().toString(),
          credentialUrl: "",
        });
        fetchExperiences();
      } else {
        alert(result.message || "Failed to add certification.");
      }
    } catch (err: any) {
      alert("Error adding certification: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers for Deleting Records from DB
  const handleDeleteWork = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this work experience?")) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/student/experiences/work/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (res.ok) fetchExperiences();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this project?")) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/student/experiences/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (res.ok) fetchExperiences();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCert = async (id: number) => {
    if (!window.confirm("Are you sure you want to remove this certification?")) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/student/experiences/certifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (res.ok) fetchExperiences();
    } catch (err) {
      console.error(err);
    }
  };

  const totalCount =
    data.workExperiences.length +
    data.projects.length +
    data.certifications.length +
    data.opportunityExperiences.length;

  return (
    <MainLayout showRightPanel={true}>
      <div className="space-y-6">
        {/* HEADER HERO */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-400 mb-3">
                <Sparkles size={14} />
                <span>Verified Career Portfolio</span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
                Student Experiences & Track Record
              </h1>
              <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
                Real-time record of your internships, industrial training, technical projects, verified certifications, and matched industry opportunities.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchExperiences}
                disabled={loading}
                className="p-3 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer"
                title="Refresh Experiences Data"
              >
                <RefreshCw size={16} className={loading ? "animate-spin text-indigo-400" : ""} />
              </button>
              <button
                onClick={() => setShowWorkModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Experience</span>
              </button>
              <button
                onClick={() => setShowProjectModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Project</span>
              </button>
              <button
                onClick={() => setShowCertModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Cert</span>
              </button>
            </div>
          </div>
        </div>

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Total Experiences</span>
            <span className="text-2xl font-black text-slate-100">{totalCount}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Live DB entries</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Work & Internships</span>
            <span className="text-2xl font-black text-cyan-400">{data.workExperiences.length}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Roles & industry training</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Projects Built</span>
            <span className="text-2xl font-black text-amber-400">{data.projects.length}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Software & technical projects</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-lg">
            <span className="text-xs text-slate-400 font-semibold block mb-1">Certifications</span>
            <span className="text-2xl font-black text-emerald-400">{data.certifications.length}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Credentials & badges</span>
          </div>
        </div>

        {/* TAB FILTER & ACTIONS */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              All ({totalCount})
            </button>

            <button
              onClick={() => setActiveTab("work")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "work"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Briefcase size={14} />
              <span>Work & Internships ({data.workExperiences.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "projects"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Code2 size={14} />
              <span>Projects ({data.projects.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("certs")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "certs"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Award size={14} />
              <span>Certifications ({data.certifications.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("opportunities")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "opportunities"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Building2 size={14} />
              <span>Applied Opportunities ({data.opportunityExperiences.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowProjectModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-all cursor-pointer"
            >
              + Add Project
            </button>
            <button
              onClick={() => setShowCertModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg border border-slate-700 transition-all cursor-pointer"
            >
              + Add Cert
            </button>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-3">
            <Loader2 className="animate-spin text-indigo-400" size={36} />
            <p className="text-slate-400 text-sm font-medium">Loading real-time experience records from database...</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-slate-800 rounded-3xl text-center px-4">
            <Briefcase size={48} className="text-slate-600 mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-slate-200">No experiences logged in database</h3>
            <p className="text-slate-400 text-xs max-w-md mt-1 mb-4">
              Start building your real-time verified career portfolio by adding your internships, software projects, or certifications.
            </p>
            <button
              onClick={() => setShowWorkModal(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
            >
              Add Your First Experience
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* WORK EXPERIENCES SECTION */}
            {(activeTab === "all" || activeTab === "work") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Briefcase className="text-indigo-400" size={18} />
                    Work & Internship Experiences
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {data.workExperiences.length} Records
                  </span>
                </div>

                {data.workExperiences.length === 0 ? (
                  <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-500">
                    No work/internship experiences added yet. Click "+ Add Experience" above to log your experience.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.workExperiences.map((w) => (
                      <div
                        key={w.id}
                        className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 p-5 rounded-2xl space-y-3 transition-all relative group shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md mb-1.5">
                              {w.employmentType}
                            </span>
                            <h4 className="text-base font-bold text-slate-100">{w.title}</h4>
                            <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mt-0.5">
                              <Building2 size={13} className="text-slate-400" />
                              <span>{w.companyName}</span>
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteWork(w.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete Experience"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
                          {w.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={13} className="text-slate-500" />
                              {w.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={13} className="text-slate-500" />
                            {w.startDate || "Date n/a"} - {w.isCurrent ? "Present" : w.endDate || "Present"}
                          </span>
                        </div>

                        {w.description && (
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                            {w.description}
                          </p>
                        )}

                        {Array.isArray(w.skillsUsed) && w.skillsUsed.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {w.skillsUsed.map((sk, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-800 text-slate-300 rounded-md"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROJECTS SECTION */}
            {(activeTab === "all" || activeTab === "projects") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Code2 className="text-amber-400" size={18} />
                    Technical Projects Portfolio
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {data.projects.length} Projects
                  </span>
                </div>

                {data.projects.length === 0 ? (
                  <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-500">
                    No software projects added yet. Click "+ Add Project" to add projects to your portfolio.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.projects.map((p) => (
                      <div
                        key={p.id}
                        className="bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/30 p-5 rounded-2xl space-y-3 transition-all relative group shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md mb-1.5">
                              {p.status || "Completed"}
                            </span>
                            <h4 className="text-base font-bold text-slate-100">{p.title}</h4>
                          </div>

                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {p.description && (
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                            {p.description}
                          </p>
                        )}

                        {Array.isArray(p.techStack) && p.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {p.techStack.map((tech, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-2 text-xs font-semibold">
                          {p.projectUrl && (
                            <a
                              href={p.projectUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                            >
                              <ExternalLink size={13} /> Demo Link
                            </a>
                          )}
                          {p.repoUrl && (
                            <a
                              href={p.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200"
                            >
                              <GitBranch size={13} /> Source Code
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CERTIFICATIONS SECTION */}
            {(activeTab === "all" || activeTab === "certs") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Award className="text-emerald-400" size={18} />
                    Verified Certifications & Licenses
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {data.certifications.length} Certifications
                  </span>
                </div>

                {data.certifications.length === 0 ? (
                  <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-500">
                    No certifications added yet. Click "+ Add Cert" to list your verified credentials.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.certifications.map((c) => (
                      <div
                        key={c.id}
                        className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/30 p-5 rounded-2xl space-y-3 transition-all relative group shadow-lg flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-md">
                              <CheckCircle2 size={12} /> {c.verificationStatus}
                            </span>
                            {c.issueYear && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                Issued {c.issueYear}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-slate-100 truncate">{c.title}</h4>
                          <p className="text-xs font-semibold text-slate-400">{c.issuer}</p>

                          {c.credentialUrl && (
                            <a
                              href={c.credentialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold pt-1"
                            >
                              <ExternalLink size={13} /> View Credential
                            </a>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteCert(c.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                          title="Delete Certification"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* APPLIED INDUSTRY OPPORTUNITIES SECTION */}
            {(activeTab === "all" || activeTab === "opportunities") && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Building2 className="text-cyan-400" size={18} />
                    Applied & Matched Opportunities
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {data.opportunityExperiences.length} Applications
                  </span>
                </div>

                {data.opportunityExperiences.length === 0 ? (
                  <div className="p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-500">
                    No active opportunity applications logged yet. Explore Opportunities in the sidebar to apply.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.opportunityExperiences.map((opp) => (
                      <div
                        key={opp.applicationId}
                        className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-2 shadow-lg"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-md mb-1">
                              {opp.type}
                            </span>
                            <h4 className="text-base font-bold text-slate-100">{opp.title}</h4>
                            <p className="text-xs font-semibold text-slate-300">{opp.companyName}</p>
                          </div>

                          <span className="px-2.5 py-1 text-xs font-extrabold uppercase rounded-lg bg-slate-800 text-indigo-300 border border-slate-700">
                            {opp.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
                          <span>Location: {opp.location}</span>
                          <span>Applied: {new Date(opp.appliedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: ADD WORK EXPERIENCE */}
      {showWorkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Briefcase size={20} className="text-indigo-400" />
              Add Work or Internship Experience
            </h3>

            <form onSubmit={handleAddWork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role / Position Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer Intern"
                  value={workForm.title}
                  onChange={(e) => setWorkForm({ ...workForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TechCorp Solutions"
                    value={workForm.companyName}
                    onChange={(e) => setWorkForm({ ...workForm, companyName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Employment Type</label>
                  <select
                    value={workForm.employmentType}
                    onChange={(e) => setWorkForm({ ...workForm, employmentType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Industrial Training">Industrial Training</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Research Assistant">Research Assistant</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Jan 2024"
                    value={workForm.startDate}
                    onChange={(e) => setWorkForm({ ...workForm, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Jun 2024"
                    disabled={workForm.isCurrent}
                    value={workForm.isCurrent ? "Present" : workForm.endDate}
                    onChange={(e) => setWorkForm({ ...workForm, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Key Outcomes</label>
                <textarea
                  rows={3}
                  placeholder="Describe your responsibilities, achievements, and impact..."
                  value={workForm.description}
                  onChange={(e) => setWorkForm({ ...workForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Skills Used (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, Docker, MySQL"
                  value={workForm.skillsInput}
                  onChange={(e) => setWorkForm({ ...workForm, skillsInput: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWorkModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Save Experience"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PROJECT */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Code2 size={20} className="text-amber-400" />
              Add Technical Project
            </h3>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SkillBridge AI Career Matcher"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what this project does and key features..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, TypeScript, Node.js, Express, MySQL"
                  value={projectForm.techStackInput}
                  onChange={(e) => setProjectForm({ ...projectForm, techStackInput: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Live Demo URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={projectForm.projectUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, projectUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">GitHub Repo URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={projectForm.repoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, repoUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CERTIFICATION */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Award size={20} className="text-emerald-400" />
              Add Verified Certification
            </h3>

            <form onSubmit={handleAddCert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Certification Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={certForm.title}
                  onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Issuing Organization *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon Web Services, Coursera, NPTEL"
                    value={certForm.issuer}
                    onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024"
                    value={certForm.issueYear}
                    onChange={(e) => setCertForm({ ...certForm, issueYear: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Credential Verification URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={certForm.credentialUrl}
                  onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCertModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Save Certification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default ExperiencesPage;
