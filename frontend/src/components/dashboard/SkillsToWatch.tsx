import React, { useState, useEffect } from "react";
import { Brain, Loader2, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL } from "../../config/api";

interface SkillWatchItem {
  skillId: number;
  skillName: string;
  category: string;
  opportunityCount: number;
  demandPercentage: number;
  demandLevel: string;
}

const SkillsToWatch: React.FC = () => {
  const navigate = useNavigate();
  const [skillsList, setSkillsList] = useState<SkillWatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchSkillsToWatch = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard/skills-to-watch`);
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
    };

    fetchSkillsToWatch();
  }, []);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Skills to Watch</h2>
          <p>Based on current platform industry demand</p>
        </div>

        <button
          className="text-btn cursor-pointer"
          onClick={() => navigate("/student/assessments")}
        >
          Assess Skills
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
          <Loader2 className="animate-spin text-indigo-400" size={18} />
          <span>Loading industry skill trends...</span>
        </div>
      ) : error || skillsList.length === 0 ? (
        <div className="p-4 text-center text-slate-400 text-xs border border-slate-800 rounded-xl bg-slate-900/40">
          <p className="font-medium text-slate-300">Skills data not available</p>
          <span className="text-[11px] font-normal text-slate-500">Check back later for updated skill trends.</span>
        </div>
      ) : (
        <div className="skills-grid">
          {skillsList.map((skill) => (
            <div
              className="skill-card cursor-pointer hover:border-indigo-500/40 transition-all group"
              key={skill.skillId}
              onClick={() => navigate("/student/assessments")}
              title={`Click to take assessment for ${skill.skillName}`}
            >
              <div className="skill-icon group-hover:scale-110 transition-transform">
                <Brain size={18} />
              </div>

              <div>
                <b className="group-hover:text-indigo-300 transition-colors">{skill.skillName}</b>
                <small className="flex items-center gap-1">
                  <span>{skill.category || "Technical"}</span>
                  <span>•</span>
                  <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
                    <TrendingUp size={10} /> {skill.demandLevel}
                  </span>
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SkillsToWatch;
