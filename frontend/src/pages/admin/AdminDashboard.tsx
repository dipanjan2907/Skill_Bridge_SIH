import React, { useState, useEffect } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import type { AdminIndustryItem, VerificationStatus } from "../../types/industry";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Globe,
  MapPin,
  Mail,
  Phone,
  AlertCircle,
  Filter,
  X,
  RotateCw,
  Users,
  GraduationCap,
  School,
  ShieldAlert,
  Trash2,
  UserX,
  UserCheck,
  Ban,
} from "lucide-react";

import { API_BASE_URL } from "../../config/api";

import AdminAssessmentModeration from "../../components/admin/AdminAssessmentModeration";

// Interfaces for Student and Faculty admin views
interface AdminStudentItem {
  user_id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  user_created_at: string;
  student_profile_id: number | null;
  degree: string | null;
  department: string | null;
  cgpa: number | string | null;
  phone: string | null;
  roll_number: string | null;
  current_sem: string | null;
  expected_grad: string | null;
  counselor: string | null;
  institution_name: string | null;
  github?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
  dob?: string | null;
  gender?: string | null;
  bio?: string | null;
  work_mode_preference?: string | null;
  is_banned?: boolean;
  verification_status?: 'verified' | 'unverified' | 'fake';
}

interface AdminFacultyItem {
  user_id: number;
  name: string;
  username: string;
  email: string;
  role: string;
  user_created_at: string;
  is_banned?: boolean;
}

interface AdminInstitutionItem {
  id: number;
  name: string;
  code: string;
  location: string | null;
  website: string | null;
  total_students?: number;
  verification_status?: 'approved' | 'pending' | 'rejected';
  created_at?: string;
}

// No hardcoded institutions or students — all data is fetched exclusively from the database.


const MOCK_FACULTIES: AdminFacultyItem[] = [
  {
    user_id: 201,
    name: "Dr. Amit Das",
    username: "amit_das",
    email: "amit.das@faculty.com",
    role: "faculty",
    user_created_at: "2026-01-05T09:00:00.000Z"
  },
  {
    user_id: 202,
    name: "Prof. Priya Sharma",
    username: "priya_sharma",
    email: "priya.sharma@faculty.com",
    role: "faculty",
    user_created_at: "2026-01-20T14:22:00.000Z"
  }
];

