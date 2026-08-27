import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  Building2,
  Search,
  MapPin,
  Calendar,
  IndianRupee,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  Send,
  Target,
  Globe,
  RotateCw,
} from "lucide-react";
import type { Opportunity } from "../../types/opportunity";
import type { RecommendedOpportunity } from "../../types/matching";
import { OpportunityDetailModal } from "../../components/industry/OpportunityDetailModal";
import { ApplyOpportunityModal } from "../../components/student/ApplyOpportunityModal";
import { SkillAssessment } from "../../components/student/SkillAssessment";
import { useAuth } from "../../context/AuthContext";

import { API_BASE_URL } from "../../config/api";

const StudentOpportunities: React.FC = () => {
  const { token } = useAuth();
  const [viewMode, setViewMode] = useState<"recommended" | "all">("recommended");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedOpportunity[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal detail view state
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Direct skill assessment state
  const [activeAssessmentSkill, setActiveAssessmentSkill] = useState<{
    skillId: number;
    skillName: string;
  } | null>(null);

  // Fetch Recommended Opportunities
  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(`${API_BASE_URL}/student/opportunities/recommended?limit=20`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch recommendations.");
      }

      setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
    } catch (err: any) {
      console.error("fetchRecommendations error:", err);
      setError(err.message || "Could not load recommended opportunities.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch All Opportunities
  const fetchAllOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE_URL}/opportunities`;
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load opportunities.");
      }

      setOpportunities(Array.isArray(data.opportunities) ? data.opportunities : []);
    } catch (err: any) {
      console.error("fetchAllOpportunities error:", err);
      setError(err.message || "Could not fetch published opportunities.");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, searchTerm]);

  useEffect(() => {
    if (viewMode === "recommended") {
      fetchRecommendations();
    } else {
      fetchAllOpportunities();
    }
  }, [viewMode, fetchRecommendations, fetchAllOpportunities]);

  const formatStipend = (min: number | null, max: number | null, type: string) => {
    if (!min && !max) return "Disclosed on interview";
    const unit = type === "internship" ? "/month" : "/annum";
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${unit}`;
    if (min) return `From ₹${min.toLocaleString()} ${unit}`;
    if (max) return `Up to ₹${max.toLocaleString()} ${unit}`;
    return "Disclosed on interview";
  };

  const renderMatchBadge = (score: number | null, category: string) => {
    if (score === null || category === "Match Unavailable") {
      return (
        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 font-semibold text-[11px] rounded-full border border-slate-700">
          Match Unavailable
        </span>
      );
    }

    if (category === "Incomplete Profile") {
      return (
        <span className="px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold text-[11px] rounded-full">
          Incomplete Profile
        </span>
      );
    }

    if (score >= 80) {
      return (
        <span className="px-2.5 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] rounded-full">
          🎯 {score}% Match • {category}
        </span>
      );
    } else if (score >= 65) {
      return (
        <span className="px-2.5 py-0.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold text-[11px] rounded-full">
          🎯 {score}% Match • {category}
        </span>
      );
    } else if (score >= 50) {
      return (
        <span className="px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[11px] rounded-full">
          🎯 {score}% Match • {category}
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-0.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-[11px] rounded-full">
          🎯 {score}% Match • {category}
        </span>
      );
    }
  };

  // Filter and sort recommendations by highest match score first, then newest
  const filteredRecommendations = recommendations
    .filter((rec) => {
      const matchesType = typeFilter === "all" || rec.type === typeFilter;
      const matchesSearch =
        !searchTerm.trim() ||
        rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.location && rec.location.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      const scoreA = a.matchScore !== null && a.matchScore !== undefined ? a.matchScore : -1;
      const scoreB = b.matchScore !== null && b.matchScore !== undefined ? b.matchScore : -1;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* HEADER CARD */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
                <Briefcase size={28} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Skill DNA & Recommendations
                </span>
                <h1 className="text-2xl font-bold text-slate-100 mt-0.5">
                  Opportunity Discovery
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Explore ranked opportunity recommendations matched against your verified skills.
                </p>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode("recommended")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "recommended"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Target size={15} /> Recommended for You
              </button>

              <button
                onClick={() => setViewMode("all")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "all"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Globe size={15} /> All Opportunities
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTERS BAR */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by role title, technology, or company name..."
              className="w-full bg-slate-800/50 border border-slate-700/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <button
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === "all"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              onClick={() => setTypeFilter("all")}
            >
              All Roles
            </button>

            <button
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === "internship"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              onClick={() => setTypeFilter("internship")}
            >
              <GraduationCap size={14} /> Internships
            </button>

            <button
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === "job"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              onClick={() => setTypeFilter("job")}
            >
              <Briefcase size={14} /> Full-Time Jobs
            </button>

            <button
              onClick={() => (viewMode === "recommended" ? fetchRecommendations() : fetchAllOpportunities())}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg transition-colors cursor-pointer ml-1"
              title="Refresh listings"
            >
              <RotateCw size={15} className={loading ? "animate-spin text-indigo-400" : ""} />
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

        {/* RECOMMENDED VIEW GRID */}
        {viewMode === "recommended" ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
              <Loader2 className="animate-spin text-indigo-400" size={36} />
              <p className="text-slate-400 text-sm font-medium">
                Calculating skill matches & ranking recommendations...
              </p>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center px-4">
              <div className="p-4 bg-slate-800/50 rounded-2xl text-slate-500 mb-3">
                <Target size={44} />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No Recommendations Available</h3>
              <p className="text-slate-400 text-sm max-w-md mt-1">
                {searchTerm || typeFilter !== "all"
                  ? "No recommendations match your search filters."
                  : "Take skill assessments in your profile to unlock personalized opportunity recommendations!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRecommendations.map((rec) => (
                <div
                  key={rec.opportunityId}
                  className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Company & Match Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                          {rec.companyLogo ? (
                            <img
                              src={rec.companyLogo}
                              alt={rec.companyName}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            (rec.companyName || "C").charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
                            {rec.companyName || "Verified Partner"}
                          </span>
                          <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {rec.title}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          rec.type === "internship"
                            ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
                            : "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                        }`}
                      >
                        {rec.type === "internship" ? "Internship" : "Full-Time"}
                      </span>
                    </div>

                    {/* PROMINENT MATCH SCORE */}
                    <div className="py-1">
                      {renderMatchBadge(rec.matchScore, rec.matchCategory)}
                    </div>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-y-1.5 gap-x-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-indigo-400" />
                        {rec.workMode} {rec.location ? `• ${rec.location}` : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <IndianRupee size={12} className="text-emerald-400" />
                        {formatStipend(rec.stipendMin || null, rec.stipendMax || null, rec.type)}
                      </span>
                      {rec.applicationDeadline && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-amber-400" />
                          {new Date(rec.applicationDeadline).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </div>

                    {/* Role Description */}
                    {rec.description && (
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                        {rec.description}
                      </p>
                    )}

                    {/* Skill Breakdown Chips: Matched ✓, Partial ◐, Missing ⚠ */}
                    {rec.requiredSkills && rec.requiredSkills.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Skill Compatibility Breakdown:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.requiredSkills.map((sk) => (
                            <button
                              key={sk.skillId}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveAssessmentSkill({
                                  skillId: sk.skillId,
                                  skillName: sk.skillName,
                                });
                              }}
                              title={`Click to take assessment for ${sk.skillName}`}
                              className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 border transition-all cursor-pointer hover:scale-105 ${
                                sk.status === "matched"
                                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/25 text-emerald-300"
                                  : sk.status === "partial"
                                  ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25 text-amber-300"
                                  : "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/25 text-rose-300"
                              }`}
                            >
                              {sk.status === "matched" && "✓"}
                              {sk.status === "partial" && "◐"}
                              {sk.status === "missing" && "⚠"}
                              {sk.skillName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    {rec.hasApplied ? (
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Already Applied
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">
                        Deterministic Match
                      </span>
                    )}

                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
                      onClick={() => {
                        setSelectedOpportunity({
                          id: rec.opportunityId,
                          industry_id: 0,
                          type: rec.type,
                          title: rec.title,
                          description: rec.description || "",
                          location: rec.location || null,
                          work_mode: rec.workMode,
                          stipend_min: rec.stipendMin || null,
                          stipend_max: rec.stipendMax || null,
                          duration: null,
                          eligibility: null,
                          application_deadline: rec.applicationDeadline || null,
                          status: "published",
                          created_at: rec.createdAt,
                          updated_at: rec.createdAt,
                          requiredSkills: (rec as any).requiredSkills || [],
                        });
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <Eye size={14} /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ALL OPPORTUNITIES GRID */
          loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
              <Loader2 className="animate-spin text-indigo-400" size={36} />
              <p className="text-slate-400 text-sm font-medium">Loading verified industry opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center px-4">
              <div className="p-4 bg-slate-800/50 rounded-2xl text-slate-500 mb-3">
                <Building2 size={44} />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No Opportunities Found</h3>
              <p className="text-slate-400 text-sm max-w-md mt-1">
                There are no active published opportunities matching your search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                          {opp.company_logo ? (
                            <img
                              src={opp.company_logo}
                              alt={opp.company_name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            (opp.company_name || "C").charAt(0).toUpperCase()
                          )}
                        </div>

                        <div>
                          <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
                            {opp.company_name || "Verified Partner"}
                          </span>
                          <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {opp.title}
                          </h3>
                        </div>
                      </div>

                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                          opp.type === "internship"
                            ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400"
                            : "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                        }`}
                      >
                        {opp.type === "internship" ? "Internship" : "Full-Time Job"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {opp.description}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-indigo-400" />
                        {opp.work_mode} {opp.location ? `• ${opp.location}` : ""}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <IndianRupee size={13} className="text-emerald-400" />
                        {formatStipend(opp.stipend_min, opp.stipend_max, opp.type)}
                      </span>
                      {opp.application_deadline && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-amber-400" />
                          {new Date(opp.application_deadline).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </div>

                    {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles size={11} className="text-indigo-400" /> Skill Benchmarks:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {opp.requiredSkills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/60 rounded-md text-[11px] font-medium text-slate-300 flex items-center gap-1"
                            >
                              <CheckCircle2 size={11} className="text-emerald-400" />
                              {s.skill_name || `Skill #${s.skill_id}`} (≥{s.required_proficiency}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Verified Industry Listing
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-slate-700/60"
                        onClick={() => {
                          setSelectedOpportunity(opp);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye size={14} /> Details
                      </button>
                      <button
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                        onClick={() => {
                          setSelectedOpportunity(opp);
                          setIsApplyModalOpen(true);
                        }}
                      >
                        <Send size={14} /> Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* DETAIL MODAL */}
        <OpportunityDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          opportunity={selectedOpportunity}
          onApplicationSuccess={() => {
            if (viewMode === "recommended") {
              fetchRecommendations();
            } else {
              fetchAllOpportunities();
            }
          }}
        />

        {/* DIRECT APPLY MODAL */}
        <ApplyOpportunityModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          opportunity={selectedOpportunity}
          onSuccess={() => {
            if (viewMode === "recommended") {
              fetchRecommendations();
            } else {
              fetchAllOpportunities();
            }
          }}
        />

        {/* LIVE INLINE SKILL ASSESSMENT MODAL */}
        {activeAssessmentSkill && (
          <SkillAssessment
            skillId={activeAssessmentSkill.skillId}
            skillName={activeAssessmentSkill.skillName}
            onClose={() => setActiveAssessmentSkill(null)}
            onComplete={() => {
              setActiveAssessmentSkill(null);
              if (viewMode === "recommended") {
                fetchRecommendations();
              } else {
                fetchAllOpportunities();
              }
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default StudentOpportunities;
