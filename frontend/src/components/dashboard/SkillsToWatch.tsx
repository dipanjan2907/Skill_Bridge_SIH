import React, { useState, useEffect, useCallback } from "react";
import { Brain, Loader2, TrendingUp, ArrowRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

export interface SkillWatchItem {
  skillId: number;
  skillName: string;
  category: string;
  opportunityCount: number;
  demandPercentage: number;
  industryDemand: number;
  userLevel: number;
  hasAssessed: boolean;
  gap: number;
  action: "Take Assessment" | "Improve Skill" | "Industry Ready";
}

const SkillsToWatch: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [skillsList, setSkillsList] = useState<SkillWatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const fetchSkillsToWatch = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      const res = await fetch(`${API_BASE_URL}/dashboard/skills-to-watch`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      const result = await res.json();
      if (res.ok && result.success && Array.isArray(result.data)) {
        setSkillsList(result.data);
      } else {
        setSkillsList([]);
      }
    } catch (err) {
      console.error("Failed to fetch skills to watch:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSkillsToWatch();

    const handleProfileUpdate = () => {
      fetchSkillsToWatch();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [fetchSkillsToWatch]);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Skills to Watch</h2>
          <p>Personalized skill gap & industry demand analysis</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
            onClick={fetchSkillsToWatch}
            disabled={loading}
            title="Refresh Skills to Watch"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-sky-400" : ""} />
          </button>
          <button
            className="text-btn cursor-pointer"
            onClick={() => navigate("/student/details?tab=skills")}
          >
            Assess Skills
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
          <Loader2 className="animate-spin text-sky-400" size={18} />
          <span>Analyzing skill gap data...</span>
        </div>
      ) : error || skillsList.length === 0 ? (
        <div className="p-4 text-center text-slate-400 text-xs border border-slate-800 rounded-xl bg-slate-900/40">
          <p className="font-medium text-slate-300">
            Skills data not available
          </p>
          <span className="text-[11px] font-normal text-slate-500">
            Check back later for updated skill gap insights.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {skillsList.map((skill) => (
            <div
              className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl hover:border-sky-500/40 transition-all space-y-2.5 flex flex-col justify-between"
              key={skill.skillId}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg shrink-0">
                    <Brain size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-200 truncate" title={skill.skillName}>
                      {skill.skillName}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {skill.category || "Technical"}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                    skill.action === "Industry Ready"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : skill.action === "Improve Skill"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                  }`}
                >
                  {skill.action}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 text-center text-xs py-1.5 px-2 bg-slate-950/50 rounded-lg border border-slate-800/40">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Your Level</span>
                  <strong className="text-slate-200 font-semibold text-xs">
                    {skill.hasAssessed ? `${skill.userLevel}%` : "0%"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Industry Demand</span>
                  <strong className="text-sky-400 font-semibold text-xs">
                    {skill.industryDemand}%
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Skill Gap</span>
                  <strong
                    className={`text-xs font-semibold ${
                      skill.gap > 0 ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {skill.gap > 0 ? `${skill.gap}%` : "0%"}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <TrendingUp size={11} className="text-sky-400" />
                  <span className="text-[10px] text-slate-400">{skill.opportunityCount} active opps</span>
                </span>

                <button
                  onClick={() => navigate(`/student/details?tab=skills`)}
                  className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer transition-colors text-xs"
                >
                  <span>{skill.action === "Industry Ready" ? "View Details" : skill.action}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SkillsToWatch;