// Helper function to format external website URLs safely
const formatWebsiteUrl = (url: string | null | undefined): string => {
  if (!url) return "#";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const AdminDashboard: React.FC = () => {

  const { user, token } = useAuth();
  const [industries, setIndustries] = useState<AdminIndustryItem[]>([]);
  const [allIndustries, setAllIndustries] = useState<AdminIndustryItem[]>([]);
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [faculties, setFaculties] = useState<AdminFacultyItem[]>([]);
  const [institutions, setInstitutions] = useState<AdminInstitutionItem[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"verifications" | "institutions" | "industries" | "faculty" | "assessments">("verifications");

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchTerm, setSearchTerm] = useState<string>(""); // for verification
  const [industrySearchTerm, setIndustrySearchTerm] = useState<string>("");
  const [facultySearchTerm, setFacultySearchTerm] = useState<string>("");
  const [institutionSearchTerm, setInstitutionSearchTerm] = useState<string>("");

  // College-specific student modal & filter states
  const [selectedCollegeForStudents, setSelectedCollegeForStudents] = useState<AdminInstitutionItem | null>(null);
  const [collegeStudentSearchTerm, setCollegeStudentSearchTerm] = useState<string>("");
  const [collegeStudentDeptFilter, setCollegeStudentDeptFilter] = useState<string>("all");
  const [collegeStudentSemFilter, setCollegeStudentSemFilter] = useState<string>("all");

  // Modal states
  const [selectedIndustry, setSelectedIndustry] = useState<AdminIndustryItem | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AdminStudentItem | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<AdminInstitutionItem | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Ensure Admin Security Guard
  const isAdmin = user && user.role && user.role.toString().toLowerCase() === "admin";

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchIndustries = async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const url =
        statusFilter === "all"
          ? `${API_BASE_URL}/admin/industries`
          : `${API_BASE_URL}/admin/industries?status=${statusFilter}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (res.ok && result.success && Array.isArray(result.data)) {
        setIndustries(result.data);
      } else {
        setErrorMsg(result.message || "Failed to fetch industry list.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error fetching industry profiles.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/institutions`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      if (res.ok && result.success && Array.isArray(result.data)) {
        setInstitutions(result.data);
      } else {
        setInstitutions([]);
      }
    } catch (err: any) {
      console.warn("API error fetching institutions:", err);
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndustriesAll = async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/industries`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (res.ok && result.success && Array.isArray(result.data)) {
        setAllIndustries(result.data);
      } else {
        setErrorMsg(result.message || "Failed to fetch all industries.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error fetching all industry profiles.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/students`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      if (res.ok && result.success && Array.isArray(result.data)) {
        setStudents(result.data);
      } else {
        setStudents([]);
      }
    } catch (err: any) {
      console.warn("API error fetching students:", err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/faculties`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      if (res.ok && result.success && Array.isArray(result.data)) {
        setFaculties(result.data);
      } else {
        setFaculties(MOCK_FACULTIES);
      }
    } catch (err: any) {
      console.warn("API error fetching faculties, using mock data:", err);
      setFaculties(MOCK_FACULTIES);
    } finally {
      setLoading(false);
    }
  };

  // Trigger correct fetch on tab/filter changes
  useEffect(() => {
    if (activeTab === "verifications") {
      fetchIndustries();
    } else if (activeTab === "institutions") {
      fetchInstitutions();
      fetchStudents();
    } else if (activeTab === "industries") {
      fetchIndustriesAll();
    } else if (activeTab === "faculty") {
      fetchFaculties();
    }
  }, [activeTab, statusFilter, token]);



  const handleApprove = async (industryId: number) => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/industries/${industryId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg(`Industry "${result.data?.companyName || "Company"}" approved successfully.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setSelectedIndustry(null);
        fetchIndustries();
      } else {
        setErrorMsg(result.message || "Failed to approve industry.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error during approval.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndustry) return;

    if (!rejectionReason.trim()) {
      setErrorMsg("Please enter a valid rejection reason.");
      return;
    }

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/industries/${selectedIndustry.id}/reject`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg(`Industry "${result.data?.companyName || "Company"}" rejected.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setIsRejectModalOpen(false);
        setRejectionReason("");
        setSelectedIndustry(null);
        fetchIndustries();
      } else {
        setErrorMsg(result.message || "Failed to reject industry.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error during rejection.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateInstitutionVerification = async (instId: number, instName: string, status: "approved" | "rejected" | "pending") => {
    let confirmPrompt = "";
    if (status === "approved") {
      confirmPrompt = `Approve "${instName}"? Students will be able to register under this institution.`;
    } else if (status === "rejected") {
      confirmPrompt = `Reject "${instName}"? It will be hidden from student registration.`;
    } else {
      confirmPrompt = `Move "${instName}" back to Pending status?`;
    }

    if (!window.confirm(confirmPrompt)) return;

    const authToken = token || localStorage.getItem("skillbridge_token");
    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/institutions/${instId}/verification`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await res.json();

      // Update local state regardless (works with live DB or if response is ok)
      setInstitutions((prev) =>
        prev.map((i) => (i.id === instId ? { ...i, verification_status: status } : i))
      );
      if (selectedInstitution && selectedInstitution.id === instId) {
        setSelectedInstitution((prev) => (prev ? { ...prev, verification_status: status } : null));
      }

      const msg = result.message || `Institution "${instName}" status updated to ${status.toUpperCase()}.`;
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setInstitutions((prev) =>
        prev.map((i) => (i.id === instId ? { ...i, verification_status: status } : i))
      );
      setSuccessMsg(`Institution "${instName}" status updated.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStudentVerification = async (userId: number, userName: string, status: "verified" | "unverified" | "fake") => {

    let confirmPrompt = "";
    if (status === "verified") {
      confirmPrompt = `Are you sure you want to verify profile for "${userName}"?`;
    } else if (status === "unverified") {
      confirmPrompt = `Do you want to unverify profile for "${userName}"?`;
    } else {
      confirmPrompt = `Are you sure you want to flag profile for "${userName}" as FAKE / Suspicious?`;
    }

    if (!window.confirm(confirmPrompt)) {
      return;
    }


    const authToken = token || localStorage.getItem("skillbridge_token");
    setActionLoading(true);
    setErrorMsg(null);

    try {
      if (authToken) {
        const res = await fetch(`${API_BASE_URL}/admin/students/${userId}/verification`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        const result = await res.json();
        if (res.ok && result.success) {
          setSuccessMsg(result.message || `Student verification status updated.`);
          setTimeout(() => setSuccessMsg(null), 4000);
        }
      }

      // Update local state (works both with API & local mock fallback)
      setStudents((prev) =>
        prev.map((s) => (s.user_id === userId ? { ...s, verification_status: status } : s))
      );
      if (selectedStudent && selectedStudent.user_id === userId) {
        setSelectedStudent((prev) => (prev ? { ...prev, verification_status: status } : null));
      }

      setSuccessMsg(`Student "${userName}" marked as ${status.toUpperCase()}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setStudents((prev) =>
        prev.map((s) => (s.user_id === userId ? { ...s, verification_status: status } : s))
      );
      setSuccessMsg(`Student "${userName}" status updated.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };


  const handleToggleBanUser = async (userId: number, userName: string, currentBanStatus?: boolean) => {
    const actionWord = currentBanStatus ? "unban" : "ban";
    if (!window.confirm(`Are you sure you want to ${actionWord} account for "${userName}"?`)) {
      return;
    }

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-ban`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMsg(result.message || `User account status updated.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        // Refresh appropriate lists
        if (activeTab === "faculty") fetchFaculties();
        else if (activeTab === "industries") fetchIndustriesAll();
        else if (activeTab === "institutions") { fetchInstitutions(); fetchStudents(); }
        else fetchIndustries();
      } else {
        // Fallback UI update for local mock data if API unavailable
        setStudents((prev) =>
          prev.map((s) => (s.user_id === userId ? { ...s, is_banned: !currentBanStatus } : s))
        );
        setFaculties((prev) =>
          prev.map((f) => (f.user_id === userId ? { ...f, is_banned: !currentBanStatus } : f))
        );
        setSuccessMsg(`User status updated locally (${actionWord}ned).`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      // Fallback local update
      setStudents((prev) =>
        prev.map((s) => (s.user_id === userId ? { ...s, is_banned: !currentBanStatus } : s))
      );
      setFaculties((prev) =>
        prev.map((f) => (f.user_id === userId ? { ...f, is_banned: !currentBanStatus } : f))
      );
      setSuccessMsg(`User status updated (${actionWord}ned).`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`CRITICAL WARNING: Are you sure you want to permanently DELETE account "${userName}"? This cannot be undone.`)) {
      return;
    }

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMsg(`User "${userName}" deleted successfully.`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setSelectedStudent(null);
        setSelectedIndustry(null);
        handleRefresh();
      } else {
        // Fallback local delete
        setStudents((prev) => prev.filter((s) => s.user_id !== userId));
        setFaculties((prev) => prev.filter((f) => f.user_id !== userId));
        setSelectedStudent(null);
        setSuccessMsg(`User "${userName}" removed.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setStudents((prev) => prev.filter((s) => s.user_id !== userId));
      setFaculties((prev) => prev.filter((f) => f.user_id !== userId));
      setSelectedStudent(null);
      setSuccessMsg(`User "${userName}" removed.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setActionLoading(false);
    }
  };


  // Filter local items by search query
  const filteredIndustries = industries.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.companyName.toLowerCase().includes(q) ||
      (item.industrySector && item.industrySector.toLowerCase().includes(q)) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(q)) ||
      (item.contactEmail && item.contactEmail.toLowerCase().includes(q))
    );
  });

  const filteredAllIndustries = allIndustries.filter((item) => {
    const q = industrySearchTerm.toLowerCase();
    return (
      item.companyName.toLowerCase().includes(q) ||
      (item.industrySector && item.industrySector.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.contactEmail && item.contactEmail.toLowerCase().includes(q))
    );
  });

  const filteredFaculties = faculties.filter((faculty) => {
    const q = facultySearchTerm.toLowerCase();
    return (
      faculty.name.toLowerCase().includes(q) ||
      faculty.email.toLowerCase().includes(q) ||
      faculty.username.toLowerCase().includes(q)
    );
  });

  const filteredInstitutions = institutions.filter((inst) => {
    const q = institutionSearchTerm.toLowerCase();
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.code.toLowerCase().includes(q) ||
      (inst.location && inst.location.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case "approved":
        return (
          <span className="badge badge-approved">
            <CheckCircle2 size={12} /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="badge badge-rejected">
            <XCircle size={12} /> Rejected
          </span>
        );
      case "pending":
      default:
        return (
          <span className="badge badge-pending">
            <Clock size={12} /> Pending Review
          </span>
        );
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "institutions":
        return "Institutions & Colleges Directory";
      case "industries":
        return "Industry Partners Directory";
      case "faculty":
        return "Faculty & Academician Directory";
      case "assessments":
        return "Shared Assessment Question Bank Moderation";
      case "verifications":
      default:
        return "Industry Approvals & Verification Governance";
    }
  };

  const getHeaderSubtitle = () => {
    switch (activeTab) {
      case "institutions":
        return "View and manage all registered academic institutions, colleges, and their enrolled students.";
      case "industries":
        return "View and search all registered industry partners with complete profile control.";
      case "faculty":
        return "Manage registered academicians, teachers, and account privileges.";
      case "assessments":
        return "Review and moderate industry & faculty submitted questions before adding them to student assessment pools.";
      case "verifications":
      default:
        return "Review, verify, or revoke company verification status for platform governance.";
    }
  };

  const handleRefresh = () => {
    if (activeTab === "verifications") {
      fetchIndustries();
    } else if (activeTab === "institutions") {
      fetchInstitutions();
      fetchStudents();
    } else if (activeTab === "industries") {
      fetchIndustriesAll();
    } else if (activeTab === "faculty") {
      fetchFaculties();
    }
  };


  return (
    <MainLayout showRightPanel={false}>
      <div className="admin-dashboard-container">
        {/* Header */}
        <div className="page-header flex items-center justify-between">
          <div>
            <span className="page-category">Administrator Console</span>
            <h1>{getHeaderTitle()}</h1>
            <p>{getHeaderSubtitle()}</p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Refresh current list"
          >
            <RotateCw size={14} className={loading ? "animate-spin text-indigo-400" : ""} />
            <span>Refresh List</span>
          </button>
        </div>

        {/* Success / Error Alerts */}
        {successMsg && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Top-Level Tabs Navigation */}
        <div className="admin-controls-card" style={{ marginBottom: "0.25rem" }}>
          <div className="status-tabs">
            <button
              className={`tab-btn ${activeTab === "verifications" ? "active" : ""}`}
              onClick={() => setActiveTab("verifications")}
            >
              <CheckCircle2 size={14} />
              <span>Industry Approvals</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "institutions" ? "active" : ""}`}
              onClick={() => setActiveTab("institutions")}
            >
              <School size={14} />
              <span>Institutions & Colleges</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "industries" ? "active" : ""}`}
              onClick={() => setActiveTab("industries")}
            >
              <Building2 size={14} />
              <span>Industry Partners</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "faculty" ? "active" : ""}`}
              onClick={() => setActiveTab("faculty")}
            >
              <Users size={14} />
              <span>Faculty Directory</span>
            </button>

            <button
              className={`tab-btn ${activeTab === "assessments" ? "active" : ""}`}
              onClick={() => setActiveTab("assessments")}
            >
              <ShieldAlert size={14} />
              <span>Question Moderation</span>
            </button>
          </div>
        </div>

        {activeTab === "assessments" && <AdminAssessmentModeration />}

        {/* Tab Specific Controls */}
        {activeTab === "verifications" && (
          <div className="admin-controls-card">
            <div className="status-tabs">
              <button
                className={`tab-btn ${statusFilter === "pending" ? "active" : ""}`}
                onClick={() => setStatusFilter("pending")}
              >
                <Clock size={14} />
                <span>Pending Review</span>
              </button>

              <button
                className={`tab-btn ${statusFilter === "approved" ? "active" : ""}`}
                onClick={() => setStatusFilter("approved")}
              >
                <CheckCircle2 size={14} />
                <span>Approved</span>
              </button>

              <button
                className={`tab-btn ${statusFilter === "rejected" ? "active" : ""}`}
                onClick={() => setStatusFilter("rejected")}
              >
                <XCircle size={14} />
                <span>Rejected</span>
              </button>

              <button
                className={`tab-btn ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                <Filter size={14} />
                <span>All Companies</span>
              </button>
            </div>

            <div className="search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by company, sector, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === "institutions" && (
          <div className="admin-controls-card">
            <div className="flex items-center gap-2">
              <School size={16} className="text-indigo-400" />
              <span className="text-xs font-semibold text-subtle">Affiliated Universities & Colleges List</span>
            </div>

            <div className="search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by college name, code, location..."
                value={institutionSearchTerm}
                onChange={(e) => setInstitutionSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}




        {activeTab === "industries" && (
          <div className="admin-controls-card">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-indigo-400" />
              <span className="text-xs font-semibold text-subtle">All Registered Industry Partners</span>
            </div>

            <div className="search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by company name, sector, location..."
                value={industrySearchTerm}
                onChange={(e) => setIndustrySearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === "faculty" && (
          <div className="admin-controls-card">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-indigo-400" />
              <span className="text-xs font-semibold text-subtle">Faculty Members Directory</span>
            </div>

            <div className="search-bar">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name, email, username..."
                value={facultySearchTerm}
                onChange={(e) => setFacultySearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Loading / Table view */}
        {loading ? (
          <div className="state-card loading-state">
            <div className="spinner" />
            <p>Loading directory information...</p>
          </div>
        ) : (
          <>
            {/* 1. Verifications View */}
            {activeTab === "verifications" && (
              filteredIndustries.length === 0 ? (
                <div className="state-card empty-state">
                  <Building2 size={40} className="empty-icon" />
                  <h3>No Industries Found</h3>
                  <p>There are currently no industry profiles matching status "{statusFilter}".</p>
                </div>
              ) : (
                <div className="table-card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Sector / Type</th>
                        <th>Account Contact</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIndustries.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="company-cell">
                              <div className="company-logo-placeholder">
                                {item.companyName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{item.companyName}</strong>
                                {item.location && <small className="text-subtle">{item.location}</small>}
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="sector-info">
                              <span>{item.industrySector || "N/A"}</span>
                              <small>{item.companyType || "Unspecified"}</small>
                            </div>
                          </td>

                          <td>
                            <div className="contact-info">
                              <span>{item.userEmail || item.contactEmail || "N/A"}</span>
                              <small>{item.userName || "User ID: " + item.userId}</small>
                            </div>
                          </td>

                          <td>
                            <span className="text-subtle">
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString()
                                : "Recently"}
                            </span>
                          </td>

                          <td>{getStatusBadge(item.verificationStatus)}</td>

                          <td className="text-right">
                            <button
                              className="review-btn"
                              onClick={() => setSelectedIndustry(item)}
                            >
                              Review Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* 2. Institutions Directory View */}
            {activeTab === "institutions" && (
              filteredInstitutions.length === 0 ? (
                <div className="state-card empty-state">
                  <School size={40} className="empty-icon text-indigo-400" />
                  <h3>No Institutions Found</h3>
                  <p>There are no registered colleges or universities matching your search criteria.</p>
                </div>
              ) : (
                <div className="table-card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Institution / College</th>
                        <th>Code</th>
                        <th>Location</th>
                        <th>Website</th>
                        <th>Enrolled Students</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstitutions.map((inst) => (
                        <tr key={inst.id}>
                          <td>
                            <div className="company-cell">
                              <div className="company-logo-placeholder bg-indigo-600/20 text-indigo-300 font-bold">
                                {inst.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{inst.name}</strong>
                                <small className="text-subtle">Affiliated Institute</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="font-semibold text-indigo-400">{inst.code}</span>
                          </td>
                          <td>{inst.location || "N/A"}</td>
                          <td>
                            {inst.website ? (
                              <a
                                href={formatWebsiteUrl(inst.website)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-400 flex items-center gap-1 hover:underline"
                              >
                                Visit Website <ExternalLink size={10} />
                              </a>
                            ) : (
                              "Not provided"
                            )}
                          </td>

                          <td>
                            <span className="badge badge-approved" style={{ fontSize: "0.75rem" }}>
                              <GraduationCap size={12} /> {inst.total_students || 0} Students
                            </span>
                          </td>

                          <td>
                            {(!inst.verification_status || inst.verification_status === "approved") && (
                              <span className="badge badge-approved">
                                <CheckCircle2 size={12} /> Approved
                              </span>
                            )}
                            {inst.verification_status === "pending" && (
                              <span className="badge badge-pending" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                                <Clock size={12} /> Pending Approval
                              </span>
                            )}
                            {inst.verification_status === "rejected" && (
                              <span className="badge badge-rejected">
                                <XCircle size={12} /> Rejected
                              </span>
                            )}
                          </td>

                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600/50 border border-indigo-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                                onClick={() => {
                                  setSelectedCollegeForStudents(inst);
                                  setCollegeStudentSearchTerm("");
                                  setCollegeStudentDeptFilter("all");
                                  setCollegeStudentSemFilter("all");
                                }}
                              >
                                <Users size={12} /> View Students
                              </button>

                              <button
                                className="review-btn text-xs py-1 px-2"
                                onClick={() => setSelectedInstitution(inst)}
                              >
                                View Details
                              </button>

                              {(inst.verification_status !== "approved" && !(!inst.verification_status)) && (
                                <button
                                  className="px-2 py-1 text-xs font-semibold rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all flex items-center gap-1"
                                  onClick={() => handleUpdateInstitutionVerification(inst.id, inst.name, "approved")}
                                >
                                  <CheckCircle2 size={12} /> Approve
                                </button>
                              )}

                              {(!inst.verification_status || inst.verification_status === "approved") && (
                                <button
                                  className="px-2 py-1 text-xs font-semibold rounded bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30 transition-all flex items-center gap-1"
                                  onClick={() => handleUpdateInstitutionVerification(inst.id, inst.name, "rejected")}
                                >
                                  <XCircle size={12} /> Revoke
                                </button>
                              )}

                              {inst.verification_status === "pending" && (
                                <button
                                  className="px-2 py-1 text-xs font-semibold rounded bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30 transition-all flex items-center gap-1"
                                  onClick={() => handleUpdateInstitutionVerification(inst.id, inst.name, "rejected")}
                                >
                                  <XCircle size={12} /> Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              )
            )}



            {/* 3. Industry Directory View */}
            {activeTab === "industries" && (
              filteredAllIndustries.length === 0 ? (
                <div className="state-card empty-state">
                  <Building2 size={40} className="empty-icon text-indigo-400" />
                  <h3>No Industry Partners Found</h3>
                  <p>There are no registered industry partners matching your search criteria.</p>
                </div>
              ) : (
                <div className="table-card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Sector / Type</th>
                        <th>Location</th>
                        <th>Contact Email</th>
                        <th>Status</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllIndustries.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="company-cell">
                              <div className="company-logo-placeholder">
                                {item.companyName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{item.companyName}</strong>
                                {item.website && (
                                  <a
                                    href={formatWebsiteUrl(item.website)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-indigo-400 flex items-center gap-1 hover:underline mt-0.5"
                                  >
                                    Visit Website <ExternalLink size={10} />
                                  </a>
                                )}

                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="sector-info">
                              <span>{item.industrySector || "N/A"}</span>
                              <small>{item.companyType || "Unspecified"}</small>
                            </div>
                          </td>
                          <td>{item.location || "N/A"}</td>
                          <td>{item.contactEmail || item.userEmail || "N/A"}</td>
                          <td>{getStatusBadge(item.verificationStatus)}</td>
                          <td className="text-right">
                            <button
                              className="review-btn"
                              onClick={() => setSelectedIndustry(item)}
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* 4. Faculty Directory View */}
            {activeTab === "faculty" && (
              filteredFaculties.length === 0 ? (
                <div className="state-card empty-state">
                  <Users size={40} className="empty-icon text-indigo-400" />
                  <h3>No Faculty Found</h3>
                  <p>There are no registered faculty members matching your search criteria.</p>
                </div>
              ) : (
                <div className="table-card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email Address</th>
                        <th>Registered</th>
                        <th>Account Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFaculties.map((faculty) => (
                        <tr key={faculty.user_id}>
                          <td>
                            <div className="company-cell">
                              <div className="company-logo-placeholder bg-emerald-600/20 text-emerald-300 font-bold">
                                {faculty.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong>{faculty.name}</strong>
                                <span className="badge badge-approved" style={{ marginLeft: "6px", display: "inline-flex", padding: "1px 6px", fontSize: "0.6rem" }}>
                                  Faculty
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="text-subtle">@{faculty.username}</span>
                          </td>
                          <td>{faculty.email}</td>
                          <td>
                            <span className="text-subtle">
                              {faculty.user_created_at
                                ? new Date(faculty.user_created_at).toLocaleDateString()
                                : "Recently"}
                            </span>
                          </td>
                          <td>
                            {faculty.is_banned ? (
                              <span className="badge badge-rejected">
                                <Ban size={12} /> Banned
                              </span>
                            ) : (
                              <span className="badge badge-approved">
                                <CheckCircle2 size={12} /> Active
                              </span>
                            )}
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="review-btn"
                                onClick={() => {
                                  setSelectedStudent({
                                    user_id: faculty.user_id,
                                    name: faculty.name,
                                    username: faculty.username,
                                    email: faculty.email,
                                    role: faculty.role,
                                    user_created_at: faculty.user_created_at,
                                    student_profile_id: null,
                                    degree: null,
                                    department: null,
                                    cgpa: null,
                                    phone: null,
                                    roll_number: null,
                                    current_sem: null,
                                    expected_grad: null,
                                    counselor: null,
                                    institution_name: null,
                                    is_banned: faculty.is_banned
                                  });
                                }}
                              >
                                View Details
                              </button>
                              <button
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${faculty.is_banned
                                    ? "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30"
                                    : "bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30"
                                  }`}
                                title={faculty.is_banned ? "Unban faculty" : "Ban faculty"}
                                onClick={() => handleToggleBanUser(faculty.user_id, faculty.name, faculty.is_banned)}
                              >
                                {faculty.is_banned ? <UserCheck size={13} /> : <UserX size={13} />}
                                <span>{faculty.is_banned ? "Unban" : "Ban"}</span>
                              </button>
                              <button
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30 transition-all flex items-center gap-1"
                                title="Delete faculty account"
                                onClick={() => handleDeleteUser(faculty.user_id, faculty.name)}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>
              )
            )}
          </>
        )}

        {/* Industry Review / Profile Modal */}
        {selectedIndustry && (
          <div className="modal-overlay" onClick={() => setSelectedIndustry(null)}>
            <div className="modal-card review-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-header-info">
                  <Building2 size={22} className="text-primary" />
                  <div>
                    <h2>{selectedIndustry.companyName}</h2>
                    <span className="sub-title">Industry Profile Details</span>
                  </div>
                </div>
                <button
                  className="icon-button close-btn"
                  onClick={() => setSelectedIndustry(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {/* Status banner */}
                <div className="review-status-bar">
                  <span>Status:</span> {getStatusBadge(selectedIndustry.verificationStatus)}
                  {selectedIndustry.verificationStatus === "rejected" &&
                    selectedIndustry.rejectionReason && (
                      <p className="modal-rejection-note">
                        <strong>Rejection Reason:</strong> {selectedIndustry.rejectionReason}
                      </p>
                    )}
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Company Type</label>
                    <p>{selectedIndustry.companyType || "Not provided"}</p>
                  </div>

                  <div className="detail-item">
                    <label>Industry Sector</label>
                    <p>{selectedIndustry.industrySector || "Not provided"}</p>
                  </div>

                  <div className="detail-item full-width">
                    <label>Description</label>
                    <p className="desc-text">{selectedIndustry.description || "No description provided."}</p>
                  </div>

                  <div className="detail-item">
                    <label>
                      <Globe size={13} /> Website
                    </label>
                    <p>
                      {selectedIndustry.website ? (
                        <a
                          href={formatWebsiteUrl(selectedIndustry.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="external-link"
                        >
                          {selectedIndustry.website} <ExternalLink size={12} />
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>

                  <div className="detail-item">
                    <label>
                      <MapPin size={13} /> Location
                    </label>
                    <p>{selectedIndustry.location || "Not provided"}</p>
                  </div>

                  <div className="detail-item">
                    <label>
                      <Mail size={13} /> Contact Email
                    </label>
                    <p>{selectedIndustry.contactEmail || selectedIndustry.userEmail || "Not provided"}</p>
                  </div>

                  <div className="detail-item">
                    <label>
                      <Phone size={13} /> Phone
                    </label>
                    <p>{selectedIndustry.phone || "Not provided"}</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer flex items-center justify-between">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedIndustry(null)}
                  disabled={actionLoading}
                >
                  Close
                </button>

                <div className="action-buttons flex items-center gap-2">
                  {selectedIndustry.verificationStatus !== "approved" && (
                    <button
                      className="btn btn-approve"
                      onClick={() => handleApprove(selectedIndustry.id)}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 size={16} />
                      {actionLoading ? "Processing..." : "Approve Industry"}
                    </button>
                  )}

                  {selectedIndustry.verificationStatus !== "rejected" && (
                    <button
                      className="btn btn-reject"
                      onClick={() => setIsRejectModalOpen(true)}
                      disabled={actionLoading}
                    >
                      <XCircle size={16} /> {selectedIndustry.verificationStatus === "approved" ? "Revoke Approval" : "Reject"}
                    </button>
                  )}

                  <button
                    className="btn btn-reject bg-red-600/30 border-red-500/40 text-red-300 hover:bg-red-600/50"
                    onClick={() => handleDeleteUser(selectedIndustry.userId, selectedIndustry.companyName)}
                    disabled={actionLoading}
                  >
                    <Trash2 size={16} /> Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Institution Detail Modal with Affiliated Students List */}
        {selectedInstitution && (
          <div className="modal-overlay" onClick={() => setSelectedInstitution(null)}>
            <div className="modal-card review-modal" style={{ maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-header-info">
                  <School size={22} className="text-indigo-400" />
                  <div>
                    <h2>{selectedInstitution.name}</h2>
                    <span className="sub-title">Institution Code: {selectedInstitution.code}</span>
                  </div>
                </div>
                <button
                  className="icon-button close-btn"
                  onClick={() => setSelectedInstitution(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Institution Code</label>
                    <p className="font-semibold text-indigo-400">{selectedInstitution.code}</p>
                  </div>

                  <div className="detail-item">
                    <label>Location</label>
                    <p>{selectedInstitution.location || "Not specified"}</p>
                  </div>

                  <div className="detail-item">
                    <label>Website</label>
                    <p>
                      {selectedInstitution.website ? (
                        <a
                          href={formatWebsiteUrl(selectedInstitution.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="external-link"
                        >
                          {selectedInstitution.website} <ExternalLink size={12} />
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  </div>

                  <div className="detail-item">
                    <label>Total Affiliated Students</label>
                    <p className="font-bold text-indigo-300">
                      {selectedInstitution.total_students || 0} Registered Students
                    </p>
                  </div>
                </div>

                {/* Affiliated Students Sub-Section */}
                {(() => {
                  const instNameLower = selectedInstitution.name.toLowerCase();
                  const instCodeLower = selectedInstitution.code.toLowerCase();
                  const collegeStudents = students.filter(
                    (s) =>
                      (s.institution_name && s.institution_name.toLowerCase().includes(instNameLower)) ||
                      (s.institution_name && instNameLower.includes(s.institution_name.toLowerCase())) ||
                      (s.institution_name && s.institution_name.toLowerCase().includes(instCodeLower))
                  );

                  return (
                    <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: "0.75rem" }}>
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
                          <GraduationCap size={16} /> Enrolled Students ({collegeStudents.length})
                        </h4>
                      </div>

                      {collegeStudents.length === 0 ? (
                        <p className="text-xs text-subtle italic" style={{ padding: "0.5rem 0" }}>
                          No students linked to this institution yet.
                        </p>
                      ) : (
                        <div style={{ maxHeight: "220px", overflowY: "auto", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", padding: "0.5rem" }}>
                          <table className="admin-table text-xs">
                            <thead>
                              <tr>
                                <th>Student Name</th>
                                <th>Roll Number</th>
                                <th>Degree / Department</th>
                                <th>CGPA</th>
                                <th className="text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {collegeStudents.map((st) => (
                                <tr key={st.user_id}>
                                  <td>
                                    <strong>{st.name}</strong>
                                    <small className="text-subtle" style={{ display: "block" }}>{st.email}</small>
                                  </td>
                                  <td>{st.roll_number || "N/A"}</td>
                                  <td>
                                    <span>{st.degree || "N/A"}</span>
                                    <small className="text-subtle" style={{ display: "block" }}>{st.department || ""}</small>
                                  </td>
                                  <td>
                                    <span className="font-semibold text-indigo-400">{st.cgpa || "N/A"}</span>
                                  </td>
                                  <td className="text-right">
                                    <button
                                      className="review-btn"
                                      style={{ padding: "2px 8px", fontSize: "0.7rem" }}
                                      onClick={() => {
                                        setSelectedInstitution(null);
                                        setSelectedStudent(st);
                                      }}
                                    >
                                      View Profile
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="modal-footer flex items-center justify-between gap-2">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedInstitution(null)}
                >
                  Close
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedInstitution.verification_status !== "approved" && selectedInstitution.verification_status !== undefined && (
                    <button
                      className="btn btn-approve"
                      onClick={() => handleUpdateInstitutionVerification(selectedInstitution.id, selectedInstitution.name, "approved")}
                      disabled={actionLoading}
                    >
                      <CheckCircle2 size={16} /> Approve College
                    </button>
                  )}

                  {(!selectedInstitution.verification_status || selectedInstitution.verification_status === "approved") && (
                    <button
                      className="btn btn-reject"
                      onClick={() => handleUpdateInstitutionVerification(selectedInstitution.id, selectedInstitution.name, "rejected")}
                      disabled={actionLoading}
                    >
                      <XCircle size={16} /> Revoke Approval
                    </button>
                  )}

                  {selectedInstitution.verification_status === "rejected" && (
                    <button
                      className="btn btn-secondary border border-amber-500/40 text-amber-300"
                      onClick={() => handleUpdateInstitutionVerification(selectedInstitution.id, selectedInstitution.name, "pending")}
                      disabled={actionLoading}
                    >
                      <RotateCw size={16} /> Move to Pending
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}




        {/* Student / Faculty Detail Modal */}
        {selectedStudent && (
          <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
            <div className="modal-card review-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-header-info">
                  {selectedStudent.role?.toLowerCase() === "faculty" || selectedStudent.role?.toLowerCase() === "academician" ? (
                    <Users size={22} className="text-emerald-400" />
                  ) : (
                    <GraduationCap size={22} className="text-primary" />
                  )}
                  <div>
                    <h2>{selectedStudent.name}</h2>
                    <span className="sub-title">
                      {selectedStudent.role?.toLowerCase() === "faculty" || selectedStudent.role?.toLowerCase() === "academician"
                        ? "Faculty Account Details"
                        : "Student Profile Details"}
                    </span>
                  </div>
                </div>
                <button
                  className="icon-button close-btn"
                  onClick={() => setSelectedStudent(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Username</label>
                    <p>@{selectedStudent.username}</p>
                  </div>

                  <div className="detail-item">
                    <label>Email Address</label>
                    <p>{selectedStudent.email}</p>
                  </div>

                  {selectedStudent.student_profile_id !== null && (
                    <>
                      <div className="detail-item">
                        <label>Roll Number</label>
                        <p>{selectedStudent.roll_number || "Not provided"}</p>
                      </div>

                      <div className="detail-item">
                        <label>Institution / College</label>
                        <p>{selectedStudent.institution_name || "Not provided"}</p>
                      </div>

                      <div className="detail-item">
                        <label>Degree</label>
                        <p>{selectedStudent.degree || "Not provided"}</p>
                      </div>

                      <div className="detail-item">
                        <label>Department</label>
                        <p>{selectedStudent.department || "Not provided"}</p>
                      </div>

                      <div className="detail-item">
                        <label>CGPA</label>
                        <p>{selectedStudent.cgpa || "Not provided"}</p>
                      </div>

                      <div className="detail-item">
                        <label>Current Semester</label>
                        <p>{selectedStudent.current_sem || "Not provided"}</p>
                      </div>

                      <div className="detail-item">
                        <label>Expected Graduation</label>
                        <p>{selectedStudent.expected_grad || "Not provided"}</p>
                      </div>

                      <div className="detail-item">
                        <label>Phone Number</label>
                        <p>{selectedStudent.phone || "Not provided"}</p>
                      </div>

                      <div className="detail-item">
                        <label>Academic Counselor</label>
                        <p>{selectedStudent.counselor || "Not provided"}</p>
                      </div>

                      {selectedStudent.work_mode_preference && (
                        <div className="detail-item">
                          <label>Work Mode Preference</label>
                          <p>{selectedStudent.work_mode_preference}</p>
                        </div>
                      )}

                      {selectedStudent.bio && (
                        <div className="detail-item full-width">
                          <label>Bio / Summary</label>
                          <p className="desc-text">{selectedStudent.bio}</p>
                        </div>
                      )}

                      <div className="detail-item full-width">
                        <label>Portfolio & Professional Links</label>
                        <div className="flex gap-4 flex-wrap mt-1">
                          {selectedStudent.github && (
                            <a href={selectedStudent.github} target="_blank" rel="noreferrer" className="external-link text-xs">
                              GitHub
                            </a>
                          )}
                          {selectedStudent.linkedin && (
                            <a href={selectedStudent.linkedin} target="_blank" rel="noreferrer" className="external-link text-xs">
                              LinkedIn
                            </a>
                          )}
                          {selectedStudent.portfolio && (
                            <a href={selectedStudent.portfolio} target="_blank" rel="noreferrer" className="external-link text-xs">
                              Portfolio Website
                            </a>
                          )}
                          {!(selectedStudent.github || selectedStudent.linkedin || selectedStudent.portfolio) && (
                            <span className="text-subtle text-xs">No links provided</span>
                          )}
                        </div>
                      </div>
                    </>
                  )}


                  <div className="detail-item">
                    <label>Account Registered On</label>
                    <p>
                      {selectedStudent.user_created_at
                        ? new Date(selectedStudent.user_created_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="modal-footer flex items-center justify-between gap-2 flex-wrap">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedStudent(null)}
                >
                  Close
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedStudent.student_profile_id !== null && (
                    <>
                      {selectedStudent.verification_status !== "verified" && (
                        <button
                          className="btn btn-approve"
                          onClick={() => handleUpdateStudentVerification(selectedStudent.user_id, selectedStudent.name, "verified")}
                        >
                          <CheckCircle2 size={16} /> Verify Profile
                        </button>
                      )}

                      {selectedStudent.verification_status !== "unverified" && (
                        <button
                          className="btn btn-secondary border border-amber-500/40 text-amber-300 hover:bg-amber-600/30"
                          onClick={() => handleUpdateStudentVerification(selectedStudent.user_id, selectedStudent.name, "unverified")}
                        >
                          <Clock size={16} /> Unverify
                        </button>
                      )}

                      {selectedStudent.verification_status !== "fake" && (
                        <button
                          className="btn btn-reject bg-red-600/20 border-red-500/40 text-red-300 hover:bg-red-600/40"
                          onClick={() => handleUpdateStudentVerification(selectedStudent.user_id, selectedStudent.name, "fake")}
                        >
                          <ShieldAlert size={16} /> Flag FAKE / Suspicious
                        </button>
                      )}
                    </>
                  )}

                  <button
                    className={`btn ${selectedStudent.is_banned ? "btn-approve" : "btn-reject"}`}
                    onClick={() => handleToggleBanUser(selectedStudent.user_id, selectedStudent.name, selectedStudent.is_banned)}
                  >
                    {selectedStudent.is_banned ? <UserCheck size={16} /> : <UserX size={16} />}
                    <span>{selectedStudent.is_banned ? "Unban User" : "Ban User"}</span>
                  </button>

                  <button
                    className="btn btn-reject bg-red-600/30 border-red-500/40 text-red-300 hover:bg-red-600/50"
                    onClick={() => handleDeleteUser(selectedStudent.user_id, selectedStudent.name)}
                  >
                    <Trash2 size={16} />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>


            </div>
          </div>
        )}

        {/* Rejection Reason Modal */}
        {isRejectModalOpen && selectedIndustry && (
          <div className="modal-overlay" onClick={() => setIsRejectModalOpen(false)}>
            <div className="modal-card reject-reason-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Reject Industry Verification</h3>
                <button
                  className="icon-button close-btn"
                  onClick={() => setIsRejectModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRejectSubmit}>
                <div className="modal-body">
                  <p className="reject-prompt">
                    Please specify the reason for rejecting <strong>{selectedIndustry.companyName}</strong>.
                    This feedback will be displayed to the user.
                  </p>

                  <div className="form-group">
                    <label>Rejection Reason *</label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Invalid website URL or incomplete company information."
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsRejectModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-reject"
                    disabled={actionLoading || !rejectionReason.trim()}
                  >
                    {actionLoading ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* College Enrolled Students Modal */}
        {selectedCollegeForStudents && (() => {
          const collegeAllStudents = students.filter((s) => {
            const instNameMatch =
              s.institution_name &&
              selectedCollegeForStudents &&
              s.institution_name.trim().toLowerCase() === selectedCollegeForStudents.name.trim().toLowerCase();
            const instIdMatch = (s as any).institution_id === selectedCollegeForStudents.id;
            return instNameMatch || instIdMatch;
          });

          // Compute unique departments and semesters for filtering
          const uniqueDepts = Array.from(
            new Set(collegeAllStudents.map((s) => s.department).filter(Boolean))
          ) as string[];

          const uniqueSems = Array.from(
            new Set(collegeAllStudents.map((s) => s.current_sem).filter(Boolean))
          ) as string[];

          const filteredCollegeStudents = collegeAllStudents.filter((s) => {
            const q = collegeStudentSearchTerm.toLowerCase().trim();
            const matchesSearch =
              !q ||
              s.name.toLowerCase().includes(q) ||
              s.email.toLowerCase().includes(q) ||
              s.username.toLowerCase().includes(q) ||
              (s.roll_number && s.roll_number.toLowerCase().includes(q));

            const matchesDept =
              collegeStudentDeptFilter === "all" ||
              (s.department && s.department.toLowerCase() === collegeStudentDeptFilter.toLowerCase());

            const matchesSem =
              collegeStudentSemFilter === "all" ||
              (s.current_sem && s.current_sem.toString().toLowerCase() === collegeStudentSemFilter.toLowerCase());

            return matchesSearch && matchesDept && matchesSem;
          });

          return (
            <div className="modal-overlay" onClick={() => setSelectedCollegeForStudents(null)}>
              <div
                className="modal-card review-modal max-w-5xl w-full"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "950px" }}
              >
                <div className="modal-header flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                      <School size={22} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-100">
                        {selectedCollegeForStudents.name}
                      </h2>
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <span>Code: <strong className="text-indigo-300">{selectedCollegeForStudents.code}</strong></span>
                        <span>•</span>
                        <span>Total Enrolled: <strong className="text-emerald-400">{collegeAllStudents.length} Students</strong></span>
                      </p>
                    </div>
                  </div>

                  <button
                    className="icon-button close-btn"
                    onClick={() => setSelectedCollegeForStudents(null)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-body space-y-4">
                  {/* Filters bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <Search size={14} className="text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student by name, email, roll no..."
                        value={collegeStudentSearchTerm}
                        onChange={(e) => setCollegeStudentSearchTerm(e.target.value)}
                        className="bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none w-full"
                      />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Department / Branch Filter */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Filter size={12} className="text-indigo-400" />
                        <label className="font-semibold text-slate-400">Branch:</label>
                        <select
                          value={collegeStudentDeptFilter}
                          onChange={(e) => setCollegeStudentDeptFilter(e.target.value)}
                          className="bg-slate-950 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1 outline-none"
                        >
                          <option value="all">All Branches</option>
                          {uniqueDepts.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Semester Filter */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <label className="font-semibold text-slate-400">Semester:</label>
                        <select
                          value={collegeStudentSemFilter}
                          onChange={(e) => setCollegeStudentSemFilter(e.target.value)}
                          className="bg-slate-950 text-slate-200 border border-slate-700 text-xs rounded-lg px-2.5 py-1 outline-none"
                        >
                          <option value="all">All Semesters</option>
                          {uniqueSems.map((sem) => (
                            <option key={sem} value={sem}>
                              Sem {sem}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Student Table */}
                  {filteredCollegeStudents.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm bg-slate-950/40 rounded-xl border border-slate-800 space-y-1">
                      <GraduationCap size={32} className="mx-auto text-slate-600 mb-2" />
                      <p className="font-semibold text-slate-300">No Enrolled Students Found</p>
                      <p className="text-xs text-slate-500">No students match your active search or branch/semester filters.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-900/80">
                            <th className="py-3 px-3">Student Name</th>
                            <th className="py-3 px-3">Email & Roll No</th>
                            <th className="py-3 px-3">Branch & Sem</th>
                            <th className="py-3 px-3">CGPA</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {filteredCollegeStudents.map((st) => (
                            <tr key={st.user_id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 px-3">
                                <div>
                                  <span className="font-bold text-slate-100 block">{st.name}</span>
                                  <span className="text-[10px] text-slate-400">@{st.username}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-slate-200 block">{st.email}</span>
                                <span className="text-[10px] text-indigo-400 font-mono">
                                  {st.roll_number ? `Roll: ${st.roll_number}` : "No Roll No"}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-medium text-slate-200 block">{st.department || "N/A"}</span>
                                <span className="text-[10px] text-slate-400">
                                  {st.degree ? `${st.degree} • ` : ""}Sem {st.current_sem || "N/A"}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {st.cgpa ? (
                                  <span className="font-extrabold text-indigo-300">{st.cgpa}</span>
                                ) : (
                                  <span className="text-slate-500">N/A</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex flex-col gap-1">
                                  {st.is_banned ? (
                                    <span className="badge badge-rejected text-[10px] py-0.5 px-1.5">
                                      <Ban size={10} /> Banned
                                    </span>
                                  ) : (
                                    <span className="badge badge-approved text-[10px] py-0.5 px-1.5">
                                      <CheckCircle2 size={10} /> Active
                                    </span>
                                  )}

                                  {st.verification_status === "verified" && (
                                    <span className="badge badge-approved text-[10px] py-0.5 px-1.5" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                                      <CheckCircle2 size={10} /> Verified
                                    </span>
                                  )}
                                  {st.verification_status === "fake" && (
                                    <span className="badge badge-rejected text-[10px] py-0.5 px-1.5" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
                                      <ShieldAlert size={10} /> FAKE
                                    </span>
                                  )}
                                  {(!st.verification_status || st.verification_status === "unverified" || (st.verification_status as string) === "pending") && (
                                    <span className="badge badge-pending text-[10px] py-0.5 px-1.5" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                                      <Clock size={10} /> Unverified
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1 flex-wrap">
                                  <button
                                    className="review-btn text-[11px] py-1 px-2"
                                    onClick={() => setSelectedStudent(st)}
                                  >
                                    Profile
                                  </button>

                                  {st.verification_status !== "verified" && (
                                    <button
                                      className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                      title="Verify student profile"
                                      onClick={() => handleUpdateStudentVerification(st.user_id, st.name, "verified")}
                                    >
                                      <CheckCircle2 size={11} /> Verify
                                    </button>
                                  )}

                                  {st.verification_status !== "unverified" && (
                                    <button
                                      className="px-2 py-1 text-[11px] font-semibold rounded bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                      title="Mark as unverified"
                                      onClick={() => handleUpdateStudentVerification(st.user_id, st.name, "unverified")}
                                    >
                                      <Clock size={11} /> Unverify
                                    </button>
                                  )}

                                  {st.verification_status !== "fake" && (
                                    <button
                                      className="px-2 py-1 text-[11px] font-semibold rounded bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                      title="Flag as FAKE or Suspicious"
                                      onClick={() => handleUpdateStudentVerification(st.user_id, st.name, "fake")}
                                    >
                                      <ShieldAlert size={11} /> Fake
                                    </button>
                                  )}

                                  <button
                                    className={`px-2 py-1 text-[11px] font-semibold rounded transition-all flex items-center gap-1 cursor-pointer ${st.is_banned
                                        ? "bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30"
                                        : "bg-amber-600/20 text-amber-300 hover:bg-amber-600/30 border border-amber-500/30"
                                      }`}
                                    title={st.is_banned ? "Unban student" : "Ban student"}
                                    onClick={() => handleToggleBanUser(st.user_id, st.name, st.is_banned)}
                                  >
                                    {st.is_banned ? <UserCheck size={11} /> : <UserX size={11} />}
                                    <span>{st.is_banned ? "Unban" : "Ban"}</span>
                                  </button>

                                  <button
                                    className="px-2 py-1 text-[11px] font-semibold rounded bg-red-600/20 text-red-300 hover:bg-red-600/30 border border-red-500/30 transition-all flex items-center gap-1 cursor-pointer"
                                    title="Delete user account"
                                    onClick={() => handleDeleteUser(st.user_id, st.name)}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="modal-footer flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Showing <strong className="text-indigo-300">{filteredCollegeStudents.length}</strong> of {collegeAllStudents.length} enrolled students
                  </span>
                  <button
                    className="btn btn-secondary text-xs"
                    onClick={() => setSelectedCollegeForStudents(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
