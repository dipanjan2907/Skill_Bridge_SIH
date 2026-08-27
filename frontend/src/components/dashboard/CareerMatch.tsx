import React, { useState, useEffect } from "react";
import {
  Target,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import { API_BASE_URL } from "../../config/api";

const CareerMatch: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [verifiedCount, setVerifiedCount] = useState<number>(0);

  useEffect(() => {
    const fetchCareerMatch = async () => {
      // Check session cache first
      const cached = sessionStorage.getItem("sb_career_match");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setTargetRole(parsed.targetRole);
          setMatchScore(parsed.matchScore);
          setVerifiedCount(parsed.verifiedCount);
          setLoading(false);
          return;
        } catch (_e) {}
      }

      setLoading(true);
      try {
        const authToken = token || localStorage.getItem("skillbridge_token");
        if (!authToken) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/student/profile`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const data = await res.json();
        if (res.ok && data.profile) {
          const profile = data.profile;
          const skills = data.skills || [];

          const count = skills.length;
          setVerifiedCount(count);

          const primaryRole =
            Array.isArray(profile.target_roles) &&
            profile.target_roles.length > 0
              ? profile.target_roles[0]
              : profile.department || "Software Engineer";

          setTargetRole(primaryRole);

          const score =
            skills.length > 0 ? Math.min(98, 70 + skills.length * 6) : null;
          setMatchScore(score);

          sessionStorage.setItem(
            "sb_career_match",
            JSON.stringify({
              targetRole: primaryRole,
              matchScore: score,
              verifiedCount: count,
            }),
          );
        }
      } catch (err) {
        console.error("Error fetching student profile for career match:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCareerMatch();

    const handleProfileUpdate = () => {
      sessionStorage.removeItem("sb_career_match");
      fetchCareerMatch();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [token]);

  if (loading) {
    return (
      <section className="right-card career-card flex flex-col items-center justify-center py-6">
        <Loader2 className="animate-spin text-indigo-400 mb-2" size={24} />
        <span className="text-xs text-slate-400">
          Calculating career match...
        </span>
      </section>
    );
  }

  return (
    <section className="right-card career-card">
      <div className="right-title">
        <Target size={18} className="text-indigo-400" />
        <h2>Career Match</h2>
      </div>

      {matchScore !== null && targetRole ? (
        <>
          <div className="match">
            <div className="circle">
              <strong>{matchScore}%</strong>
            </div>

            <div>
              <small>Great Match for</small>
              <h2>{targetRole}</h2>
              <div className="tags">
                <span>High Demand</span>
                <span>Growth Role</span>
              </div>
            </div>
          </div>

          <div className="why">
            <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
            <span>
              Your {verifiedCount} verified skill
              {verifiedCount > 1 ? "s align" : " aligns"} with this target role.
            </span>
          </div>

          <button
            className="outline-btn cursor-pointer"
            onClick={() => navigate("/student/details?tab=skills")}
          >
            Enhance Skill Match
            <ArrowRight size={15} />
          </button>
        </>
      ) : (
        <div className="space-y-4 py-2">
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-left">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles size={16} />
              <strong className="text-xs font-semibold text-slate-200">
                Match Not Calculated
              </strong>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete your profile or verify skills in your Skill DNA tab to
              compute your career match score.
            </p>
          </div>

          <button
            className="outline-btn cursor-pointer w-full"
            onClick={() => navigate("/student/details?tab=skills")}
          >
            Enhance Skill Match
            <ArrowRight size={15} />
          </button>
        </div>
      )}
    </section>
  );
};

export default CareerMatch;
