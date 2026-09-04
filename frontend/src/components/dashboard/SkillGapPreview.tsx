import React from "react";
import { Target, AlertTriangle, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface SkillGapItem {
  skillId: number;
  skillName: string;
  category: string;
  opportunityCount: number;
  requiredProficiency: number;
  studentProficiency: number;
  hasSkill: boolean;
  gapScore: number;
  status: "Strong" | "Needs Improvement" | "Critical Gap";
  recommendation: string;
}

interface SkillGapPreviewProps {
  skills: SkillGapItem[];
  loading?: boolean;
  targetRole?: string | null;
}

const SkillGapPreview: React.FC<SkillGapPreviewProps> = ({
  skills,
  loading = false,
  targetRole,
}) => {
  const navigate = useNavigate();

  // Filter for skills that actually need improvement (or unassessed demanded skills)
  const skillsToImprove = skills
    .filter((s) => s.status === "Critical Gap" || s.status === "Needs Improvement")
    .slice(0, 4);

  // If none need improvement (e.g., student is strong in all), show top demanded skills
  const displayList = skillsToImprove.length > 0 ? skillsToImprove : skills.slice(0, 4);

  return (
    <section className="dashboard-card">
      <div className="card-header">
        <div className="header-text">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-indigo-400 shrink-0" />
            <h2 className="card-title">Skill Gap Preview</h2>
          </div>
          <p className="card-subtitle">
            Skills to improve based on active employer benchmarks
            {targetRole && <span className="text-indigo-400 font-medium"> • {targetRole}</span>}
          </p>
        </div>

        <button
          onClick={() => navigate("/student/skill-gap")}
          className="card-header-link"
        >
          <span>View Gap Analysis</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="card-body">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-800/60 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="empty-state-box">
            <CheckCircle2 size={28} className="text-emerald-500 mb-2" />
            <h3 className="empty-title">No Critical Gaps Detected</h3>
            <p className="empty-desc">
              Your verified skills currently align well with platform industry requirements.
            </p>
            <button
              onClick={() => navigate("/student/skill-gap")}
              className="empty-cta-btn"
            >
              View Full Benchmark Report
            </button>
          </div>
        ) : (
          <div className="gap-table-wrapper">
            <table className="gap-table">
              <thead>
                <tr>
                  <th>Skill</th>
                  <th className="text-center">Your Level</th>
                  <th className="text-center">Industry Target</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((item) => (
                  <tr key={item.skillId} className="gap-row">
                    <td>
                      <div className="font-semibold text-slate-200 text-xs truncate max-w-[160px]">
                        {item.skillName}
                      </div>
                      <span className="text-[10px] text-slate-500">{item.category || "Technical"}</span>
                    </td>

                    <td className="text-center">
                      <span className="text-xs font-mono font-medium text-slate-300">
                        {item.studentProficiency > 0 ? `${item.studentProficiency}%` : "0%"}
                      </span>
                    </td>

                    <td className="text-center">
                      <span className="text-xs font-mono font-medium text-indigo-300">
                        {item.requiredProficiency}%
                      </span>
                    </td>

                    <td className="text-right">
                      <span
                        className={`status-pill inline-flex items-center gap-1 ${
                          item.status === "Critical Gap"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : item.status === "Needs Improvement"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {item.status === "Critical Gap" && <AlertCircle size={11} />}
                        {item.status === "Needs Improvement" && <AlertTriangle size={11} />}
                        {item.status === "Strong" && <CheckCircle2 size={11} />}
                        <span>{item.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Compare vs {skills.length} market skills</span>
          <button
            onClick={() => navigate("/student/skill-gap")}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            Explore Roadmaps <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default SkillGapPreview;
