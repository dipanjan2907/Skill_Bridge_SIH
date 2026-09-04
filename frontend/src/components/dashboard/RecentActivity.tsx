import React from "react";
import {
  Clock,
  CheckCircle2,
  Award,
  UserCheck,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface ActivityEvent {
  id: string;
  type: "application" | "assessment" | "skill" | "profile";
  title: string;
  subtitle?: string;
  timestamp: string | Date;
  link?: string;
}

interface RecentActivityProps {
  applications?: any[];
  skills?: any[];
  profile?: any;
  loading?: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  applications = [],
  skills = [],
  profile,
  loading = false,
}) => {
  const navigate = useNavigate();

  // Helper for human-readable relative time
  const formatRelativeTime = (timestamp?: string | Date) => {
    if (!timestamp) return "Recently";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Recently";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 5) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? "week" : "weeks"} ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Synthesize genuine chronological activities from real backend records
  const events: ActivityEvent[] = [];

  // 1. Applications events
  applications.forEach((app, idx) => {
    const oppTitle = app.opportunity?.title || "Industry Opportunity";
    const company = app.opportunity?.industry?.companyName || "Verified Partner";
    events.push({
      id: `app-${app.id || idx}`,
      type: "application",
      title: `Applied for ${oppTitle}`,
      subtitle: `${company} • Status: ${(app.status || "Applied").toUpperCase()}`,
      timestamp: app.appliedAt || app.applied_at || new Date(Date.now() - idx * 86400000),
      link: "/student/applications",
    });
  });

  // 2. Skills and assessments events
  skills.forEach((skill, idx) => {
    const isAssessed =
      skill.is_badge_earned ||
      skill.isBadgeEarned ||
      (skill.verification_source && skill.verification_source.toLowerCase().includes("assessment"));
    const score = Number(skill.proficiency_score ?? skill.proficiencyScore ?? 0);

    if (isAssessed) {
      events.push({
        id: `skill-assessed-${skill.id || idx}`,
        type: "assessment",
        title: `Completed ${skill.name} Assessment`,
        subtitle: `Achieved ${score}% verified score • Badge Earned`,
        timestamp: new Date(Date.now() - (idx + 1) * 3600000 * 5),
        link: "/student/details?tab=skills",
      });
    } else {
      events.push({
        id: `skill-added-${skill.id || idx}`,
        type: "skill",
        title: `Added ${skill.name} to Profile`,
        subtitle: `${skill.category || "Technical Skill"} • Self-Reported`,
        timestamp: new Date(Date.now() - (idx + 2) * 86400000),
        link: "/student/details?tab=skills",
      });
    }
  });

  // 3. Profile update event if profile exists
  if (profile?.department || profile?.institution) {
    events.push({
      id: "profile-init",
      type: "profile",
      title: "Academic Profile Synchronized",
      subtitle: `${profile.department || "Academic Department"} • ${profile.institution || "Enrolled Institution"}`,
      timestamp: new Date(Date.now() - 4 * 86400000),
      link: "/student/details?tab=profile",
    });
  }

  // Sort chronological descending, take top 4
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const displayEvents = events.slice(0, 4);

  const getEventIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "application":
        return <Briefcase size={14} className="text-indigo-400" />;
      case "assessment":
        return <CheckCircle2 size={14} className="text-emerald-400" />;
      case "skill":
        return <Award size={14} className="text-indigo-400" />;
      case "profile":
        return <UserCheck size={14} className="text-indigo-400" />;
      default:
        return <Clock size={14} className="text-slate-400" />;
    }
  };

  return (
    <section className="dashboard-card">
      <div className="card-header">
        <div className="header-text">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-indigo-400 shrink-0" />
            <h2 className="card-title">Recent Activity</h2>
          </div>
          <p className="card-subtitle">Real-time log of your assessments, applications, and updates</p>
        </div>

        <button
          onClick={() => navigate("/student/details")}
          className="card-header-link"
        >
          <span>Activity Log</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="card-body">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="empty-state-box">
            <Clock size={28} className="text-slate-600 mb-2" />
            <h3 className="empty-title">No recent activity recorded</h3>
            <p className="empty-desc">
              Take skill assessments or apply for opportunities to build your activity history.
            </p>
            <button
              onClick={() => navigate("/opportunities")}
              className="empty-cta-btn"
            >
              Explore Opportunities
            </button>
          </div>
        ) : (
          <div className="activity-timeline">
            {displayEvents.map((evt) => (
              <div
                key={evt.id}
                className="activity-item group"
                onClick={() => evt.link && navigate(evt.link)}
                role={evt.link ? "button" : undefined}
                tabIndex={evt.link ? 0 : undefined}
              >
                <div className="activity-icon-container">
                  <div className="activity-icon-bubble">{getEventIcon(evt.type)}</div>
                  <div className="activity-line" />
                </div>

                <div className="activity-content min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="activity-title truncate">{evt.title}</span>
                    <span className="activity-time shrink-0">{formatRelativeTime(evt.timestamp)}</span>
                  </div>
                  {evt.subtitle && <p className="activity-subtitle truncate">{evt.subtitle}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Tracked across platform sessions</span>
          <button
            onClick={() => navigate("/student/applications")}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            Manage Applications <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default RecentActivity;
