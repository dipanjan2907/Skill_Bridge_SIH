import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";
import type { IndustryProfile } from "../../types/industry";
import type { Opportunity, MasterSkill } from "../../types/opportunity";
import { OpportunityFormModal } from "../../components/industry/OpportunityFormModal";
import { OpportunityDetailModal } from "../../components/industry/OpportunityDetailModal";
import { IndustryApplicantsModal } from "../../components/industry/IndustryApplicantsModal";
import {
  Building2,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Send,
  Lock,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Calendar,
  IndianRupee,
  Sparkles,
  GraduationCap,
  Briefcase,
  Users,
  X,
  ChevronDown,
} from "lucide-react";

import { API_BASE_URL } from "../../config/api";

const IndustryOpportunities: React.FC = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState<IndustryProfile | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [masterSkills, setMasterSkills] = useState<MasterSkill[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [opportunityToEdit, setOpportunityToEdit] = useState<Opportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Applicants Modal state
  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);
  const [applicantOppId, setApplicantOppId] = useState<number | null>(null);
  const [applicantOppTitle, setApplicantOppTitle] = useState<string>("");

  // Add Custom Skill Modal state (For Industry Only)
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Technical");
  const [addingSkill, setAddingSkill] = useState(false);
  const [skillMsg, setSkillMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Industry Profile
  const fetchProfile = useCallback(async () => {
    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      if (!authToken) return;

      const res = await fetch(`${API_BASE_URL}/industry/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.data || data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch industry profile:", err);
    }
  }, [token]);

  // Fetch Master Skills
  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/skills`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMasterSkills(data);
      }
    } catch (err) {
      console.error("Failed to fetch master skills:", err);
    }
  }, []);

  // Fetch Opportunities
  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      if (!authToken) {
        throw new Error("Authentication token not found.");
      }

      const res = await fetch(`${API_BASE_URL}/industry/opportunities`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load opportunities.");
      }

      setOpportunities(Array.isArray(data.opportunities) ? data.opportunities : []);
    } catch (err: any) {
      console.error("fetchOpportunities error:", err);
      setError(err.message || "Could not fetch opportunities.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
    fetchSkills();
    fetchOpportunities();
  }, [fetchProfile, fetchSkills, fetchOpportunities]);

  const showSuccessMessage = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleAddCustomSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setAddingSkill(true);
    setSkillMsg(null);
    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      const res = await fetch(`${API_BASE_URL}/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newSkillName.trim(), category: newSkillCategory }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSkillMsg({ type: "success", text: `Skill "${data.skill.name}" successfully created!` });
        setNewSkillName("");
        fetchSkills();
        setTimeout(() => {
          setSkillMsg(null);
          setIsAddSkillModalOpen(false);
        }, 1200);
      } else {
        setSkillMsg({ type: "error", text: data.error || data.message || "Failed to add skill." });
      }
    } catch (err: any) {
      setSkillMsg({ type: "error", text: err.message || "Network error adding skill." });
    } finally {
      setAddingSkill(false);
    }
  };

  const handlePublish = async (oppId: number) => {
    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      const res = await fetch(`${API_BASE_URL}/industry/opportunities/${oppId}/publish`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to publish opportunity.");
      }

      showSuccessMessage("Opportunity published successfully!");
      fetchOpportunities();
    } catch (err: any) {
      setError(err.message || "Error publishing opportunity.");
    }
  };

  const handleCloseOpp = async (oppId: number) => {
    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      const res = await fetch(`${API_BASE_URL}/industry/opportunities/${oppId}/close`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to close opportunity.");
      }

      showSuccessMessage("Opportunity status updated to Closed.");
      fetchOpportunities();
    } catch (err: any) {
      setError(err.message || "Error closing opportunity.");
    }
  };

  const handleDelete = async (oppId: number) => {
    if (!window.confirm("Are you sure you want to delete this opportunity?")) return;

    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      const res = await fetch(`${API_BASE_URL}/industry/opportunities/${oppId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete opportunity.");
      }

      showSuccessMessage("Opportunity deleted successfully.");
      fetchOpportunities();
    } catch (err: any) {
      setError(err.message || "Error deleting opportunity.");
    }
  };

  // Support both camelCase and snake_case properties from backend
  const statusVal = profile?.verificationStatus || profile?.verification_status;
  const isVerified = statusVal === "approved";

  // Filter opportunities list
  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesStatus =
      statusFilter === "all" || opp.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType =
      typeFilter === "all" || opp.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesSearch =
      !searchTerm.trim() ||
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opp.location && opp.location.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* SUCCESS TOAST NOTIFICATION */}
        {actionSuccess && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl animate-fade-in">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
        )}

        {/* HEADER CARD */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
                <Building2 size={28} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Industry Portal
                </span>
                <h1 className="text-2xl font-bold text-slate-100 mt-0.5">
                  Opportunities & Skills
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Create, publish, and benchmark technical skills for internships and job roles.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border ${
                  isVerified
                    ? "bg-slate-800/80 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border-indigo-500/30 cursor-pointer"
                    : "bg-slate-800 text-slate-500 border-slate-700/50 cursor-not-allowed"
                }`}
                disabled={!isVerified}
                onClick={() => setIsAddSkillModalOpen(true)}
                title={!isVerified ? "Verification required" : "Add custom master skill to platform"}
              >
                <Sparkles size={16} className="text-indigo-400" />
                <span>Add Custom Skill</span>
              </button>

              <button
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg ${
                  isVerified
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 cursor-pointer"
                    : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                }`}
                disabled={!isVerified}
                onClick={() => {
                  setOpportunityToEdit(null);
                  setIsFormModalOpen(true);
                }}
                title={!isVerified ? "Verification required to create opportunities" : ""}
              >
                <Plus size={18} />
                <span>Create Opportunity</span>
              </button>
            </div>
          </div>

          {/* VERIFICATION WARNING BANNER IF NOT APPROVED */}
          {!isVerified && (
            <div className="mt-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-amber-300 text-sm backdrop-blur-md">
              <Lock size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-amber-200">Verification Required: </strong>
                Your company profile is currently pending administrator verification. Once verified,
                you will be able to post, edit, and publish opportunities for candidates.
              </div>
            </div>
          )}
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full bg-slate-800/50 border border-slate-700/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 transition-all outline-none"
              placeholder="Search by role title, location, or technology..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters & Status Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-950/60 border border-slate-800/80 rounded-xl">
              {[
                { label: `All (${opportunities.length})`, key: "all" },
                {
                  label: `Drafts (${opportunities.filter((o) => o.status === "draft").length})`,
                  key: "draft",
                },
                {
                  label: `Published (${opportunities.filter((o) => o.status === "published").length})`,
                  key: "published",
                },
                {
                  label: `Closed (${opportunities.filter((o) => o.status === "closed").length})`,
                  key: "closed",
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === tab.key
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Type Dropdown Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950/60 border border-slate-800/80 text-slate-200 text-xs font-medium rounded-xl px-3.5 py-2 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="all">All Role Types</option>
              <option value="internship">Internships Only</option>
              <option value="job">Jobs Only</option>
            </select>
          </div>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* OPPORTUNITIES CARDS GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
            <Loader2 className="animate-spin text-indigo-400" size={36} />
            <p className="text-slate-400 text-sm font-medium">Fetching posted opportunities from database...</p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center px-4">
            <div className="p-4 bg-slate-800/50 rounded-2xl text-slate-500 mb-3">
              <Building2 size={44} />
            </div>
            <h3 className="text-lg font-bold text-slate-200">No Opportunities Found</h3>
            <p className="text-slate-400 text-sm max-w-md mt-1">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "No opportunity listings match your current filters."
                : "You haven't posted any opportunities yet. Click create opportunity above to post your first listing."}
            </p>
            {isVerified && (
              <button
                className="mt-5 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md"
                onClick={() => {
                  setOpportunityToEdit(null);
                  setIsFormModalOpen(true);
                }}
              >
                <Plus size={15} /> Create First Opportunity
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Card Header & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          opp.type === "internship"
                            ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
                            : "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                        }`}
                      >
                        {opp.type === "internship" ? (
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap size={13} /> Internship
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Briefcase size={13} /> Full-Time Job
                          </span>
                        )}
                      </span>
                      <h3 className="text-base font-bold text-slate-100 mt-2 group-hover:text-indigo-400 transition-colors">
                        {opp.title}
                      </h3>
                    </div>

                    <div className="shrink-0">
                      {opp.status === "published" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Published
                        </span>
                      )}
                      {opp.status === "draft" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Draft
                        </span>
                      )}
                      {opp.status === "closed" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Closed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description preview */}
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {opp.description}
                  </p>

                  {/* Meta items */}
                  <div className="pt-2 flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-indigo-400" />
                      {opp.work_mode} {opp.location ? `• ${opp.location}` : ""}
                    </span>
                    {opp.stipend_min !== null && (
                      <span className="flex items-center gap-1.5">
                        <IndianRupee size={13} className="text-emerald-400" />
                        ₹{opp.stipend_min.toLocaleString()}
                        {opp.stipend_max ? ` - ₹${opp.stipend_max.toLocaleString()}` : ""}
                        {opp.type === "internship" ? "/mo" : "/yr"}
                      </span>
                    )}
                    {opp.application_deadline && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-amber-400" />
                        {new Date(opp.application_deadline).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>

                  {/* Required Skill Chips */}
                  {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={11} className="text-indigo-400" /> Skill Benchmarks:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {opp.requiredSkills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded-md text-[11px] font-medium text-slate-300"
                          >
                            {s.skill_name || `Skill #${s.skill_id}`} (≥{s.required_proficiency}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-slate-100 rounded-lg text-xs font-semibold transition-all border border-slate-700/50 cursor-pointer"
                      onClick={() => {
                        setSelectedOpportunity(opp);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <Eye size={14} /> Details
                    </button>

                    {isVerified && (
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        onClick={() => {
                          setApplicantOppId(opp.id);
                          setApplicantOppTitle(opp.title);
                          setIsApplicantsModalOpen(true);
                        }}
                      >
                        <Users size={14} /> Applicants
                      </button>
                    )}
                  </div>

                  {isVerified && (
                    <div className="flex items-center gap-1.5">
                      <button
                        className="p-1.5 bg-slate-800/60 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 rounded-lg transition-all border border-slate-700/50 cursor-pointer"
                        onClick={() => {
                          setOpportunityToEdit(opp);
                          setIsFormModalOpen(true);
                        }}
                        title="Edit Opportunity"
                      >
                        <Edit3 size={14} />
                      </button>

                      {opp.status === "draft" && (
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          onClick={() => handlePublish(opp.id)}
                          title="Publish Opportunity"
                        >
                          <Send size={13} /> Publish
                        </button>
                      )}

                      {opp.status === "published" && (
                        <button
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          onClick={() => handleCloseOpp(opp.id)}
                          title="Close Opportunity"
                        >
                          <Clock size={13} /> Close
                        </button>
                      )}

                      <button
                        className="p-1.5 bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all border border-slate-700/50 cursor-pointer"
                        onClick={() => handleDelete(opp.id)}
                        title="Delete Opportunity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORM MODAL */}
        <OpportunityFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => {
            sessionStorage.removeItem("sb_top_opportunities");
            window.dispatchEvent(new Event("opportunitiesUpdated"));
            showSuccessMessage("Opportunity saved successfully.");
            fetchOpportunities();
          }}
          opportunityToEdit={opportunityToEdit}
          masterSkills={masterSkills}
          token={token}
        />

        {/* DETAILS MODAL */}
        <OpportunityDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          opportunity={selectedOpportunity}
        />

        {/* APPLICANTS MODAL */}
        <IndustryApplicantsModal
          isOpen={isApplicantsModalOpen}
          onClose={() => setIsApplicantsModalOpen(false)}
          opportunityId={applicantOppId}
          opportunityTitle={applicantOppTitle}
        />

        {/* ADD CUSTOM SKILL MODAL (Industry Only) */}
        {isAddSkillModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-indigo-400" />
                  <h3 className="text-lg font-bold text-slate-100">Add New Master Skill</h3>
                </div>
                <button
                  onClick={() => setIsAddSkillModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {skillMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    skillMsg.type === "success"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {skillMsg.text}
                </div>
              )}

              <form onSubmit={handleAddCustomSkill} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Skill Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Next.js, FastAPI, Kubernetes, PyTorch"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Skill Category
                  </label>
                  <div className="relative">
                    <select
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium outline-none appearance-none cursor-pointer transition-all hover:border-slate-600 shadow-inner"
                    >
                      <option value="Technical" className="bg-slate-900 text-slate-100 py-2 font-medium">Technical / Programming</option>
                      <option value="Frontend" className="bg-slate-900 text-slate-100 py-2 font-medium">Frontend Development</option>
                      <option value="Backend" className="bg-slate-900 text-slate-100 py-2 font-medium">Backend & APIs</option>
                      <option value="Database" className="bg-slate-900 text-slate-100 py-2 font-medium">Database & Data Engineering</option>
                      <option value="Cloud/DevOps" className="bg-slate-900 text-slate-100 py-2 font-medium">Cloud & DevOps</option>
                      <option value="AI/ML" className="bg-slate-900 text-slate-100 py-2 font-medium">AI & Machine Learning</option>
                      <option value="Soft Skills" className="bg-slate-900 text-slate-100 py-2 font-medium">Soft Skills & Communication</option>
                      <option value="Domain Knowledge" className="bg-slate-900 text-slate-100 py-2 font-medium">Domain & Industry Knowledge</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddSkillModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingSkill || !newSkillName.trim()}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      addingSkill || !newSkillName.trim()
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer"
                    }`}
                  >
                    {addingSkill ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    <span>{addingSkill ? "Adding..." : "Add to Master Database"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default IndustryOpportunities;
