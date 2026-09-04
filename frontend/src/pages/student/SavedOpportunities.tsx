import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  Bookmark,
  BookmarkX,
  MapPin,
  Clock,
  Briefcase,
  Search,
  RotateCw,
  ExternalLink,
  GraduationCap,
  Sparkles,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Opportunity } from "../../types/opportunity";
import { OpportunityDetailModal } from "../../components/industry/OpportunityDetailModal";
import { ApplyOpportunityModal } from "../../components/student/ApplyOpportunityModal";
import { API_BASE_URL } from "../../config/api";

const SavedOpportunities: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Detail & Apply modals
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);

  // Fetch saved opportunities
  const fetchSavedOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(`${API_BASE_URL}/opportunities/saved`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch saved opportunities.");
      }

      setSavedOpportunities(Array.isArray(data.opportunities) ? data.opportunities : []);
    } catch (err: any) {
      console.error("fetchSavedOpportunities error:", err);
      setError(err.message || "Could not load saved opportunities.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSavedOpportunities();
  }, [fetchSavedOpportunities]);

  // Remove bookmark handler
  const handleRemoveBookmark = async (oppId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      // Optimistic removal from UI state
      setSavedOpportunities((prev) => prev.filter((opp) => opp.id !== oppId));

      const res = await fetch(`${API_BASE_URL}/opportunities/${oppId}/save`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Revert on failure
        fetchSavedOpportunities();
        throw new Error(data.message || "Failed to update saved status.");
      }
    } catch (err: any) {
      console.error("Remove bookmark error:", err);
    }
  };

  // Format stipend
  const formatStipend = (min: number | null, max: number | null, type: string) => {
    if (!min && !max) return "Disclosed on interview";
    const unit = type === "internship" || type === "faculty_internship" ? "/month" : "/annum";
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${unit}`;
    if (min) return `From ₹${min.toLocaleString()} ${unit}`;
    if (max) return `Up to ₹${max.toLocaleString()} ${unit}`;
    return "Disclosed on interview";
  };

  // Filter saved opportunities
  const filteredOpportunities = savedOpportunities.filter((opp) => {
    const matchesType = typeFilter === "all" || opp.type === typeFilter;
    const matchesSearch =
      !searchTerm.trim() ||
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opp.company_name && opp.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (opp.location && opp.location.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesType && matchesSearch;
  });

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* HEADER CARD */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 shrink-0">
                <Bookmark size={28} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Bookmarked Listings
                </span>
                <h1 className="text-2xl font-bold text-slate-100 mt-0.5">
                  Saved Opportunities
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Manage and quickly apply to your bookmarked opportunity listings.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/opportunities")}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
            >
              <Sparkles size={15} />
              <span>Explore More Opportunities</span>
            </button>
          </div>
        </div>

        {/* SEARCH AND FILTERS BAR */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search saved opportunities by title, technology, or company..."
              className="w-full bg-slate-800/50 border border-slate-700/60 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <button
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === "all"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              onClick={() => setTypeFilter("all")}
            >
              All Saved ({savedOpportunities.length})
            </button>

            <button
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === "internship"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              onClick={() => setTypeFilter("internship")}
            >
              <GraduationCap size={14} /> Internships
            </button>

            <button
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === "job"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              onClick={() => setTypeFilter("job")}
            >
              <Briefcase size={14} /> Jobs
            </button>

            <button
              onClick={fetchSavedOpportunities}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg transition-colors cursor-pointer ml-1"
              title="Refresh saved listings"
            >
              <RotateCw size={15} className={loading ? "animate-spin text-amber-400" : ""} />
            </button>
          </div>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SAVED OPPORTUNITIES GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
            <Loader2 className="animate-spin text-amber-400" size={36} />
            <p className="text-slate-400 text-sm font-medium">
              Loading your bookmarked opportunities...
            </p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center px-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 mb-3">
              <BookmarkX size={44} />
            </div>
            <h3 className="text-lg font-bold text-slate-200">
              {savedOpportunities.length === 0
                ? "No Saved Opportunities Yet"
                : "No matching saved opportunities found"}
            </h3>
            <p className="text-sm text-slate-400 max-w-md mt-1 mb-5">
              {savedOpportunities.length === 0
                ? "Click the bookmark icon on any opportunity card while browsing to save it here for quick reference."
                : "Try adjusting your search query or type filters to find your saved items."}
            </p>
            <button
              onClick={() => navigate("/opportunities")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Browse Opportunities
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOpportunities.map((opp) => (
              <div
                key={opp.id}
                onClick={() => {
                  setSelectedOpportunity(opp);
                  setIsDetailModalOpen(true);
                }}
                className="group relative bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-center font-bold text-slate-200 overflow-hidden shrink-0">
                        {opp.company_logo ? (
                          <img
                            src={opp.company_logo}
                            alt={opp.company_name || "Company"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (opp.company_name || "C").charAt(0).toUpperCase()
                        )}
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-200 text-xs">
                          {opp.company_name || "Industry Partner"}
                        </h4>
                        <span className="inline-block px-2 py-0.5 mt-0.5 text-[10px] font-bold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                          {opp.type.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* UNBOOKMARK BUTTON */}
                    <button
                      onClick={(e) => handleRemoveBookmark(opp.id, e)}
                      className="p-2 text-amber-400 hover:text-rose-400 bg-amber-500/10 hover:bg-rose-500/10 border border-amber-500/20 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
                      title="Remove from saved"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* ROLE TITLE & DESCRIPTION */}
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                    {opp.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {opp.description}
                  </p>

                  {/* DETAILS METADATA */}
                  <div className="grid grid-cols-2 gap-2 py-2.5 px-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 mb-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin size={13} className="text-amber-400 shrink-0" />
                      <span className="truncate">{opp.location || "Remote"}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock size={13} className="text-indigo-400 shrink-0" />
                      <span className="truncate">{opp.duration || "Flexible"}</span>
                    </div>

                    <div className="col-span-2 flex items-center gap-1.5 font-medium text-slate-200">
                      <span className="text-emerald-400 font-bold">₹</span>
                      <span className="truncate">
                        {formatStipend(opp.stipend_min, opp.stipend_max, opp.type)}
                      </span>
                    </div>
                  </div>

                  {/* SKILLS CHIPS */}
                  {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {opp.requiredSkills.slice(0, 3).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[11px] bg-slate-800/70 text-slate-300 rounded-md border border-slate-700/60"
                        >
                          {s.skill_name || `Skill #${s.skill_id}`}
                        </span>
                      ))}
                      {opp.requiredSkills.length > 3 && (
                        <span className="px-2 py-0.5 text-[11px] bg-slate-800/50 text-slate-400 rounded-md">
                          +{opp.requiredSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CARD FOOTER */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOpportunity(opp);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink size={14} /> View Details
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOpportunity(opp);
                      setIsApplyModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase size={14} /> Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DETAIL MODAL */}
        {selectedOpportunity && isDetailModalOpen && (
          <OpportunityDetailModal
            opportunity={selectedOpportunity}
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedOpportunity(null);
            }}
          />
        )}

        {/* APPLY MODAL */}
        {selectedOpportunity && isApplyModalOpen && (
          <ApplyOpportunityModal
            opportunity={selectedOpportunity}
            isOpen={isApplyModalOpen}
            onClose={() => {
              setIsApplyModalOpen(false);
              setSelectedOpportunity(null);
            }}
            onSuccess={() => {
              setIsApplyModalOpen(false);
              setSelectedOpportunity(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default SavedOpportunities;
