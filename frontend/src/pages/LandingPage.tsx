import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Brain,
  BarChart3,
  Target,
  Briefcase,
  ClipboardList,
  Award,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  TrendingUp,
  Search,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../config/api";

interface SkillDemandItem {
  name: string;
  category: string;
  count: number;
  percentage: number;
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAudienceTab, setActiveAudienceTab] = useState<
    "students" | "industries" | "institutions" | "academicians"
  >("students");

  // Real Industry Demand metrics fetched from backend public endpoint
  const [demandSkills, setDemandSkills] = useState<SkillDemandItem[]>([]);
  const [loadingDemand, setLoadingDemand] = useState<boolean>(true);
  const [totalPublishedOpportunities, setTotalPublishedOpportunities] =
    useState<number>(0);
  const [liveOpportunities, setLiveOpportunities] = useState<any[]>([]);

  useEffect(() => {
    const fetchPublicDemand = async () => {
      setLoadingDemand(true);
      try {
        const res = await fetch(`${API_BASE_URL}/opportunities`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.opportunities)) {
            setTotalPublishedOpportunities(data.opportunities.length);
            setLiveOpportunities(data.opportunities);

            // Aggregate skills from live published opportunities
            const skillCounts: Record<
              string,
              { count: number; category: string }
            > = {};
            let totalSkillOccurrences = 0;

            data.opportunities.forEach((opp: any) => {
              if (Array.isArray(opp.requiredSkills)) {
                opp.requiredSkills.forEach((sk: any) => {
                  const name = sk.skill_name || sk.name || "Technical Skill";
                  const category = sk.category || "Technical";
                  if (!skillCounts[name]) {
                    skillCounts[name] = { count: 0, category };
                  }
                  skillCounts[name].count += 1;
                  totalSkillOccurrences += 1;
                });
              }
            });

            if (totalSkillOccurrences > 0) {
              const sortedSkills: SkillDemandItem[] = Object.entries(
                skillCounts,
              )
                .map(([name, info]) => ({
                  name,
                  category: info.category,
                  count: info.count,
                  percentage: Math.round(
                    (info.count / Math.max(1, data.opportunities.length)) * 100,
                  ),
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 6);

              setDemandSkills(sortedSkills);
            }
          }
        }
      } catch (err) {
        console.error("Public demand fetch error:", err);
      } finally {
        setLoadingDemand(false);
      }
    };

    fetchPublicDemand();
  }, []);

  const handleDashboardRedirect = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const role = user?.role ? user.role.toString().toLowerCase() : "";
    if (role === "admin") {
      navigate("/admin/dashboard");
    } else if (role === "industry") {
      navigate("/industry/profile");
    } else if (
      ["institution", "academician", "faculty", "institute"].includes(role)
    ) {
      navigate("/institution/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 bg-[#0b1120]/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                Skill<span className="text-indigo-400">Bridge</span>
              </span>
              <span className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase">
                Academia &bull; Industry
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80 text-xs font-medium">
            <button
              onClick={() => scrollToSection("hero")}
              className="px-3.5 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="px-3.5 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="px-3.5 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("who-is-it-for")}
              className="px-3.5 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Ecosystem
            </button>
            <button
              onClick={() => scrollToSection("industry-demand")}
              className="px-3.5 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              Skill Demand
            </button>
          </nav>

          {/* RIGHT ACTION BUTTONS */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={handleDashboardRedirect}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800/50 rounded-xl transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="px-4.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/25 flex items-center gap-1.5"
                >
                  Get Started
                  <ChevronRight size={14} />
                </Link>
              </>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 backdrop-blur-2xl border-b border-slate-800 px-4 py-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col space-y-2 text-sm font-medium">
              <button
                onClick={() => scrollToSection("hero")}
                className="text-left px-3 py-2 text-slate-300 hover:text-indigo-400"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-left px-3 py-2 text-slate-300 hover:text-indigo-400"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="text-left px-3 py-2 text-slate-300 hover:text-indigo-400"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("who-is-it-for")}
                className="text-left px-3 py-2 text-slate-300 hover:text-indigo-400"
              >
                Ecosystem
              </button>
              <button
                onClick={() => scrollToSection("industry-demand")}
                className="text-left px-3 py-2 text-slate-300 hover:text-indigo-400"
              >
                Skill Demand
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              {isAuthenticated ? (
                <button
                  onClick={handleDashboardRedirect}
                  className="w-full py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight size={14} />
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full py-2.5 text-center text-slate-200 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    className="w-full py-2.5 text-center text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ================= 1. HERO SECTION ================= */}
      <section
        id="hero"
        className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden"
      >
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[250px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            {/* HERO CONTENT */}
            <div className="max-w-2xl text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide">
                <Sparkles size={14} className="text-indigo-400" />
                <span>Academia–Industry Convergence Engine</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
                Bridging Academia and{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">
                  Industry Through Skills,
                </span>{" "}
                <span className="text-slate-300 font-bold">
                  Securing Your Future.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                SkillBridge connects students, academia and industry through
                intelligent skill mapping, personalized growth paths and
                real-world career opportunities.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Explore SkillBridge
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>

                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="w-full sm:w-auto px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  See how it works
                </button>

                <button
                  onClick={() =>
                    navigate(isAuthenticated ? "/opportunities" : "/login")
                  }
                  className="w-full sm:w-auto px-5 py-3.5 bg-slate-900/50 hover:bg-slate-800/80 text-slate-300 hover:text-white font-semibold text-sm rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search size={16} className="text-indigo-400" />
                  Opportunities
                </button>
              </div>

              {/* Proof / Trust Indicator */}
              <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
                <div className="flex items-center -space-x-2">
                  <i className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-300 not-italic shadow-sm">
                    A
                  </i>
                  <i className="w-8 h-8 rounded-full bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-xs font-bold text-cyan-300 not-italic shadow-sm">
                    S
                  </i>
                  <i className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-xs font-bold text-emerald-300 not-italic shadow-sm">
                    R
                  </i>
                  <i className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-xs font-bold text-purple-300 not-italic shadow-sm">
                    +
                  </i>
                </div>
                <span className="font-medium text-slate-300 text-center sm:text-left">
                  Built to turn learning into measurable career readiness.
                </span>
              </div>
            </div>

            {/* PURE HTML/CSS/REACT 3D SPATIAL ECOSYSTEM CONVERGENCE DIAGRAM */}
            <div className="w-full lg:w-[580px] shrink-0 relative">
              <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
                {/* Header Tag */}
                <div className="text-center mb-6">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3.5 py-1 rounded-full border border-indigo-500/20 shadow-sm">
                    AI-Powered Tri-Party Spatial Ecosystem
                  </span>
                </div>

                {/* Ambient Background Glow Orbs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/20 blur-[70px] rounded-full pointer-events-none" />
                <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-cyan-500/15 blur-[50px] rounded-full pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/15 blur-[50px] rounded-full pointer-events-none" />

                {/* 3D SPATIAL CANVAS CONTAINER */}
                <div className="relative min-h-[380px] flex flex-col justify-between items-center py-2 px-1">
                  {/* 1. TOP NODE: STUDENT */}
                  <div className="relative z-20 group">
                    <div className="bg-slate-950/90 backdrop-blur-xl border border-indigo-500/40 hover:border-indigo-400/80 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xl shadow-indigo-500/20 transition-all transform hover:-translate-y-1 cursor-default">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white tracking-wide">
                            STUDENT
                          </span>
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Skill DNA & Profile
                        </span>
                      </div>
                    </div>
                    {/* Floating mini badge */}
                    <div className="absolute -top-3 -right-2 bg-indigo-950/90 border border-indigo-500/30 text-indigo-300 text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                      Assessed
                    </div>
                  </div>

                  {/* VERTICAL STREAM: STUDENT DOWN TO CORE */}
                  <div className="w-0.5 h-12 bg-gradient-to-b from-indigo-500 via-indigo-400 to-cyan-400 relative overflow-hidden rounded-full my-1">
                    <div className="absolute top-0 left-0 w-full h-full bg-white/80 animate-pulse" />
                  </div>

                  {/* MIDDLE HORIZONTAL ROW: [ACADEMIA] -> [SKILLBRIDGE CORE] -> [CAREER OUTCOMES] */}
                  <div className="w-full flex items-center justify-between gap-2 relative z-20 my-1">
                    {/* 2. LEFT NODE: ACADEMIA */}
                    <div className="relative group shrink-0">
                      <div className="bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 hover:border-cyan-400/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-xl shadow-cyan-500/20 transition-all transform hover:-translate-y-1 cursor-default">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white tracking-wide">
                            ACADEMIA
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium">
                            Curriculum
                          </div>
                        </div>
                      </div>
                      <div className="absolute -bottom-2 left-2 bg-cyan-950/90 border border-cyan-500/30 text-cyan-300 text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                        Pathways
                      </div>
                    </div>

                    {/* STREAM: ACADEMIA RIGHT TO CORE */}
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-indigo-400 relative overflow-hidden rounded-full mx-1">
                      <div className="absolute top-0 left-0 w-full h-full bg-cyan-300/80 animate-pulse" />
                    </div>

                    {/* 3. CENTRAL FOCAL CORE: SKILLBRIDGE CORE */}
                    <div className="relative shrink-0 group">
                      {/* Pulse outer rings */}
                      <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500 opacity-40 blur-md group-hover:opacity-75 transition duration-500 animate-pulse" />

                      <div className="relative bg-slate-950/95 backdrop-blur-2xl border-2 border-indigo-400/70 rounded-2xl px-4 py-3 text-center shadow-2xl shadow-indigo-500/50">
                        <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-md">
                          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-indigo-300 animate-spin-slow" />
                          </div>
                        </div>
                        <div className="text-xs font-black text-white tracking-wider uppercase">
                          SkillBridge
                        </div>
                      </div>
                    </div>

                    {/* STREAM: CORE OUTWARD RIGHT TO CAREER OUTCOMES */}
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-indigo-400 via-emerald-400 to-emerald-500 relative overflow-hidden rounded-full mx-1">
                      <div className="absolute top-0 left-0 w-full h-full bg-emerald-300/80 animate-pulse" />
                    </div>

                    {/* 4. RIGHT OUTPUT NODE: CAREER OUTCOMES */}
                    <div className="relative group shrink-0">
                      <div className="bg-slate-950/90 backdrop-blur-xl border border-emerald-500/40 hover:border-emerald-400/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-1 cursor-default">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <Target size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-300 tracking-wide">
                            OUTCOMES
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium">
                            Readiness +24%
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-2 right-2 bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                        92% Match
                      </div>
                    </div>
                  </div>

                  {/* VERTICAL STREAM: INDUSTRY UP TO CORE */}
                  <div className="w-0.5 h-12 bg-gradient-to-t from-purple-500 via-indigo-500 to-indigo-400 relative overflow-hidden rounded-full my-1">
                    <div className="absolute top-0 left-0 w-full h-full bg-purple-300/80 animate-pulse" />
                  </div>

                  {/* 5. BOTTOM NODE: INDUSTRY */}
                  <div className="relative z-20 group">
                    <div className="bg-slate-950/90 backdrop-blur-xl border border-purple-500/40 hover:border-purple-400/80 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xl shadow-purple-500/20 transition-all transform hover:-translate-y-1 cursor-default">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white tracking-wide">
                          INDUSTRY
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Job Demand & Hiring
                        </span>
                      </div>
                    </div>
                    {/* Floating mini badge */}
                    <div className="absolute -bottom-3 -left-2 bg-purple-950/90 border border-purple-500/30 text-purple-300 text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                      Verified
                    </div>
                  </div>

                  {/* FLOATING GLASS UI CHIPS */}
                  <div className="absolute top-3 left-4 bg-slate-950/80 backdrop-blur-md border border-rose-500/40 text-rose-300 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md pointer-events-none">
                    <CheckCircle2 size={13} className="text-rose-400" />
                    Skill gap detected
                  </div>

                  <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md border border-indigo-500/40 text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md pointer-events-none">
                    <Sparkles size={13} className="text-indigo-400" />
                    Internship matched
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. THE PROBLEM ================= */}
      <section
        id="the-problem"
        className="py-16 bg-slate-950/60 border-y border-slate-800/80 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              The Challenge We Solve
            </span>
            <h2 className="text-3xl font-black text-white">
              The Skill-Gap Paradigm in Technical Education
            </h2>
            <p className="text-sm text-slate-400">
              Traditional education faces a critical disconnect between academic
              curriculum and rapid industry skill evolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Problem 1: Students */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-rose-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
                <GraduationCap size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <GraduationCap size={20} className="text-rose-400" />
                Students
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                &ldquo;Unclear about which skills industries actually
                demand.&rdquo;
              </p>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Lack of structured skill benchmark evaluation
              </div>
            </div>

            {/* Problem 2: Industry */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Briefcase size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Briefcase size={20} className="text-amber-400" />
                Industries
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                &ldquo;Difficulty finding candidates with the right
                skills.&rdquo;
              </p>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                High screening costs & mismatch between degree and proficiency
              </div>
            </div>

            {/* Problem 3: Academia */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Building2 size={20} className="text-cyan-400" />
                Academia
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                &ldquo;Limited visibility into student skill gaps and industry
                requirements.&rdquo;
              </p>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Delayed placement feedback & curriculum misalignment
              </div>
            </div>
          </div>

          {/* Unified Solution Statement */}
          <div className="mt-12 p-6 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl text-center space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-cyan-300">
              One platform. Three ecosystems. One common goal: career-ready
              talent.
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl mx-auto">
              SkillBridge provides the missing diagnostic layer between
              classroom education and corporate recruitment.
            </p>
          </div>
        </div>
      </section>

      {/* ================= 3. HOW SKILLBRIDGE WORKS ================= */}
      <section id="how-it-works" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Platform Workflow
            </span>
            <h2 className="text-3xl font-black text-white">
              How SkillBridge Works
            </h2>
            <p className="text-sm text-slate-400">
              A structured 5-step process connecting student preparation with
              industry opportunity matching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: "01",
                title: "Assess Skills",
                desc: "Evaluate technical proficiency through timed, structured assessments.",
                icon: Brain,
                color: "text-indigo-400",
                bg: "bg-indigo-500/10 border-indigo-500/20",
              },
              {
                step: "02",
                title: "Build Skill Profile",
                desc: "Generate a verified Skill DNA matrix and digital portfolio showcase.",
                icon: Award,
                color: "text-cyan-400",
                bg: "bg-cyan-500/10 border-cyan-500/20",
              },
              {
                step: "03",
                title: "Analyze Skill Gaps",
                desc: "Compare personal proficiency against real-time industry demand benchmarks.",
                icon: BarChart3,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
              },
              {
                step: "04",
                title: "Discover Opportunities",
                desc: "Explore verified internships and job postings matching your skill profile.",
                icon: Briefcase,
                color: "text-amber-400",
                bg: "bg-amber-500/10 border-amber-500/20",
              },
              {
                step: "05",
                title: "Apply & Track",
                desc: "Submit applications directly and monitor recruitment stages in real time.",
                icon: ClipboardList,
                color: "text-purple-400",
                bg: "bg-purple-500/10 border-purple-500/20",
              },
            ].map((st) => (
              <div
                key={st.step}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-400 group-hover:text-indigo-400 transition-colors">
                      {st.step}
                    </span>
                    <div
                      className={`p-2.5 rounded-xl border ${st.bg} ${st.color}`}
                    >
                      <st.icon size={20} />
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">
                    {st.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 3.5 LIVE OPPORTUNITIES SECTION ================= */}
      <section
        id="opportunities"
        className="py-24 bg-slate-950/60 border-t border-slate-800/80 relative overflow-hidden"
      >
        {/* Background decorative glow element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-400 bg-sky-500/10 px-3.5 py-1.5 rounded-full border border-sky-500/20 shadow-inner">
              OPPORTUNITIES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Don't just learn skills.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-cyan-400">
                Use them.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
              Discover internships, projects and early-career opportunities that
              actually match your growing skill profile.
            </p>
            <p className="text-[11px] text-slate-400 italic font-medium pt-1">
              * Live opportunities sourced dynamically from active SkillBridge
              database postings.
            </p>
          </div>

          {loadingDemand ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-3">
              <div className="animate-spin w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full mx-auto shadow-lg shadow-sky-500/20" />
              <p className="font-medium tracking-wide">
                Fetching active opportunities from SkillBridge database...
              </p>
            </div>
          ) : liveOpportunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveOpportunities.slice(0, 6).map((opp: any, idx: number) => {
                const companyName =
                  opp.company_name || opp.companyName || "Partner Company";
                const companyInitial = companyName.charAt(0).toUpperCase();
                const roleTitle = opp.title || "Industry Opportunity";
                const location = opp.location || "Remote / Hybrid";
                const matchPercent =
                  opp.matchPercentage || 85 + ((opp.id || idx) % 12);

                return (
                  <div
                    key={opp.id || idx}
                    onClick={() =>
                      navigate(isAuthenticated ? "/opportunities" : "/login")
                    }
                    className="group relative bg-slate-900/60 backdrop-blur-xl border border-slate-800/90 hover:border-sky-500/50 rounded-3xl p-6 transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between space-y-6 cursor-pointer shadow-xl hover:shadow-[0_15px_30px_-10px_rgba(14,165,233,0.2)] overflow-hidden"
                  >
                    {/* Subtle top hover line accent */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400/0 group-hover:via-sky-400 to-transparent transition-all duration-500" />

                    <div className="space-y-4">
                      {/* Header Row: Company Icon & Match Score */}
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/10 border border-sky-500/30 text-sky-300 font-black flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform duration-300">
                          {companyInitial}
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-full border border-sky-500/20 shadow-sm">
                          <Sparkles
                            size={13}
                            className="text-sky-400 animate-pulse"
                          />
                          {matchPercent}% match
                        </span>
                      </div>

                      {/* Role Details */}
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1 tracking-tight">
                          {roleTitle}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold tracking-wide">
                          {companyName}
                        </p>
                      </div>

                      {/* Location Badge */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-800/60 w-fit">
                        <MapPin size={14} className="text-sky-400 shrink-0" />
                        <span className="font-medium">{location}</span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                      <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-300 tracking-wider uppercase">
                        SkillBenchmarked *
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-slate-800/60 group-hover:bg-sky-500 text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                        <ArrowUpRight
                          size={16}
                          className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-14 px-6 bg-slate-900/40 backdrop-blur-md border border-slate-800/90 rounded-3xl max-w-xl mx-auto space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
                <Briefcase size={26} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-200">
                  No active opportunities in DB yet
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  * Live opportunities will populate here dynamically as
                  industry partners post hiring criteria.
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/25 cursor-pointer"
              >
                Join as Industry Partner to Post
              </button>
            </div>
          )}

          {liveOpportunities.length > 6 && (
            <div className="mt-14 text-center">
              <button
                onClick={() =>
                  navigate(isAuthenticated ? "/opportunities" : "/login")
                }
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs rounded-2xl border border-slate-700/80 hover:border-sky-500/50 transition-all cursor-pointer shadow-xl group"
              >
                View All {totalPublishedOpportunities} Live DB Opportunities
                <ArrowUpRight
                  size={16}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-sky-400"
                />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================= 4. WHO IS SKILLBRIDGE FOR? ================= */}
      <section
        id="who-is-it-for"
        className="py-20 bg-slate-950/60 border-t border-slate-800/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              User Roles & Value
            </span>
            <h2 className="text-3xl font-black text-white">
              Who is SkillBridge For?
            </h2>
            <p className="text-sm text-slate-400">
              Tailored workspaces engineered specifically for students, industry
              recruiters, institutional leaders, and faculty.
            </p>
          </div>

          {/* TAB BUTTONS FOR MOBILE/DESKTOP SWITCHING */}
          <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
            {[
              { id: "students", label: "Students", icon: GraduationCap },
              { id: "industries", label: "Industries", icon: Briefcase },
              { id: "institutions", label: "Institutions", icon: Building2 },
              { id: "academicians", label: "Academicians", icon: BookOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveAudienceTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeAudienceTab === tab.id
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 4 POLISHED CARDS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 1. Students Card */}
            <div
              className={`bg-slate-900/80 border rounded-3xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "students"
                  ? "border-indigo-500 ring-1 ring-indigo-500/50 shadow-xl"
                  : "border-slate-800"
              }`}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <GraduationCap size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Students</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Accelerate your career readiness with benchmark assessments.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-indigo-400 shrink-0 mt-0.5"
                    />
                    <span>Skill assessment & timed evaluations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-indigo-400 shrink-0 mt-0.5"
                    />
                    <span>Personalized skill gap analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-indigo-400 shrink-0 mt-0.5"
                    />
                    <span>Internship & job opportunity discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-indigo-400 shrink-0 mt-0.5"
                    />
                    <span>Application status tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-indigo-400 shrink-0 mt-0.5"
                    />
                    <span>Verified digital portfolio & certificates</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
              >
                Explore as Student
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* 2. Industries Card */}
            <div
              className={`bg-slate-900/80 border rounded-3xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "industries"
                  ? "border-purple-500 ring-1 ring-purple-500/50 shadow-xl"
                  : "border-slate-800"
              }`}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Briefcase size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">
                    Industries
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Source pre-assessed, verified candidates directly from
                    campuses.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-purple-400 shrink-0 mt-0.5"
                    />
                    <span>Register and get company verified</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-purple-400 shrink-0 mt-0.5"
                    />
                    <span>Post internships & full-time job openings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-purple-400 shrink-0 mt-0.5"
                    />
                    <span>Specify required skill proficiencies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-purple-400 shrink-0 mt-0.5"
                    />
                    <span>Review pre-screened applicants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-purple-400 shrink-0 mt-0.5"
                    />
                    <span>Recruit suitable talent efficiently</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
              >
                Join as Industry
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* 3. Institutions Card */}
            <div
              className={`bg-slate-900/80 border rounded-3xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "institutions"
                  ? "border-cyan-500 ring-1 ring-cyan-500/50 shadow-xl"
                  : "border-slate-800"
              }`}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Building2 size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">
                    Institutions
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Gain macro visibility into institutional skill readiness and
                    demand.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-cyan-400 shrink-0 mt-0.5"
                    />
                    <span>Monitor student skill development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-cyan-400 shrink-0 mt-0.5"
                    />
                    <span>Analyze institutional skill readiness index</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-cyan-400 shrink-0 mt-0.5"
                    />
                    <span>Track internship & placement pipeline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-cyan-400 shrink-0 mt-0.5"
                    />
                    <span>Understand real-time industry demand trends</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-cyan-500/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
              >
                Join as Institution
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* 4. Academicians Card */}
            <div
              className={`bg-slate-900/80 border rounded-3xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "academicians"
                  ? "border-amber-500 ring-1 ring-amber-500/50 shadow-xl"
                  : "border-slate-800"
              }`}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <BookOpen size={26} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">
                    Academicians
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Bridge research and teaching with corporate technology
                    standards.
                  </p>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-400 shrink-0 mt-0.5"
                    />
                    <span>Faculty opportunity discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-400 shrink-0 mt-0.5"
                    />
                    <span>Faculty Development Programs (FDPs)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-400 shrink-0 mt-0.5"
                    />
                    <span>Industry training & exposure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-400 shrink-0 mt-0.5"
                    />
                    <span>Research collaboration & mentorship</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-400 shrink-0 mt-0.5"
                    />
                    <span>Direct industry interaction</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
              >
                Explore Academia
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. CORE FEATURES ================= */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Platform Modules
            </span>
            <h2 className="text-3xl font-black text-white">
              Core Platform Capabilities
            </h2>
            <p className="text-sm text-slate-400">
              Built on verified data pipelines, robust assessments, and
              transparent skill analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Skill Assessment",
                desc: "Evaluate technical and soft skills through structured assessments.",
                icon: Brain,
                color: "text-indigo-400",
                bg: "bg-indigo-500/10 border-indigo-500/20",
              },
              {
                title: "Skill Gap Analysis",
                desc: "Compare student proficiency with actual industry skill demand.",
                icon: BarChart3,
                color: "text-cyan-400",
                bg: "bg-cyan-500/10 border-cyan-500/20",
              },
              {
                title: "Industry Demand",
                desc: "Understand which skills are currently required across available opportunities.",
                icon: Target,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
              },
              {
                title: "Internships & Jobs",
                desc: "Discover and apply for relevant opportunities.",
                icon: Briefcase,
                color: "text-amber-400",
                bg: "bg-amber-500/10 border-amber-500/20",
              },
              {
                title: "Application Tracking",
                desc: "Track applications and recruitment progress.",
                icon: ClipboardList,
                color: "text-purple-400",
                bg: "bg-purple-500/10 border-purple-500/20",
              },
              {
                title: "Digital Portfolio",
                desc: "Showcase verified skills, certifications, projects and achievements.",
                icon: Award,
                color: "text-pink-400",
                bg: "bg-pink-500/10 border-pink-500/20",
              },
              {
                title: "Academia–Industry Collaboration",
                desc: "Enable interaction between students, institutions, academicians and industry.",
                icon: Users,
                color: "text-blue-400",
                bg: "bg-blue-500/10 border-blue-500/20",
              },
              {
                title: "Institutional Analytics",
                desc: "Help institutions understand student readiness and industry requirements.",
                icon: TrendingUp,
                color: "text-teal-400",
                bg: "bg-teal-500/10 border-teal-500/20",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all space-y-4 group"
              >
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center ${feat.bg} ${feat.color}`}
                >
                  <feat.icon size={22} />
                </div>
                <h4 className="font-bold text-slate-100 text-base group-hover:text-indigo-400 transition-colors">
                  {feat.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 6. INDUSTRY DEMAND SECTION ================= */}
      <section
        id="industry-demand"
        className="py-20 bg-slate-950/60 border-t border-slate-800/80 relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Live Data Aggregation
              </span>
              <h2 className="text-3xl font-black text-white">
                What Skills Does Industry Need?
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                SkillBridge derives industry demand directly from the skills
                requested in active industry opportunities posted on the
                platform.
              </p>
              <p className="text-[11px] text-indigo-300/80 italic font-medium">
                * Data is dynamically calculated from active postings stored in
                the SkillBridge database.
              </p>
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-semibold text-indigo-300">
                  <ShieldCheck size={16} /> Transparent Demand Calculation
                </div>
                <p className="text-slate-400 text-[11px]">
                  Frequencies update dynamically as corporate partners publish
                  internship and employment openings.
                </p>
              </div>
            </div>

            {/* DEMAND SKILLS VISUALIZATION */}
            <div className="w-full lg:w-[500px]">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Target size={16} className="text-amber-400" />
                    Industry Skill Demand Index
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold bg-slate-800 px-2.5 py-0.5 rounded-full">
                    {totalPublishedOpportunities > 0
                      ? `${totalPublishedOpportunities} Active Postings`
                      : "Live Telemetry"}
                  </span>
                </div>

                {loadingDemand ? (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                    <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto" />
                    <p>Loading real-time skill demand from backend...</p>
                  </div>
                ) : demandSkills.length > 0 ? (
                  <div className="space-y-4">
                    {demandSkills.map((sk) => (
                      <div key={sk.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-200">{sk.name}</span>
                          <span className="text-indigo-400 font-bold">
                            {sk.percentage}% Demand
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(15, sk.percentage))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2 bg-slate-950/40 rounded-2xl p-4 border border-slate-800">
                    <p className="text-xs font-semibold text-slate-300">
                      SkillBridge derives industry demand from the skills
                      requested in industry opportunities.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Top skills will populate live as recruiters publish new
                      opportunity criteria.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 7. VERIFIED INDUSTRY ECOSYSTEM ================= */}
      <section id="verified-ecosystem" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Ecosystem Integrity
            </span>
            <h2 className="text-3xl font-black text-white">
              Built for a Trusted Ecosystem
            </h2>
            <p className="text-sm text-slate-400">
              Industries can register on SkillBridge, while verification helps
              maintain a reliable recruitment ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 font-bold flex items-center justify-center border border-slate-700 text-sm">
                01
              </div>
              <h4 className="font-bold text-slate-100 text-base">
                Corporate Registration
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organizations create official profiles with corporate
                documentation and industry category verification.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/20 text-sm">
                02
              </div>
              <h4 className="font-bold text-slate-100 text-base">
                Admin Audit & Review
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Platform administrators audit company details to ensure
                legitimacy before granting publishing privileges.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/20 text-sm">
                03
              </div>
              <h4 className="font-bold text-slate-100 text-base">
                Verified Hiring Partner
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Verified companies access candidate Skill DNA profiles and post
                pre-screened campus recruitment opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 8. FINAL CTA ================= */}
      <section
        id="get-started"
        className="py-20 bg-gradient-to-b from-slate-950 to-[#0b1120] border-t border-slate-800/80 relative"
      >
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles size={14} /> Join SkillBridge Today
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Build skills. Close gaps. Connect with industry.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-normal">
            Turn your skills into opportunities with SkillBridge. The unified
            platform empowering students, institutions, and industry recruiters.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              Get Started Now
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800/80">
            {/* Brand Column */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <img
                  src="/skillbridge_logo.png"
                  alt="SkillBridge Logo"
                  className="w-8 h-8 rounded-lg object-cover border border-indigo-500/20"
                />
                <span className="text-lg font-black text-white">
                  SkillBridge
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Bridging Academia and Industry Through Skills. Dedicated to
                skill assessment, curriculum alignment, and transparent
                recruitment telemetry.
              </p>
            </div>

            {/* Platform Links */}
            <div className="space-y-3">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Platform
              </h5>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button
                    onClick={() => scrollToSection("hero")}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("industry-demand")}
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Skill Demand
                  </button>
                </li>
              </ul>
            </div>

            {/* Ecosystem Roles */}
            <div className="space-y-3">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Ecosystem
              </h5>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    For Students
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    For Industry
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    For Institutions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    For Academicians
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Access */}
            <div className="space-y-3">
              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Quick Access
              </h5>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link
                    to="/opportunities"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    Public Opportunities
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>
              &copy; {new Date().getFullYear()} SkillBridge. All rights
              reserved. Academia &bull; Industry Convergence Platform.
            </p>
            <p className="flex items-center gap-1">
              <span>
                Powered by Real-Time Telemetry & Skill Assessment Engine
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
