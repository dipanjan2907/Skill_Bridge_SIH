import React, { useCallback, useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Edit3,
  Download,
  Share2,
  CheckCircle2,
  Globe,
  Code,
  ShieldCheck,
  Calendar,
  BookOpen,
  Target,
  Sparkles,
  Save,
  Check,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { SkillAssessment } from "../components/student/SkillAssessment";
import type {
  ProfileApiResponse,
  StudentProfileData,
  Institution,
  MasterSkill,
} from "../types/profile";

import { API_BASE_URL } from "../config/api";
import { InstitutionSelectCombobox } from "../components/common/InstitutionSelectCombobox";

type Tab = "personal" | "academic" | "skills" | "preferences" | "projects";

const Profile: React.FC = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  const initialTab = (searchParams.get("tab") as Tab) || "personal";
  const [activeTab, setActiveTab] = useState<Tab>(
    ["personal", "academic", "skills", "preferences", "projects"].includes(initialTab)
      ? initialTab
      : "personal"
  );

  // Sync tab state when URL query search parameters change
  useEffect(() => {
    const tabParam = searchParams.get("tab") as Tab;
    if (tabParam && ["personal", "academic", "skills", "preferences", "projects"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [data, setData] = useState<ProfileApiResponse | null>(null);
  const [formData, setFormData] = useState<StudentProfileData | null>(null);
  const [targetRolesInput, setTargetRolesInput] = useState<string>("");
  const [preferredLocationsInput, setPreferredLocationsInput] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  // Skills section state
  const [masterSkills, setMasterSkills] = useState<MasterSkill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<number | "">("");
  const [skillAddLoading, setSkillAddLoading] = useState(false);
  const [skillActionMessage, setSkillActionMessage] = useState<string | null>(null);
  const [skillActionError, setSkillActionError] = useState<string | null>(null);

  // Active Assessment state
  const [activeAssessmentSkill, setActiveAssessmentSkill] = useState<{
    skillId: number;
    skillName: string;
    skillCategory?: string;
  } | null>(null);

  // GitHub Repo Sync & Modal State
  const [githubSyncLoading, setGithubSyncLoading] = useState(false);
  const [githubSyncError, setGithubSyncError] = useState<string | null>(null);
  const [githubSyncRepos, setGithubSyncRepos] = useState<any[]>([]);
  const [githubSyncUsername, setGithubSyncUsername] = useState<string>("");
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Add Project Modal State
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjData, setNewProjData] = useState({
    title: "",
    description: "",
    tech_stack: "",
    project_url: "",
    repo_url: "",
    status: "Completed",
  });
  const [addProjLoading, setAddProjLoading] = useState(false);
  const [addProjError, setAddProjError] = useState<string | null>(null);

  // Fetch master institutions & master skills on load
  useEffect(() => {
    fetch(`${API_BASE_URL}/student/institutions`)
      .then((res) => res.json())
      .then((data) => setInstitutions(Array.isArray(data) ? data : []))
      .catch(() => setInstitutions([]));

    fetch(`${API_BASE_URL}/skills`)
      .then((res) => res.json())
      .then((data) => setMasterSkills(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching master skills:", err));
  }, []);

  /*
   * ============================================================
   * GET PROFILE
   * ============================================================
   */
  const fetchProfile = useCallback(async () => {
    try {
      const authToken = token || localStorage.getItem("skillbridge_token");

      if (!authToken) {
        throw new Error("No authentication token found. Please sign in again.");
      }

      const response = await fetch(`${API_BASE_URL}/student/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.error ||
            `Failed to load profile. Server returned ${response.status}.`,
        );
      }

      const result: ProfileApiResponse = await response.json();

      if (!result || !result.profile) {
        throw new Error("Invalid profile response received from server.");
      }

      setData(result);

      const rolesArray = Array.isArray(result.profile.target_roles)
        ? [...result.profile.target_roles]
        : [];
      const locationsArray = Array.isArray(result.profile.preferred_locations)
        ? [...result.profile.preferred_locations]
        : [];

      setFormData({
        ...result.profile,
        target_roles: rolesArray,
        preferred_locations: locationsArray,
      });

      setTargetRolesInput(rolesArray.join(", "));
      setPreferredLocationsInput(locationsArray.join(", "));

      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load student profile.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  /*
   * ============================================================
   * INITIAL FETCH
   * ============================================================
   */
  useEffect(() => {
    const authToken = token || localStorage.getItem("skillbridge_token");

    if (!authToken) {
      setLoading(false);
      setError("No authentication token found. Please sign in.");
      return;
    }

    fetchProfile();
  }, [fetchProfile, token]);

  /*
   * ============================================================
   * FORM INPUT HANDLER
   * ============================================================
   */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        [name]: value,
      };
    });
  };

  /*
   * ============================================================
   * NUMBER FIELD HANDLER
   * ============================================================
   */
  const handleNumberChange = (
    field: "expected_stipend_min" | "expected_stipend_max",
    value: string,
  ) => {
    setFormData((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        [field]: value === "" ? null : Number(value),
      };
    });
  };

  /*
   * ============================================================
   * SAVE PROFILE
   * ============================================================
   */
  const handleSave = async () => {
    if (!formData) return;

    const authToken = token || localStorage.getItem("skillbridge_token");

    if (!authToken) {
      setError("Authentication token missing. Please sign in again.");
      return;
    }

    setSaveLoading(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/student/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.error ||
            `Failed to save profile. Server returned ${response.status}.`,
        );
      }

      await fetchProfile();
      window.dispatchEvent(new Event("profileUpdated"));

      setIsEditing(false);
      setSaveSuccess(true);

      window.setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (!data?.profile) {
      setIsEditing(false);
      return;
    }

    const rolesArray = Array.isArray(data.profile.target_roles)
      ? [...data.profile.target_roles]
      : [];
    const locationsArray = Array.isArray(data.profile.preferred_locations)
      ? [...data.profile.preferred_locations]
      : [];

    setFormData({
      ...data.profile,
      target_roles: rolesArray,
      preferred_locations: locationsArray,
    });

    setTargetRolesInput(rolesArray.join(", "));
    setPreferredLocationsInput(locationsArray.join(", "));
    setIsEditing(false);
  };

  /*
   * ============================================================
   * SKILLS ACTIONS HANDLERS
   * ============================================================
   */
  const selectedMasterSkill = masterSkills.find(
    (s) => s.id === Number(selectedSkillId)
  );
  const autoCategory = selectedMasterSkill ? selectedMasterSkill.category : "";

  const isSkillAlreadyAdded = Boolean(
    selectedSkillId &&
      data?.skills?.some(
        (s) =>
          s.skill_id === Number(selectedSkillId) ||
          (selectedMasterSkill && s.name.toLowerCase() === selectedMasterSkill.name.toLowerCase())
      )
  );

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setSkillAddLoading(true);
    setSkillActionError(null);
    setSkillActionMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/student/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skill_id: Number(selectedSkillId),
          proficiency_score: 0,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Failed to add skill.");
      }

      setSkillActionMessage(`Skill "${selectedMasterSkill?.name}" added successfully!`);
      setSelectedSkillId("");
      await fetchProfile();
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err: any) {
      setSkillActionError(err.message || "Error adding skill");
    } finally {
      setSkillAddLoading(false);
    }
  };

  const handleDeleteSkill = async (skillRecordId: number, skillName: string) => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setSkillActionError(null);
    setSkillActionMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/student/skills/${skillRecordId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Failed to remove skill.");
      }

      setSkillActionMessage(`Skill "${skillName}" removed successfully.`);
      await fetchProfile();
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err: any) {
      setSkillActionError(err.message || "Error removing skill");
    }
  };

  /*
   * ============================================================
   * GITHUB REPO SYNC & IMPORT HANDLERS
   * ============================================================
   */
  const handleFetchGitHubRepos = async (customUsername?: string) => {
    const usernameToSync = customUsername || formData?.github || "";
    if (!usernameToSync) {
      setGithubSyncError("Please enter a valid GitHub username or profile URL first.");
      setShowGitHubModal(true);
      return;
    }

    setGithubSyncLoading(true);
    setGithubSyncError(null);
    setShowGitHubModal(true);

    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      const res = await fetch(`${API_BASE_URL}/student/profile/github-repos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: usernameToSync }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to fetch GitHub repositories.");
      }

      setGithubSyncUsername(resData.username);
      setGithubSyncRepos(resData.repos || []);
      // Pre-select all repos by default
      setSelectedRepoIds((resData.repos || []).map((r: any) => r.id));
    } catch (err: any) {
      setGithubSyncError(err.message || "Error connecting to GitHub API.");
    } finally {
      setGithubSyncLoading(false);
    }
  };

  const toggleRepoSelection = (id: number) => {
    setSelectedRepoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleImportSelectedRepos = async () => {
    const selectedRepos = githubSyncRepos.filter((r) => selectedRepoIds.includes(r.id));
    if (selectedRepos.length === 0) {
      setGithubSyncError("Please select at least one repository to import.");
      return;
    }

    setImportLoading(true);
    setGithubSyncError(null);

    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      const res = await fetch(`${API_BASE_URL}/student/profile/import-github-projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repos: selectedRepos }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to import GitHub projects.");
      }

      setImportSuccessMsg(resData.message || "GitHub projects successfully imported!");
      await fetchProfile();
      window.dispatchEvent(new Event("profileUpdated"));

      setTimeout(() => {
        setShowGitHubModal(false);
        setImportSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setGithubSyncError(err.message || "Import failed.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjData.title) {
      setAddProjError("Project title is required.");
      return;
    }

    setAddProjLoading(true);
    setAddProjError(null);

    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      const res = await fetch(`${API_BASE_URL}/student/profile/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProjData),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to add project.");
      }

      setNewProjData({
        title: "",
        description: "",
        tech_stack: "",
        project_url: "",
        repo_url: "",
        status: "Completed",
      });
      setShowAddProjectModal(false);
      await fetchProfile();
    } catch (err: any) {
      setAddProjError(err.message || "Error creating project.");
    } finally {
      setAddProjLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/student/profile/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        const resData = await res.json();
        throw new Error(resData.error || "Failed to delete project.");
      }

      await fetchProfile();
    } catch (err: any) {
      alert(err.message || "Error deleting project.");
    }
  };

  /*
   * ============================================================
   * LOADING AND ERROR STATES
   * ============================================================
   */
  if (loading) {
    return (
      <div className="profile-loading-screen">
        <Loader2 className="spin-icon" size={36} />
        <p>Loading your profile details from database...</p>
      </div>
    );
  }

  if (error || !data || !formData) {
    return (
      <div className="profile-error-screen">
        <AlertCircle size={44} color="#ef4444" />
        <h2>Failed to Load Profile</h2>
        <p>{error || "No student profile data found in database."}</p>
        <button onClick={fetchProfile} className="retry-btn">
          Retry Loading
        </button>
      </div>
    );
  }

  const initials = formData.name
    ? formData.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "ST";

  return (
    <div className="profile-page-wrapper">
      {saveSuccess && (
        <div className="toast-notification success">
          <Check size={18} />
          Profile changes successfully updated in database!
        </div>
      )}

      {/* ============================================================
          HEADER / COVER CARD
      ============================================================ */}
      <div className="profile-cover-card">
        <div className="cover-bg" />

        <div className="cover-content">
          <div className="avatar-section">
            <div className="main-avatar">{initials}</div>

            <span className="online-indicator" title="Database Connected" />
          </div>

          <div className="identity-section">
            <div className="name-row">
              <h1>{formData.name || "Student Name"}</h1>

              <span className="verified-badge">
                <ShieldCheck size={16} />
                Verified Student
              </span>
            </div>

            <p className="subtitle">
              {[formData.degree, formData.department]
                .filter(Boolean)
                .join(" • ") || "Program details pending"}
              {formData.institution ? ` at ${formData.institution}` : ""}
            </p>

            <div className="quick-contacts">
              {formData.email && (
                <span>
                  <Mail size={14} />
                  {formData.email}
                </span>
              )}
              {formData.phone && (
                <span>
                  <Phone size={14} />
                  {formData.phone}
                </span>
              )}
              {formData.location && (
                <span>
                  <MapPin size={14} />
                  {formData.location}
                </span>
              )}
            </div>
          </div>

          <div className="action-buttons">
            {!isEditing ? (
              <button
                className="btn-primary"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={16} />
                Edit Details
              </button>
            ) : (
              <>
                <button
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={saveLoading}
                >
                  Cancel
                </button>

                <button
                  className="btn-save"
                  onClick={handleSave}
                  disabled={saveLoading}
                >
                  {saveLoading ? (
                    <Loader2 size={16} className="spin-icon" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Changes
                </button>
              </>
            )}

            <button className="btn-icon" title="Download Resume">
              <Download size={16} />
            </button>

            <button className="btn-icon" title="Share Profile">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          METRIC STATS
      ============================================================ */}
      <div className="profile-stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">
            <Sparkles size={20} />
          </div>

          <div>
            <div className="stat-label">Profile Strength</div>

            <div className="stat-value">
              {data.skills?.length ? "78%" : "43%"}
            </div>

            <small className="stat-sub">Based on profile data</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <GraduationCap size={20} />
          </div>

          <div>
            <div className="stat-label">Academic CGPA</div>

            <div className="stat-value">
              {formData.cgpa !== null && formData.cgpa !== undefined && String(formData.cgpa).trim() !== ""
                ? Number(formData.cgpa).toFixed(2)
                : "N/A"}
            </div>

            <small className="stat-sub">Out of 10</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Award size={20} />
          </div>

          <div>
            <div className="stat-label">Verified Skills</div>

            <div className="stat-value">{data.skills?.length || 0}</div>

            <small className="stat-sub">Database records</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <FileText size={20} />
          </div>

          <div>
            <div className="stat-label">Projects</div>

            <div className="stat-value">{data.projects?.length || 0}</div>

            <small className="stat-sub">Database records</small>
          </div>
        </div>
      </div>

      {/* ============================================================
          NAVIGATION TABS
      ============================================================ */}
      <div className="profile-tabs">
        <button
          className={activeTab === "personal" ? "active" : ""}
          onClick={() => setActiveTab("personal")}
        >
          <User size={16} />
          Personal Info
        </button>

        <button
          className={activeTab === "academic" ? "active" : ""}
          onClick={() => setActiveTab("academic")}
        >
          <GraduationCap size={16} />
          Academic Details
        </button>

        <button
          className={activeTab === "skills" ? "active" : ""}
          onClick={() => setActiveTab("skills")}
        >
          <Award size={16} />
          Skill DNA & Badges
        </button>

        <button
          className={activeTab === "preferences" ? "active" : ""}
          onClick={() => setActiveTab("preferences")}
        >
          <Target size={16} />
          Career Goals
        </button>

        <button
          className={activeTab === "projects" ? "active" : ""}
          onClick={() => setActiveTab("projects")}
        >
          <Code size={16} />
          Projects & Credentials
        </button>
      </div>

      {/* ============================================================
          TAB CONTENT PANELS
      ============================================================ */}
      <div className="profile-tab-content">
        {/* ====================================================
            PERSONAL INFO
        ==================================================== */}
        {activeTab === "personal" && (
          <div className="tab-pane">
            <div className="card-header">
              <h2>
                <User size={20} />
                Personal Information
              </h2>

              <p>Your basic information synchronized with the database.</p>
            </div>

            <div className="form-grid">
              {/* FULL NAME */}
              <div className="form-group">
                <label>Full Name</label>

                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name ?? ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="field-value">
                    {formData.name || "Not provided"}
                  </span>
                )}
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <label>Email Address</label>

                <span className="field-value readonly">
                  <Mail size={14} />
                  {formData.email}
                </span>
              </div>

              {/* PHONE */}
              <div className="form-group">
                <label>Phone Number</label>

                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone ?? ""}
                    onChange={handleInputChange}
                    placeholder="+91 98765 43210"
                  />
                ) : (
                  <span className="field-value">
                    {formData.phone || "Not provided"}
                  </span>
                )}
              </div>

              {/* DOB */}
              <div className="form-group">
                <label>Date of Birth</label>

                {isEditing ? (
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob ? formData.dob.split("T")[0] : ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="field-value">
                    <Calendar size={14} />
                    {formData.dob ? formData.dob.split("T")[0] : "Not provided"}
                  </span>
                )}
              </div>

              {/* GENDER */}
              <div className="form-group">
                <label>Gender</label>

                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender ?? ""}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                ) : (
                  <span className="field-value">
                    {formData.gender || "Not specified"}
                  </span>
                )}
              </div>

              {/* LOCATION */}
              <div className="form-group">
                <label>Current Location</label>

                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location ?? ""}
                    onChange={handleInputChange}
                    placeholder="City, State"
                  />
                ) : (
                  <span className="field-value">
                    <MapPin size={14} />
                    {formData.location || "Not specified"}
                  </span>
                )}
              </div>

              {/* BIO */}
              <div className="form-group span-2">
                <label>Bio / About Me</label>

                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio ?? ""}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Share a brief overview of your skills, background, and aspirations..."
                  />
                ) : (
                  <p className="bio-text">
                    {formData.bio || "No biography provided."}
                  </p>
                )}
              </div>

              {/* SOCIAL / DEVELOPER LINKS IN EDIT MODE */}
              {isEditing && (
                <>
                  <div className="form-group">
                    <label>GitHub Username or Profile URL</label>
                    <input
                      type="text"
                      name="github"
                      value={formData.github ?? ""}
                      onChange={handleInputChange}
                      placeholder="e.g. octocat or https://github.com/octocat"
                    />
                  </div>

                  <div className="form-group">
                    <label>LinkedIn Profile URL</label>
                    <input
                      type="text"
                      name="linkedin"
                      value={formData.linkedin ?? ""}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div className="form-group span-2">
                    <label>Personal Portfolio URL</label>
                    <input
                      type="text"
                      name="portfolio"
                      value={formData.portfolio ?? ""}
                      onChange={handleInputChange}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </>
              )}
            </div>

            {/* CONNECTED DEVELOPER & SOCIAL ACCOUNTS (VIEW MODE) */}
            {!isEditing && (
              <div style={{ marginTop: "2rem" }}>
                <div className="sub-section-title">
                  <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Code size={18} className="text-primary" />
                    Developer Accounts & Connected Profiles
                  </h3>
                </div>

                <div className="connected-accounts-grid">
                  {/* GITHUB CARD */}
                  <div className="account-card">
                    <div className="account-card-header">
                      <div className="account-info">
                        <div className="account-icon-wrapper github-bg">
                          GH
                        </div>
                        <div className="account-details">
                          <strong>GitHub Account</strong>
                          <p>{formData.github || "Not connected"}</p>
                        </div>
                      </div>

                      {formData.github ? (
                        <span className="connected-badge">
                          <CheckCircle2 size={12} /> Connected
                        </span>
                      ) : (
                        <span className="unconnected-badge">Unlinked</span>
                      )}
                    </div>

                    <div className="account-actions">
                      <button
                        type="button"
                        className="btn-github-sync"
                        onClick={() => handleFetchGitHubRepos()}
                      >
                        <RefreshCw size={14} />
                        Sync GitHub Repositories
                      </button>

                      {formData.github && (
                        <a
                          href={
                            formData.github.startsWith("http")
                              ? formData.github
                              : `https://github.com/${formData.github}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link-btn"
                          style={{ padding: "0.5rem 0.8rem", background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}
                        >
                          <ExternalLink size={13} /> View GitHub
                        </a>
                      )}
                    </div>
                  </div>

                  {/* LINKEDIN CARD */}
                  <div className="account-card">
                    <div className="account-card-header">
                      <div className="account-info">
                        <div className="account-icon-wrapper linkedin-bg">
                          in
                        </div>
                        <div className="account-details">
                          <strong>LinkedIn Profile</strong>
                          <p>{formData.linkedin || "Not connected"}</p>
                        </div>
                      </div>

                      {formData.linkedin ? (
                        <span className="connected-badge">
                          <CheckCircle2 size={12} /> Connected
                        </span>
                      ) : (
                        <span className="unconnected-badge">Unlinked</span>
                      )}
                    </div>

                    <div className="account-actions">
                      {formData.linkedin ? (
                        <a
                          href={
                            formData.linkedin.startsWith("http")
                              ? formData.linkedin
                              : `https://linkedin.com/in/${formData.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link-btn"
                          style={{ padding: "0.5rem 0.8rem", background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}
                        >
                          <ExternalLink size={13} /> View Profile ↗
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setIsEditing(true)}
                          style={{ fontSize: "0.8rem", padding: "0.45rem 0.85rem" }}
                        >
                          + Connect LinkedIn
                        </button>
                      )}
                    </div>
                  </div>

                  {/* PORTFOLIO CARD */}
                  <div className="account-card">
                    <div className="account-card-header">
                      <div className="account-info">
                        <div className="account-icon-wrapper portfolio-bg">
                          <Globe size={20} />
                        </div>
                        <div className="account-details">
                          <strong>Personal Portfolio</strong>
                          <p>{formData.portfolio || "Not connected"}</p>
                        </div>
                      </div>

                      {formData.portfolio ? (
                        <span className="connected-badge">
                          <CheckCircle2 size={12} /> Connected
                        </span>
                      ) : (
                        <span className="unconnected-badge">Unlinked</span>
                      )}
                    </div>

                    <div className="account-actions">
                      {formData.portfolio ? (
                        <a
                          href={
                            formData.portfolio.startsWith("http")
                              ? formData.portfolio
                              : `https://${formData.portfolio}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link-btn"
                          style={{ padding: "0.5rem 0.8rem", background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}
                        >
                          <ExternalLink size={13} /> Visit Site ↗
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setIsEditing(true)}
                          style={{ fontSize: "0.8rem", padding: "0.45rem 0.85rem" }}
                        >
                          + Add Portfolio
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====================================================
            ACADEMIC DETAILS
        ==================================================== */}
        {activeTab === "academic" && (
          <div className="tab-pane">
            <div className="card-header">
              <h2>
                <GraduationCap size={20} />
                Academic Credentials
              </h2>

              <p>Your academic information stored in the database.</p>
            </div>

            <div className="form-grid">
              {/* INSTITUTION */}
              <div className="form-group span-2">
                <label>Institution Name (Relational DB Linked)</label>

                {isEditing ? (
                  <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
                    <InstitutionSelectCombobox
                      institutions={institutions}
                      selectedId={formData.institution_id}
                      onSelect={(inst) => {
                        setFormData((prev) =>
                          prev
                            ? {
                                ...prev,
                                institution_id: inst ? inst.id : undefined,
                                institution: inst ? inst.name : prev.institution,
                              }
                            : null
                        );
                      }}
                      placeholder="Search registered university or college..."
                    />
                  </div>
                ) : (
                  <span className="field-value bold">
                    <BookOpen size={16} />
                    {formData.institution || "Not specified"}
                  </span>
                )}
              </div>

              {/* DEGREE */}
              <div className="form-group">
                <label>Degree Program</label>

                {isEditing ? (
                  <input
                    type="text"
                    name="degree"
                    value={formData.degree ?? ""}
                    onChange={handleInputChange}
                    placeholder="e.g. B.Tech, M.Tech, BCA"
                  />
                ) : (
                  <span className="field-value">
                    {formData.degree || "Not specified"}
                  </span>
                )}
              </div>

              {/* DEPARTMENT */}
              <div className="form-group">
                <label>Department / Branch</label>

                {isEditing ? (
                  <input
                    type="text"
                    name="department"
                    value={formData.department ?? ""}
                    onChange={handleInputChange}
                    placeholder="e.g. Computer Science & Engineering"
                  />
                ) : (
                  <span className="field-value">
                    {formData.department || "Not specified"}
                  </span>
                )}
              </div>

              {/* ROLL NUMBER */}
              <div className="form-group">
                <label>Roll Number / Enrollment ID</label>

                {isEditing ? (
                  <input
                    type="text"
                    name="roll_number"
                    value={formData.roll_number ?? ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="field-value">
                    {formData.roll_number || "Not specified"}
                  </span>
                )}
              </div>

              {/* CURRENT SEMESTER */}
              <div className="form-group">
                <label>Current Semester / Year</label>

                {isEditing ? (
                  <input
                    type="text"
                    name="current_sem"
                    value={formData.current_sem ?? ""}
                    onChange={handleInputChange}
                    placeholder="e.g. 6th Semester"
                  />
                ) : (
                  <span className="field-value">
                    {formData.current_sem || "Not specified"}
                  </span>
                )}
              </div>

              {/* CGPA */}
              <div className="form-group">
                <label>Cumulative CGPA</label>

                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    name="cgpa"
                    value={formData.cgpa ?? ""}
                    onChange={handleInputChange}
                  />
                ) : (
                  <span className="field-value highlight">
                    {formData.cgpa !== null && formData.cgpa !== undefined && String(formData.cgpa).trim() !== ""
                      ? `${Number(formData.cgpa).toFixed(2)} / 10`
                      : "Not specified"}
                  </span>
                )}
              </div>

              {/* GRADUATION YEAR */}
              <div className="form-group">
                <label>Expected Graduation Year</label>

                {isEditing ? (
                  <input
                    type="text"
                    name="expected_grad"
                    value={formData.expected_grad ?? ""}
                    onChange={handleInputChange}
                    placeholder="e.g. 2026"
                  />
                ) : (
                  <span className="field-value">
                    {formData.expected_grad || "Not specified"}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            SKILLS (ADDED & MANAGED DYNAMICALLY VIA DB)
        ==================================================== */}
        {activeTab === "skills" && (
          <div className="tab-pane">
            <div className="card-header">
              <h2>
                <Sparkles size={20} />
                Skill DNA & Mastery
              </h2>

              <p>
                Add, manage, and verify your skills stored dynamically in the relational database.
              </p>
            </div>

            {/* ADD SKILL CARD */}
            <div className="add-skill-card">
              <h3>
                <Plus size={18} /> Add New Skill
              </h3>

              <form onSubmit={handleAddSkill} className="skill-form-grid">
                {/* 1. SKILL DROPDOWN (DB FETCHED) */}
                <div className="skill-field-group">
                  <label>Skill Name</label>
                  <select
                    className="skill-select-input"
                    value={selectedSkillId}
                    onChange={(e) => {
                      setSelectedSkillId(e.target.value === "" ? "" : Number(e.target.value));
                      setSkillActionError(null);
                      setSkillActionMessage(null);
                    }}
                  >
                    <option value="">Select skill from database...</option>
                    {masterSkills.map((sk) => (
                      <option key={sk.id} value={sk.id}>
                        {sk.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. AUTOMATIC READ-ONLY CATEGORY DISPLAY */}
                <div className="skill-field-group">
                  <label>Category (Auto-assigned)</label>
                  <div className={`skill-category-display ${!autoCategory ? "empty" : ""}`}>
                    {autoCategory ? autoCategory : "Auto-filled upon skill selection"}
                  </div>
                </div>

                {/* 3. ADD SKILL BUTTON */}
                <div>
                  <button
                    type="submit"
                    disabled={!selectedSkillId || isSkillAlreadyAdded || skillAddLoading}
                    style={{
                      padding: "0.6rem 1.2rem",
                      borderRadius: "8px",
                      background: isSkillAlreadyAdded ? "#6b7280" : "var(--primary-color, #6366f1)",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 600,
                      cursor:
                        !selectedSkillId || isSkillAlreadyAdded || skillAddLoading
                          ? "not-allowed"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      opacity: !selectedSkillId || isSkillAlreadyAdded || skillAddLoading ? 0.7 : 1,
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    {skillAddLoading ? (
                      <Loader2 size={16} className="spin-icon" />
                    ) : (
                      <Plus size={16} />
                    )}
                    {isSkillAlreadyAdded ? "Skill Already Added" : "Add Skill"}
                  </button>
                </div>
              </form>

              {/* MESSAGES */}
              {skillActionError && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    color: "#ef4444",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <AlertCircle size={15} /> {skillActionError}
                </div>
              )}
              {skillActionMessage && (
                <div
                  style={{
                    marginTop: "0.75rem",
                    color: "#10b981",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <CheckCircle2 size={15} /> {skillActionMessage}
                </div>
              )}
            </div>

            {/* LIST OF CURRENT SKILLS */}
            <div className="sub-section-title" style={{ marginBottom: "1rem" }}>
              <h3>Your Skills & Proficiency Records</h3>
            </div>

            {data.skills?.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <Sparkles size={30} style={{ margin: "0 auto 0.75rem", opacity: 0.5 }} />
                <p>No skills added to your profile yet. Select a skill above to add one!</p>
              </div>
            ) : (
              <div className="skills-dna-grid">
                {data.skills.map((skill) => {
                  const normName = skill.name.toLowerCase().replace("&", "and").trim();
                  const masterMatch = masterSkills.find((m) => {
                    if (m.id === skill.skill_id) return true;
                    const mNorm = m.name.toLowerCase().replace("&", "and").trim();
                    return mNorm === normName;
                  });
                  const targetSkillId = skill.skill_id || (masterMatch ? masterMatch.id : skill.id);

                  return (
                    <div key={skill.id} className="skill-meter-card">
                      <div
                        className="skill-meter-top"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.2, display: "inline-flex", alignItems: "center" }}>
                            {skill.name}
                          </span>
                          {skill.category && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                padding: "0.2rem 0.55rem",
                                borderRadius: "12px",
                                background:
                                  skill.category === "Soft Skill"
                                    ? "rgba(236, 72, 153, 0.15)"
                                    : "rgba(99, 102, 241, 0.15)",
                                color:
                                  skill.category === "Soft Skill" ? "#ec4899" : "#6366f1",
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                lineHeight: 1,
                                boxSizing: "border-box",
                              }}
                            >
                              {skill.category}
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            Proficiency Score: <b style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.9rem" }}>{skill.proficiency_score}%</b>
                          </span>
                          <button
                            onClick={() => handleDeleteSkill(skill.id, skill.name)}
                            title="Remove Skill"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "0.2rem",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="skill-progress-bar" style={{ marginTop: "0.6rem" }}>
                        <span style={{ width: `${skill.proficiency_score}%` }} />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "0.75rem",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            color:
                              skill.verification_source === "Verified Assessment"
                                ? "#10b981"
                                : "var(--text-muted)",
                            fontWeight:
                              skill.verification_source === "Verified Assessment" ? 600 : 400,
                          }}
                        >
                          {skill.verification_source === "Verified Assessment" && (
                            <CheckCircle2 size={13} color="#10b981" />
                          )}
                          {skill.verification_source || "Self Reported"}
                        </span>

                        <button
                          type="button"
                          className="assess-yourself-btn"
                          onClick={() =>
                            setActiveAssessmentSkill({
                              skillId: targetSkillId,
                              skillName: skill.name,
                              skillCategory: skill.category || "Technical",
                            })
                          }
                        >
                          <Award size={14} />
                          Assess Yourself
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="sub-section-title" style={{ marginTop: "2rem" }}>
              <h3>Verified Skill Badges</h3>
            </div>

            <div className="badges-flex">
              {data.skills?.filter((skill) => skill.is_badge_earned).length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  No verified skill badges earned yet. Complete assessments to earn badges!
                </p>
              ) : (
                data.skills
                  .filter((skill) => skill.is_badge_earned)
                  .map((skill) => (
                    <div key={`badge-${skill.id}`} className="badge-chip emerald">
                      <CheckCircle2 size={16} />
                      {skill.name}
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            CAREER PREFERENCES
        ==================================================== */}
        {activeTab === "preferences" && (
          <div className="tab-pane">
            <div className="card-header">
              <h2>
                <Target size={20} />
                Career Goals & Preferences
              </h2>

              <p>Manage your career preferences and expectations.</p>
            </div>

            <div className="preferences-grid">
              {/* TARGET ROLES */}
              <div className="pref-card">
                <Briefcase size={22} className="pref-icon" />

                <div style={{ width: "100%" }}>
                  <strong>Target Job Roles</strong>

                  {isEditing ? (
                    <textarea
                      value={targetRolesInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTargetRolesInput(val);
                        const parsed = val.split(",").map((s) => s.trim()).filter(Boolean);
                        setFormData((prev) => (prev ? { ...prev, target_roles: parsed } : null));
                      }}
                      placeholder="e.g. Software Engineer, Data Analyst, AI Engineer"
                      rows={3}
                    />
                  ) : (
                    <div className="tag-list">
                      {formData?.target_roles?.length ? (
                        formData.target_roles.map((role, index) => (
                          <span key={`${role}-${index}`} className="tag">
                            {role}
                          </span>
                        ))
                      ) : (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.82rem",
                          }}
                        >
                          No target roles specified.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* LOCATIONS */}
              <div className="pref-card">
                <MapPin size={22} className="pref-icon" />

                <div style={{ width: "100%" }}>
                  <strong>Preferred Work Locations</strong>

                  {isEditing ? (
                    <textarea
                      value={preferredLocationsInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPreferredLocationsInput(val);
                        const parsed = val.split(",").map((s) => s.trim()).filter(Boolean);
                        setFormData((prev) => (prev ? { ...prev, preferred_locations: parsed } : null));
                      }}
                      placeholder="e.g. Kolkata, Bengaluru, Remote"
                      rows={3}
                    />
                  ) : (
                    <div className="tag-list">
                      {formData?.preferred_locations?.length ? (
                        formData.preferred_locations.map((location, index) => (
                          <span key={`${location}-${index}`} className="tag">
                            {location}
                          </span>
                        ))
                      ) : (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.82rem",
                          }}
                        >
                          No preferred locations specified.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* WORK MODE */}
              <div className="pref-card">
                <Globe size={22} className="pref-icon" />

                <div>
                  <strong>Work Mode Preference</strong>

                  {isEditing ? (
                    <select
                      name="work_mode_preference"
                      value={formData.work_mode_preference ?? "Hybrid"}
                      onChange={handleInputChange}
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  ) : (
                    <p>{formData.work_mode_preference || "Flexible"}</p>
                  )}
                </div>
              </div>

              {/* EXPECTED STIPEND RANGE */}
              <div className="pref-card">
                <FileText size={22} className="pref-icon" />

                <div>
                  <strong>Expected Monthly Stipend</strong>

                  {isEditing ? (
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                      <input
                        type="number"
                        placeholder="Min (₹)"
                        value={formData.expected_stipend_min ?? ""}
                        onChange={(e) =>
                          handleNumberChange("expected_stipend_min", e.target.value)
                        }
                      />
                      <input
                        type="number"
                        placeholder="Max (₹)"
                        value={formData.expected_stipend_max ?? ""}
                        onChange={(e) =>
                          handleNumberChange("expected_stipend_max", e.target.value)
                        }
                      />
                    </div>
                  ) : (
                    <p>
                      {formData.expected_stipend_min || formData.expected_stipend_max
                        ? `₹${formData.expected_stipend_min?.toLocaleString() || 0} - ₹${formData.expected_stipend_max?.toLocaleString() || "Open"}/mo`
                        : "Negotiable / Open"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            PROJECTS & CREDENTIALS
        ==================================================== */}
        {activeTab === "projects" && (
          <div className="tab-pane">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2>
                  <Code size={20} />
                  Projects & Portfolio Credentials
                </h2>

                <p>Manage and synchronize your real developer projects from GitHub & database records.</p>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn-github-sync"
                  onClick={() => handleFetchGitHubRepos()}
                >
                  <RefreshCw size={14} />
                  Sync from GitHub
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowAddProjectModal(true)}
                >
                  <Plus size={14} />
                  Add Custom Project
                </button>
              </div>
            </div>

            <div className="sub-section-title">
              <h3>Academic & Personal Projects</h3>
            </div>

            <div className="projects-grid">
              {data.projects?.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2.5rem 1rem", background: "var(--bg-app)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border-color)" }}>
                  <Code size={36} style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 600 }}>
                    No projects recorded in your profile yet.
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                    Click "Sync from GitHub" above to pull your live public repositories automatically!
                  </p>
                </div>
              ) : (
                data.projects.map((project) => (
                  <div key={project.id} className="project-card">
                    <div className="project-top">
                      <h4>{project.title}</h4>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className="status-badge">{project.status}</span>
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteProject(project.id)}
                          title="Delete Project"
                          style={{ width: "26px", height: "26px", color: "#ef4444" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <p>{project.description}</p>

                    <div className="tech-stack-flex">
                      {project.tech_stack?.map((tech, i) => (
                        <span key={i} className="tech-pill">
                          {tech}
                        </span>
                      ))}
                    </div>

                    {(project.project_url || project.repo_url) && (
                      <div className="project-links-flex">
                        {project.repo_url && (
                          <a
                            href={project.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-link-btn"
                          >
                            <Code size={13} /> Repository
                          </a>
                        )}

                        {project.project_url && (
                          <a
                            href={project.project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="project-link-btn"
                          >
                            <ExternalLink size={13} /> Live Demo
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="sub-section-title" style={{ marginTop: "2.5rem" }}>
              <h3>Certifications & Licenses</h3>
            </div>

            <div className="certs-list">
              {data.certifications?.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                  No certifications recorded in the database yet.
                </p>
              ) : (
                data.certifications.map((cert) => (
                  <div key={cert.id} className="cert-item">
                    <Award size={20} className="cert-icon" />

                    <div>
                      <h4>{cert.title}</h4>

                      <p>
                        {cert.issuer} • Issued {cert.issue_year}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            GITHUB REPOS SYNC MODAL
        ==================================================== */}
        {showGitHubModal && (
          <div className="github-modal-overlay">
            <div className="github-modal-card">
              <div className="github-modal-header">
                <h3>
                  <Code size={18} className="text-primary" />
                  Sync GitHub Public Repositories
                </h3>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowGitHubModal(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="github-modal-body">
                {/* Username Input & Fetch Action */}
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <input
                    type="text"
                    placeholder="Enter GitHub Username or Profile URL..."
                    value={githubSyncUsername || formData?.github || ""}
                    onChange={(e) => setGithubSyncUsername(e.target.value)}
                    style={{ flex: 1, padding: "0.65rem 0.85rem", background: "var(--bg-app)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "0.88rem" }}
                  />
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleFetchGitHubRepos(githubSyncUsername)}
                    disabled={githubSyncLoading}
                  >
                    {githubSyncLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Fetch Repos
                  </button>
                </div>

                {githubSyncError && (
                  <div className="auth-alert error" style={{ margin: 0 }}>
                    <AlertCircle size={15} />
                    {githubSyncError}
                  </div>
                )}

                {importSuccessMsg && (
                  <div className="auth-alert success" style={{ margin: 0 }}>
                    <CheckCircle2 size={15} />
                    {importSuccessMsg}
                  </div>
                )}

                {githubSyncLoading ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 1rem auto" }} />
                    <p>Connecting to GitHub API & loading public repositories...</p>
                  </div>
                ) : githubSyncRepos.length > 0 ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        Found {githubSyncRepos.length} public repository(s). Select repos to import:
                      </span>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: "var(--primary-light)", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
                        onClick={() => {
                          if (selectedRepoIds.length === githubSyncRepos.length) {
                            setSelectedRepoIds([]);
                          } else {
                            setSelectedRepoIds(githubSyncRepos.map((r) => r.id));
                          }
                        }}
                      >
                        {selectedRepoIds.length === githubSyncRepos.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <div className="repos-list">
                      {githubSyncRepos.map((repo) => {
                        const isSelected = selectedRepoIds.includes(repo.id);
                        return (
                          <div
                            key={repo.id}
                            className={`repo-select-item ${isSelected ? "selected" : ""}`}
                            onClick={() => toggleRepoSelection(repo.id)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRepoSelection(repo.id)}
                              className="repo-checkbox"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="repo-meta">
                              <div className="repo-title-row">
                                <strong>{repo.name}</strong>
                                {repo.stargazers_count > 0 && (
                                  <span className="repo-stars">
                                    ★ {repo.stargazers_count}
                                  </span>
                                )}
                              </div>
                              <p className="repo-description">{repo.description}</p>
                              <div className="tech-stack-flex">
                                {repo.tech_stack?.map((tech: string, i: number) => (
                                  <span key={i} className="tech-pill">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  !githubSyncLoading && (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      <p>No repositories loaded. Enter a valid GitHub username and click "Fetch Repos".</p>
                    </div>
                  )
                )}
              </div>

              <div className="github-modal-footer">
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Selected: {selectedRepoIds.length} project(s)
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowGitHubModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleImportSelectedRepos}
                    disabled={importLoading || selectedRepoIds.length === 0}
                  >
                    {importLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Import to SkillBridge Portfolio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            ADD CUSTOM PROJECT MODAL
        ==================================================== */}
        {showAddProjectModal && (
          <div className="github-modal-overlay">
            <div className="github-modal-card" style={{ maxWidth: "550px" }}>
              <div className="github-modal-header">
                <h3>
                  <Plus size={18} className="text-primary" />
                  Add Custom Project
                </h3>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowAddProjectModal(false)}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddProject}>
                <div className="github-modal-body">
                  {addProjError && (
                    <div className="auth-alert error" style={{ margin: 0 }}>
                      <AlertCircle size={15} />
                      {addProjError}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Project Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AI-Powered Skill Placement Platform"
                      value={newProjData.title}
                      onChange={(e) => setNewProjData({ ...newProjData, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows={3}
                      placeholder="Brief overview of the project and core achievements..."
                      value={newProjData.description}
                      onChange={(e) => setNewProjData({ ...newProjData, description: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Technologies / Tech Stack (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. React, Node.js, TypeScript, MySQL"
                      value={newProjData.tech_stack}
                      onChange={(e) => setNewProjData({ ...newProjData, tech_stack: e.target.value })}
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>GitHub Repo URL</label>
                      <input
                        type="url"
                        placeholder="https://github.com/username/project"
                        value={newProjData.repo_url}
                        onChange={(e) => setNewProjData({ ...newProjData, repo_url: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Live Demo URL</label>
                      <input
                        type="url"
                        placeholder="https://myproject.app"
                        value={newProjData.project_url}
                        onChange={(e) => setNewProjData({ ...newProjData, project_url: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="github-modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAddProjectModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={addProjLoading}
                  >
                    {addProjLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SKILL ASSESSMENT MODAL */}
        {activeAssessmentSkill && (
          <SkillAssessment
            skillId={activeAssessmentSkill.skillId}
            skillName={activeAssessmentSkill.skillName}
            skillCategory={activeAssessmentSkill.skillCategory}
            onClose={() => setActiveAssessmentSkill(null)}
            onComplete={() => {
              fetchProfile();
              window.dispatchEvent(new Event("profileUpdated"));
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
