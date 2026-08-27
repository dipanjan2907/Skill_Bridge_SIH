import React, { useState, useEffect, useCallback } from "react";
import { ArrowRight, Building2, Loader2, Eye, RotateCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Opportunity } from "../../types/opportunity";
import { OpportunityDetailModal } from "../industry/OpportunityDetailModal";
import { useAuth } from "../../context/AuthContext";

import { API_BASE_URL } from "../../config/api";

interface OpportunityWithMatch extends Opportunity {
  matchScore?: number | null;
  matchCategory?: string;
}

const Opportunities: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [opportunitiesList, setOpportunitiesList] = useState<OpportunityWithMatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal state
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const userRole = user?.role ? user.role.toString().toLowerCase() : "";

  const fetchTopOpportunities = useCallback(async (isManualRefresh = false) => {
    // 1. Check session cache unless manually refreshing
    if (!isManualRefresh) {
      const cached = sessionStorage.getItem("sb_top_opportunities");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOpportunitiesList(parsed);
            setLoading(false);
            return;
          }
        } catch (_e) {}
      }
    }

    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      // If student is logged in, try recommended endpoint first
      if (userRole === "student" && authToken) {
        const res = await fetch(`${API_BASE_URL}/student/opportunities/recommended?limit=4`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.recommendations)) {
          const mapped: OpportunityWithMatch[] = data.recommendations.map((rec: any) => ({
            id: rec.opportunityId,
            industry_id: 0,
            type: rec.type,
            title: rec.title,
            description: "",
            location: rec.location || null,
            work_mode: rec.workMode,
            stipend_min: rec.stipendMin || null,
            stipend_max: rec.stipendMax || null,
            duration: null,
            eligibility: null,
            application_deadline: rec.applicationDeadline || null,
            status: "published",
            company_name: rec.companyName,
            company_logo: rec.companyLogo,
            requiredSkills: rec.requiredSkills,
            matchScore: rec.matchScore,
            matchCategory: rec.matchCategory,
            created_at: rec.createdAt,
            updated_at: rec.createdAt,
          }));
          setOpportunitiesList(mapped);
          sessionStorage.setItem("sb_top_opportunities", JSON.stringify(mapped));
          return;
        }
      }

      // Fallback: public endpoint
      const res = await fetch(`${API_BASE_URL}/opportunities`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.opportunities)) {
        const sliced = data.opportunities.slice(0, 4);
        setOpportunitiesList(sliced);
        sessionStorage.setItem("sb_top_opportunities", JSON.stringify(sliced));
      } else {
        setOpportunitiesList([]);
      }
    } catch (err) {
      console.error("Error fetching dashboard opportunities:", err);
      setError("Unable to load opportunities");
      setOpportunitiesList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRole, token]);

  useEffect(() => {
    fetchTopOpportunities();

    const handleOpportunitiesUpdate = () => {
      sessionStorage.removeItem("sb_top_opportunities");
      fetchTopOpportunities(true);
    };

    window.addEventListener("opportunitiesUpdated", handleOpportunitiesUpdate);
    return () => {
      window.removeEventListener("opportunitiesUpdated", handleOpportunitiesUpdate);
    };
  }, [fetchTopOpportunities]);

  const formatCompensation = (min: number | null, max: number | null, type: string) => {
    if (!min && !max) return "Disclosed on interview";
    const unit = type === "internship" ? "/mo" : "/yr";
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${unit}`;
    if (min) return `₹${min.toLocaleString()} ${unit}`;
    return `Up to ₹${max?.toLocaleString()} ${unit}`;
  };

  const handleOpportunityClick = (job: Opportunity) => {
    setSelectedOpportunity(job);
    setIsDetailModalOpen(true);
  };

  const renderMatchPill = (job: OpportunityWithMatch) => {
    if (job.matchScore !== undefined && job.matchScore !== null) {
      return (
        <div className="match-pill bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          🎯 {job.matchScore}% Match
        </div>
      );
    }

    if (job.matchCategory === "Incomplete Profile") {
      return (
        <div className="match-pill bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Profile Incomplete
        </div>
      );
    }

    return (
      <div className="match-pill">
        {job.requiredSkills && job.requiredSkills.length > 0 ? `Skill Benchmarked` : "Open Role"}
      </div>
    );
  };

  return (
    <section className="right-card">
      <div className="section-heading flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2>Top Opportunities</h2>
            <button
              onClick={() => fetchTopOpportunities(true)}
              disabled={refreshing || loading}
              className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 rounded-lg transition-all cursor-pointer disabled:opacity-50"
              title="Refresh opportunities"
            >
              <RotateCw size={15} className={refreshing ? "animate-spin text-indigo-400" : ""} />
            </button>
          </div>
          <p>Matched for your skill profile</p>
        </div>

        <button
          className="text-btn cursor-pointer"
          onClick={() => navigate("/opportunities")}
        >
          View all
        </button>
      </div>

      <div className="opportunities">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-xs space-y-2">
            <Loader2 className="animate-spin text-indigo-400" size={20} />
            <span>Calculating match score...</span>
          </div>
        ) : error || opportunitiesList.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs border border-slate-800/60 rounded-xl bg-slate-900/40">
            <Building2 size={24} className="mx-auto mb-1 text-slate-500 opacity-60" />
            <p className="font-medium text-slate-300">No opportunities available</p>
            <span className="text-[11px] text-slate-500">Check back later for new industry listings.</span>
          </div>
        ) : (
          opportunitiesList.map((job) => (
            <div
              className="opportunity cursor-pointer hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all group"
              key={job.id}
              onClick={() => handleOpportunityClick(job)}
              title="Click to view full details"
            >
              <div className="company-logo flex items-center justify-center font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 group-hover:border-indigo-500/40">
                {job.company_logo ? (
                  <img
                    src={job.company_logo}
                    alt={job.company_name || "Company"}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  (job.company_name || "C").charAt(0).toUpperCase()
                )}
              </div>

              <div className="job-info flex-1 min-w-0">
                <h3 className="truncate text-slate-100 group-hover:text-indigo-400 transition-colors">
                  {job.title}
                </h3>
                <p className="truncate text-slate-400">{job.company_name || "Verified Partner"}</p>
                <div className="job-meta">
                  <span>
                    {job.work_mode}
                    {job.location ? ` • ${job.location}` : ""}
                  </span>
                  <span>{formatCompensation(job.stipend_min, job.stipend_max, job.type)}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {renderMatchPill(job)}
                <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye size={10} /> Details
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        className="see-more cursor-pointer"
        onClick={() => navigate("/opportunities")}
      >
        View more opportunities
        <ArrowRight size={15} />
      </button>

      {/* OPPORTUNITY DETAILS MODAL IN STUDENT DASHBOARD */}
      <OpportunityDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        opportunity={selectedOpportunity}
      />
    </section>
  );
};

export default Opportunities;