import React, { useState, useEffect } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  BarChart3,
  Building2,
  TrendingUp,
  Loader2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { DemandItem } from "../../components/dashboard/IndustryDemand";

import { API_BASE_URL } from "../../config/api";

const IndustryDemandReport: React.FC = () => {
  const navigate = useNavigate();
  const [demandList, setDemandList] = useState<DemandItem[]>([]);
  const [totalOpportunities, setTotalOpportunities] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard/industry-demand?all=true`);
        const result = await res.json();
        if (res.ok && result.success) {
          setDemandList(Array.isArray(result.data) ? result.data : []);
          setTotalOpportunities(result.meta?.totalOpportunities || 0);
        } else {
          throw new Error(result.message || "Failed to load industry demand analytics.");
        }
      } catch (err: any) {
        console.error("fetchReportData error:", err);
        setError(err.message || "Unable to reach server.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  const getBadgeStyle = (level: string) => {
    switch (level) {
      case "High Demand":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
      case "Strong Demand":
        return "bg-cyan-500/15 border-cyan-500/30 text-cyan-400";
      case "Moderate Demand":
        return "bg-amber-500/15 border-amber-500/30 text-amber-400";
      default:
        return "bg-slate-800 border-slate-700 text-slate-400";
    }
  };

  return (
    <MainLayout showRightPanel={false}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* BACK NAVIGATION & HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <div className="space-y-1">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="text-indigo-400" size={26} />
              <h1 className="text-2xl font-black tracking-tight text-slate-100">
                Industry Skill Demand Report
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              Real-time analytics of in-demand skills based on current SkillBridge opportunities.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Building2 size={24} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Active Industry Listings
              </span>
              <span className="text-2xl font-black text-slate-100">
                {totalOpportunities}
              </span>
            </div>
          </div>
        </div>

        {/* METHODOLOGY EXPLANATION BANNER */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/25 p-5 rounded-2xl text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <Info size={18} />
            <span>How Demand Percentages are Calculated</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The demand percentage reflects the proportion of active, published opportunity listings on SkillBridge that explicitly require a specific skill:
          </p>
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300">
            Demand % = (Distinct Active Opportunities Requiring Skill ÷ Total Active Opportunities) × 100
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-medium block mb-1">Top Demanded Skill</span>
            <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400 shrink-0" />
              <span>{demandList[0]?.skillName || "N/A"}</span>
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              {demandList[0] ? `${demandList[0].demandPercentage}% of listings` : "No active data"}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-medium block mb-1">High Demand Skills</span>
            <div className="text-2xl font-black text-emerald-400">
              {demandList.filter((d) => d.demandLevel === "High Demand").length}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Skills required in ≥80% listings</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-medium block mb-1">Total Skills Tracked</span>
            <div className="text-2xl font-black text-indigo-400">
              {demandList.length}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">With active industry requirement</span>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MAIN DEMAND LIST TABLE / GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
            <Loader2 className="animate-spin text-indigo-400" size={32} />
            <p className="text-slate-400 text-sm font-medium">Calculating platform skill demand...</p>
          </div>
        ) : demandList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center px-4">
            <HelpCircle size={40} className="text-slate-500 mb-2 opacity-60" />
            <h3 className="text-base font-bold text-slate-200">No Current Opportunity Data Available</h3>
            <p className="text-slate-400 text-xs max-w-md mt-1">
              As industry partners post verified internships and job opportunities, skill demand benchmarks will automatically update here.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-400" />
              Skill Demand Breakdown
            </h3>

            <div className="space-y-3">
              {demandList.map((item, index) => (
                <div
                  key={item.skillId}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-[200px]">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{item.skillName}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.category}{item.studentCount !== undefined ? ` • ${item.studentCount} Students` : ""}
                      </span>
                    </div>
                  </div>

                  {/* PROGRESS BAR & PERCENTAGE */}
                  <div className="flex-1 max-w-md space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">
                        {item.opportunityCount} of {totalOpportunities} opportunities
                      </span>
                      <span className="text-slate-200">{item.demandPercentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(item.demandPercentage, 4)}%` }}
                      />
                    </div>
                  </div>

                  {/* LEVEL BADGE */}
                  <div className="shrink-0 flex items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getBadgeStyle(
                        item.demandLevel
                      )}`}
                    >
                      {item.demandLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default IndustryDemandReport;
