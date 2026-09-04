import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../../config/api";

export interface DemandItem {
  skillId: number;
  skillName: string;
  category: string;
  opportunityCount: number;
  demandPercentage: number;
  demandLevel: string;
  studentCount?: number;
}

const IndustryDemand: React.FC = () => {
  const navigate = useNavigate();
  const [demandList, setDemandList] = useState<DemandItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchDemandData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/industry-demand`);
      const result = await res.json();
      if (res.ok && result.success && Array.isArray(result.data)) {
        setDemandList(result.data);
      } else {
        setDemandList([]);
      }
    } catch (err) {
      console.error("Failed to fetch industry demand data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemandData();
  }, [fetchDemandData]);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Industry Demand</h2>
          <p>Based on current SkillBridge opportunities</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
            onClick={fetchDemandData}
            disabled={loading}
            title="Refresh Industry Demand"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-sky-400" : ""} />
          </button>
          <button
            className="text-btn cursor-pointer"
            onClick={() => navigate("/student/industry-demand")}
          >
            View Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
          <Loader2 className="animate-spin text-sky-400" size={18} />
          <span>Loading industry demand...</span>
        </div>
      ) : error ? (
        <div className="p-4 text-center text-slate-400 text-xs border border-slate-800 rounded-xl bg-slate-900/40">
          <p className="font-medium text-slate-300">
            Unable to load industry demand
          </p>
          <span className="text-[11px] text-slate-500">
            Please check server connection.
          </span>
        </div>
      ) : demandList.length === 0 ? (
        <div className="p-4 text-center text-slate-400 text-xs border border-slate-800 rounded-xl bg-slate-900/40">
          <p className="font-medium text-slate-300">
            No current opportunity data available.
          </p>
        </div>
      ) : (
        <div className="demand-list max-h-[380px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
          {demandList.map((item) => (
            <div className="demand" key={item.skillId}>
              <div className="demand-name flex items-center gap-2">
                <BarChart3 size={17} className="text-sky-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {item.skillName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    {item.category || "Technical"}{item.studentCount !== undefined ? ` • ${item.studentCount} Students` : ""}
                  </span>
                </div>
              </div>

              <span className="demand-label">{item.demandLevel}</span>

              <div className="demand-bar">
                <span
                  style={{
                    width: `${Math.max(item.demandPercentage, 6)}%`,
                  }}
                />
              </div>

              <b className="text-xs text-sky-300 font-bold">{item.demandPercentage}%</b>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default IndustryDemand;
