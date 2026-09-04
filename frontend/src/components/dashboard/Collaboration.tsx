import React, { type ReactNode } from "react";
import {
  Handshake,
  Users,
  Trophy,
  GraduationCap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CollaborationItem {
  id: string;
  title: string;
  text: string;
  icon: ReactNode;
  route: string;
  isComingSoon: boolean;
  tagText?: string;
}

const items: CollaborationItem[] = [
  {
    id: "collab-hub",
    title: "Academia–Industry Initiatives",
    text: "Join live mentorships, guest lectures & industry workshops",
    icon: <Handshake size={20} className="text-indigo-400" />,
    route: "/collaborations",
    isComingSoon: false,
  },
  {
    id: "executive-mentorship",
    title: "1-on-1 Executive Mentorship",
    text: "Direct personalized guidance from senior industry leaders",
    icon: <Users size={20} className="text-slate-400" />,
    route: "/coming-soon",
    isComingSoon: true,
    tagText: "Coming Soon",
  },
  {
    id: "sponsored-hackathons",
    title: "Sponsored Code Sprints",
    text: "Compete in company-backed hackathons & win opportunities",
    icon: <Trophy size={20} className="text-slate-400" />,
    route: "/coming-soon",
    isComingSoon: true,
    tagText: "Coming Soon",
  },
  {
    id: "faculty-exchange",
    title: "Faculty Immersion Exchange",
    text: "Industry exchange & upskilling programs for academicians",
    icon: <GraduationCap size={20} className="text-slate-400" />,
    route: "/coming-soon",
    isComingSoon: true,
    tagText: "Coming Soon",
  },
];

const Collaboration: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="panel space-y-4">
      <div className="section-heading flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Industry–Academia Collaboration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real connections. Real industry impact.
          </p>
        </div>

        <button
          className="text-btn cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          onClick={() => navigate("/collaborations")}
        >
          <span>Explore All</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(item.route)}
            className={`group relative p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
              item.isComingSoon
                ? "bg-slate-900/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/60"
                : "bg-slate-900/80 border-indigo-500/30 hover:border-indigo-500/60 hover:bg-slate-900 shadow-sm hover:shadow-indigo-500/10"
            }`}
          >
            {item.isComingSoon && (
              <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/20">
                {item.tagText || "Coming Soon"}
              </span>
            )}

            <div className="space-y-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                  item.isComingSoon
                    ? "bg-slate-800/80 text-slate-400"
                    : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                }`}
              >
                {item.icon}
              </div>

              <div>
                <h3
                  className={`text-xs font-bold leading-snug transition-colors ${
                    item.isComingSoon
                      ? "text-slate-300 group-hover:text-slate-100"
                      : "text-slate-100 group-hover:text-indigo-300"
                  }`}
                >
                  {item.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {item.text}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-slate-800/50 flex items-center justify-between text-[11px]">
              <span
                className={`font-medium flex items-center gap-1 ${
                  item.isComingSoon
                    ? "text-slate-500 group-hover:text-slate-400"
                    : "text-indigo-400 group-hover:text-indigo-300 font-semibold"
                }`}
              >
                {item.isComingSoon ? "Preview Feature" : "Explore Hub"}
              </span>
              <ExternalLink
                size={12}
                className={
                  item.isComingSoon
                    ? "text-slate-600"
                    : "text-indigo-400 group-hover:translate-x-0.5 transition-transform"
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Collaboration;
