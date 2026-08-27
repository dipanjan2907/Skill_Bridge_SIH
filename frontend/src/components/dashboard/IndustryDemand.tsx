import React, { useState, useEffect } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../../config/api";

export interface DemandItem {
  skillId: number;
  skillName: string;
  category: string;
  opportunityCount: number;
  demandPercentage: number;
  demandLevel: string;
}

const IndustryDemand: React.FC = () => {
  const navigate = useNavigate();
  const [demandList, setDemandList] = useState<DemandItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchDemandData = async () => {
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
    };

    fetchDemandData();
  }, []);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Industry Demand</h2>
          <p>Based on current SkillBridge opportunities</p>
        </div>

        <button
          className="text-btn cursor-pointer"
          onClick={() => navigate("/student/industry-demand")}
        >
          View Report
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
          <Loader2 className="animate-spin text-indigo-400" size={18} />
          <span>Loading industry demand...</span>
        </div>
      ) : error ? (
        <div className="p-4 text-center text-slate-400 text-xs border border-slate-800 rounded-xl bg-slate-900/40">
          <p className="font-medium text-slate-300">Unable to load industry demand</p>
          <span className="text-[11px] text-slate-500">Please check server connection.</span>
        </div>
      ) : demandList.length === 0 ? (
        <div className="p-4 text-center text-slate-400 text-xs border border-slate-800 rounded-xl bg-slate-900/40">
          <p className="font-medium text-slate-300">No current opportunity data available.</p>
          <span className="text-[11px] text-slate-500">Publish industry opportunities to populate demand.</span>
        </div>
      ) : (
        <div className="demand-list">
          {demandList.map((item) => (
            <div className="demand" key={item.skillId}>
              <div className="demand-name">
                <BarChart3 size={17} className="text-indigo-400 shrink-0" />
                <span title={`${item.skillName} (${item.category})`}>
                  {item.skillName}
                </span>
              </div>

              <span className="demand-label">{item.demandLevel}</span>

              <div className="demand-bar">
                <span
                  style={{
                    width: `${Math.max(item.demandPercentage, 6)}%`,
                  }}
                />
              </div>

              <b>{item.demandPercentage}%</b>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default IndustryDemand;