import React from "react";
import {
  Award,
  ShieldCheck,
  FileText,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface DashboardMetricsData {
  readinessPercentage: number | null;
  strongSkillsCount: number;
  totalSkillsCount: number;
  badgesCount: number;
  applicationsCount: number;
  activeApplicationsCount: number;
  opportunitiesCount: number;
  strongMatchesCount: number;
}

interface DashboardMetricsProps {
  metrics: DashboardMetricsData;
  loading?: boolean;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ metrics, loading = false }) => {
  const navigate = useNavigate();

  const cards = [
    {
      id: "readiness",
      label: "Skill Readiness",
      value: metrics.readinessPercentage !== null ? `${metrics.readinessPercentage}%` : "—",
      subtext:
        metrics.strongSkillsCount > 0
          ? `${metrics.strongSkillsCount} skills meeting industry benchmark`
          : "Based on active opportunity demand",
      icon: <Award size={20} className="text-indigo-400" />,
      route: "/student/skill-gap",
      badge: metrics.readinessPercentage !== null && metrics.readinessPercentage >= 75 ? "Target Met" : "In Progress",
      badgeColor:
        metrics.readinessPercentage !== null && metrics.readinessPercentage >= 75
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    {
      id: "skills",
      label: "Verified Skills",
      value: loading ? "..." : String(metrics.totalSkillsCount),
      subtext:
        metrics.badgesCount > 0
          ? `${metrics.badgesCount} verified by formal assessment`
          : `${metrics.totalSkillsCount} listed on profile`,
      icon: <ShieldCheck size={20} className="text-indigo-400" />,
      route: "/student/details?tab=skills",
      badge: metrics.totalSkillsCount > 0 ? "Skill Matrix" : "Add Skills",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
    {
      id: "applications",
      label: "Applications",
      value: loading ? "..." : String(metrics.applicationsCount),
      subtext:
        metrics.activeApplicationsCount > 0
          ? `${metrics.activeApplicationsCount} currently in active review`
          : metrics.applicationsCount > 0
          ? "Submitted applications tracked"
          : "No active submissions",
      icon: <FileText size={20} className="text-indigo-400" />,
      route: "/student/applications",
      badge: metrics.applicationsCount > 0 ? "Track Status" : "Explore",
      badgeColor: "bg-slate-800 text-slate-300 border-slate-700/60",
    },
    {
      id: "opportunities",
      label: "Opportunities",
      value: loading ? "..." : String(metrics.opportunitiesCount),
      subtext:
        metrics.strongMatchesCount > 0
          ? `${metrics.strongMatchesCount} high skill-match listings`
          : "Available industry postings",
      icon: <Briefcase size={20} className="text-indigo-400" />,
      route: "/opportunities",
      badge: metrics.strongMatchesCount > 0 ? "Matches Ready" : "Browse All",
      badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    },
  ];

  return (
    <div className="metrics-grid">
      {cards.map((card) => (
        <div
          key={card.id}
          className="metric-card group"
          onClick={() => navigate(card.route)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate(card.route);
            }
          }}
        >
          <div className="metric-header">
            <div className="metric-icon-box">{card.icon}</div>
            <div className="flex items-center gap-2">
              <span className={`metric-badge ${card.badgeColor}`}>{card.badge}</span>
              <ArrowUpRight
                size={14}
                className="metric-arrow text-slate-500 group-hover:text-indigo-400 transition-colors"
              />
            </div>
          </div>

          <div className="metric-body">
            <span className="metric-label">{card.label}</span>
            <div className="metric-value-row">
              <span className="metric-value">{loading ? "—" : card.value}</span>
            </div>
            <p className="metric-subtext truncate" title={card.subtext}>
              {card.subtext}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardMetrics;
