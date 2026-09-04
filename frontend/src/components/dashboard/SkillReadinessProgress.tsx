import React from "react";
import { Award, CheckCircle2, ArrowRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface SkillProgressItem {
  id?: number;
  skill_id?: number;
  skillId?: number;
  name: string;
  category?: string;
  proficiency_score?: number | null;
  proficiencyScore?: number | null;
  verification_source?: string | null;
  is_badge_earned?: boolean;
  isBadgeEarned?: boolean;
}

interface SkillReadinessProgressProps {
  skills: SkillProgressItem[];
  loading?: boolean;
  onTakeAssessment?: (skillId: number, skillName: string) => void;
}

const SkillReadinessProgress: React.FC<SkillReadinessProgressProps> = ({
  skills,
  loading = false,
}) => {
  const navigate = useNavigate();

  // Sort by highest proficiency, take top 5
  const displaySkills = [...skills]
    .sort((a, b) => {
      const scoreA = Number(a.proficiency_score ?? a.proficiencyScore ?? 0);
      const scoreB = Number(b.proficiency_score ?? b.proficiencyScore ?? 0);
      return scoreB - scoreA;
    })
    .slice(0, 5);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-indigo-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-slate-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Advanced", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    if (score >= 60) return { label: "Proficient", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" };
    if (score >= 40) return { label: "Intermediate", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    return { label: "Beginner", color: "text-slate-400 bg-slate-800 border-slate-700" };
  };

  return (
    <section className="dashboard-card">
      <div className="card-header">
        <div className="header-text">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-indigo-400 shrink-0" />
            <h2 className="card-title">Your Skill Readiness</h2>
          </div>
          <p className="card-subtitle">Verified proficiency breakdown across your technical core</p>
        </div>

        <button
          onClick={() => navigate("/student/details?tab=skills")}
          className="card-header-link"
        >
          <span>All Skills ({skills.length})</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="card-body">
        {loading ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skill-skeleton-row animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-1/3 mb-2" />
                <div className="h-2 bg-slate-800/60 rounded w-full" />
              </div>
            ))}
          </div>
        ) : displaySkills.length === 0 ? (
          <div className="empty-state-box">
            <Award size={28} className="text-slate-600 mb-2" />
            <h3 className="empty-title">No skills added yet</h3>
            <p className="empty-desc">
              Add technical skills to your profile and take assessments to build your verified Skill Matrix.
            </p>
            <button
              onClick={() => navigate("/student/details?tab=skills")}
              className="empty-cta-btn"
            >
              <Plus size={14} /> Add Skills
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {displaySkills.map((item) => {
              const score = Number(item.proficiency_score ?? item.proficiencyScore ?? 0);
              const badgeInfo = getScoreBadge(score);
              const isVerified =
                item.is_badge_earned ||
                item.isBadgeEarned ||
                (item.verification_source && item.verification_source.toLowerCase().includes("assessment"));
              const skillId = item.skill_id || item.skillId || item.id || 0;

              return (
                <div key={`${item.name}-${skillId}`} className="skill-progress-item group">
                  <div className="skill-meta-row">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="skill-name truncate">{item.name}</span>
                      {item.category && (
                        <span className="skill-category-tag truncate">{item.category}</span>
                      )}
                      {isVerified && (
                        <span className="verified-badge" title="Verified by Skill Assessment">
                          <CheckCircle2 size={11} className="text-emerald-400" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`proficiency-badge ${badgeInfo.color}`}>
                        {badgeInfo.label}
                      </span>
                      <span className="proficiency-number">{score}%</span>
                    </div>
                  </div>

                  {/* Thin elegant horizontal progress indicator */}
                  <div className="skill-progress-track">
                    <div
                      className={`skill-progress-fill ${getScoreColor(score)}`}
                      style={{ width: `${Math.max(score, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Target standard: ≥70% for industry qualification</span>
          <button
            onClick={() => navigate("/student/details?tab=assessments")}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            Assess New Skill <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default SkillReadinessProgress;
