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
  const isDark = theme === "dark";
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
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${
        isDark
          ? "bg-[#0b1329] text-slate-100 selection:bg-sky-500/30 selection:text-sky-200"
          : "bg-slate-50 text-slate-900 selection:bg-sky-200 selection:text-sky-900"
      }`}
    >
      {/* ================= NAVBAR ================= */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all ${
          isDark
            ? "bg-[#0b1329]/85 border-slate-800/80"
            : "bg-white/85 border-slate-200/80 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight flex items-center gap-1">
                <span className={isDark ? "text-white" : "text-slate-900"}>
                  Skill
                </span>
                <span className="text-transparent bg-clip-text bg-amber-500">
                  Bridge
                </span>
              </span>
              <span
                className={`text-[11px] font-semibold tracking-wider uppercase ${
                  isDark ? "text-sky-400/80" : "text-sky-600"
                }`}
              >
                Academia &bull; Industry
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION LINKS */}
          <nav
            className={`hidden md:flex items-center gap-1 p-1.5 rounded-full border text-xs font-medium ${
              isDark
                ? "bg-slate-900/90 border-slate-800"
                : "bg-slate-100/90 border-slate-200"
            }`}
          >
            <button
              onClick={() => scrollToSection("hero")}
              className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white shadow-xs"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white shadow-xs"
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white shadow-xs"
              }`}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("who-is-it-for")}
              className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white shadow-xs"
              }`}
            >
              Ecosystem
            </button>
            <button
              onClick={() => scrollToSection("industry-demand")}
              className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-white shadow-xs"
              }`}
            >
              Skill Demand
            </button>
          </nav>

          {/* RIGHT ACTION BUTTONS */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                  : "bg-slate-100 border-slate-200 text-sky-600 hover:bg-slate-200"
              }`}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {isAuthenticated ? (
              <button
                onClick={handleDashboardRedirect}
                className="px-4 py-2 bg-gradient-to-r bg-yellow-600 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/25 flex items-center gap-2 cursor-pointer"
              >
                Go to Dashboard
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                    isDark
                      ? "text-slate-300 hover:text-white hover:bg-slate-800"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="px-4.5 py-2 bg-gradient-to-r from-sky-500 via-cyan-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/25 flex items-center gap-1.5 cursor-pointer"
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
              className={`p-2 rounded-lg border ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-amber-400"
                  : "bg-slate-100 border-slate-200 text-sky-600"
              }`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2.5 rounded-xl border ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-slate-200"
                  : "bg-slate-100 border-slate-200 text-slate-800"
              }`}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        {mobileMenuOpen && (
          <div
            className={`md:hidden backdrop-blur-2xl border-b px-4 py-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200 ${
              isDark
                ? "bg-[#0b1329]/95 border-slate-800"
                : "bg-white/95 border-slate-200"
            }`}
          >
            <div className="flex flex-col space-y-2 text-sm font-medium">
              <button
                onClick={() => scrollToSection("hero")}
                className={`text-left px-3 py-2 ${
                  isDark
                    ? "text-slate-300 hover:text-sky-400"
                    : "text-slate-700 hover:text-sky-600"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className={`text-left px-3 py-2 ${
                  isDark
                    ? "text-slate-300 hover:text-sky-400"
                    : "text-slate-700 hover:text-sky-600"
                }`}
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className={`text-left px-3 py-2 ${
                  isDark
                    ? "text-slate-300 hover:text-sky-400"
                    : "text-slate-700 hover:text-sky-600"
                }`}
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("who-is-it-for")}
                className={`text-left px-3 py-2 ${
                  isDark
                    ? "text-slate-300 hover:text-sky-400"
                    : "text-slate-700 hover:text-sky-600"
                }`}
              >
                Ecosystem
              </button>
              <button
                onClick={() => scrollToSection("industry-demand")}
                className={`text-left px-3 py-2 ${
                  isDark
                    ? "text-slate-300 hover:text-sky-400"
                    : "text-slate-700 hover:text-sky-600"
                }`}
              >
                Skill Demand
              </button>
            </div>

            <div
              className={`pt-4 border-t flex flex-col gap-2 ${
                isDark ? "border-slate-800" : "border-slate-200"
              }`}
            >
              {isAuthenticated ? (
                <button
                  onClick={handleDashboardRedirect}
                  className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-orange-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight size={14} />
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`w-full py-2.5 text-center rounded-xl text-xs font-semibold border ${
                      isDark
                        ? "bg-slate-900 border-slate-800 text-slate-200"
                        : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    className="w-full py-2.5 text-center text-white bg-gradient-to-r from-sky-500 via-cyan-500 to-orange-500 rounded-xl text-xs font-semibold"
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
        {/* Ambient Background Glow Orbs */}
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] blur-[130px] rounded-full pointer-events-none ${
            isDark ? "bg-sky-600/15" : "bg-sky-400/25"
          }`}
        />
        <div
          className={`absolute top-1/3 left-1/4 w-[320px] h-[280px] blur-[110px] rounded-full pointer-events-none ${
            isDark ? "bg-cyan-500/15" : "bg-cyan-300/30"
          }`}
        />
        <div
          className={`absolute bottom-1/4 right-1/4 w-[280px] h-[250px] blur-[100px] rounded-full pointer-events-none ${
            isDark ? "bg-orange-500/15" : "bg-orange-300/25"
          }`}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            {/* HERO CONTENT */}
            <div className="max-w-2xl text-center lg:text-left space-y-6">
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide shadow-xs ${
                  isDark
                    ? "bg-sky-500/10 border-sky-500/25 text-sky-300"
                    : "bg-sky-50 border-sky-200 text-sky-700"
                }`}
              >
                <Sparkles size={14} className="text-orange-500" />
                <span>Academia–Industry Convergence Engine</span>
              </div>

              <h1
                className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Bridging Academia and{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-400 to-amber-400">
                  Industry Through Skills,
                </span>{" "}
                <span className="text-orange-500 font-bold">
                  Securing Your Future.
                </span>
              </h1>

              <p
                className={`text-base sm:text-lg leading-relaxed font-normal ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                SkillBridge connects students, academia and industry through
                intelligent skill mapping, personalized growth paths and
                real-world career opportunities.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r bg-cyan-600 hover:from-sky-400 hover:bg-cyan-700 text-white font-bold text-sm rounded-xl shadow-xl shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  Explore SkillBridge
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>

                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className={`w-full sm:w-auto px-6 py-3.5 font-semibold text-sm rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? "bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-800"
                      : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs"
                  }`}
                >
                  See how it works
                </button>

                <button
                  onClick={() =>
                    navigate(isAuthenticated ? "/opportunities" : "/login")
                  }
                  className={`w-full sm:w-auto px-5 py-3.5 font-semibold text-sm rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isDark
                      ? "bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border-slate-800"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                >
                  <Search size={16} className="text-sky-500" />
                  Opportunities
                </button>
              </div>

              {/* Proof / Trust Indicator */}
              <div
                className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-xs ${
                  isDark
                    ? "border-slate-800/80 text-slate-400"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                <div className="flex items-center -space-x-2">
                  <i className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-xs font-bold text-sky-400 not-italic shadow-xs">
                    A
                  </i>
                  <i className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-400 not-italic shadow-xs">
                    S
                  </i>
                  <i className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-amber-400 not-italic shadow-xs">
                    R
                  </i>
                  <i className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-xs font-bold text-orange-400 not-italic shadow-xs">
                    +
                  </i>
                </div>
                <span className="font-medium text-center sm:text-left">
                  Built to turn learning into measurable career readiness.
                </span>
              </div>
            </div>

            {/* 3D SPATIAL ECOSYSTEM CONVERGENCE DIAGRAM */}
            <div className="w-full lg:w-[580px] shrink-0 relative">
              <div
                className={`backdrop-blur-2xl border rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden ${
                  isDark
                    ? "bg-slate-900/90 border-slate-800 shadow-sky-950/40"
                    : "bg-white/95 border-slate-200 shadow-slate-200/80"
                }`}
              >
                {/* Header Tag */}
                <div className="text-center mb-6">
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full border shadow-xs ${
                      isDark
                        ? "text-sky-300 bg-sky-500/10 border-sky-500/25"
                        : "text-sky-700 bg-sky-50 border-sky-200"
                    }`}
                  >
                    Tri-Party Spatial Ecosystem
                  </span>
                </div>

                {/* Ambient Background Glow Orbs */}
                <div
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[70px] rounded-full pointer-events-none ${
                    isDark ? "bg-sky-600/20" : "bg-sky-300/30"
                  }`}
                />
                <div
                  className={`absolute top-1/4 left-1/4 w-40 h-40 blur-[50px] rounded-full pointer-events-none ${
                    isDark ? "bg-cyan-500/15" : "bg-cyan-200/40"
                  }`}
                />
                <div
                  className={`absolute bottom-1/4 right-1/4 w-40 h-40 blur-[50px] rounded-full pointer-events-none ${
                    isDark ? "bg-orange-500/15" : "bg-orange-200/40"
                  }`}
                />

                {/* 3D SPATIAL CANVAS CONTAINER */}
                <div className="relative min-h-[380px] flex flex-col justify-between items-center py-2 px-1">
                  {/* 1. TOP NODE: STUDENT */}
                  <div className="relative z-20 group">
                    <div
                      className={`backdrop-blur-xl border hover:border-sky-400 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xl transition-all transform hover:-translate-y-1 cursor-default ${
                        isDark
                          ? "bg-slate-950/95 border-sky-500/40 shadow-sky-950/50"
                          : "bg-white border-sky-300 shadow-sky-100"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500 shrink-0">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-bold tracking-wide ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            STUDENT
                          </span>
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        </div>
                        <span
                          className={`text-[10px] font-medium ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Skill Matrix & Profile
                        </span>
                      </div>
                    </div>
                    {/* Floating mini badge */}
                    <div className="absolute -top-3 -right-2 bg-sky-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Assessed
                    </div>
                  </div>

                  {/* VERTICAL STREAM: STUDENT DOWN TO CORE */}
                  <div className="w-0.5 h-12 bg-gradient-to-b from-sky-500 via-cyan-400 to-amber-400 relative overflow-hidden rounded-full my-1">
                    <div className="absolute top-0 left-0 w-full h-full bg-white/80 animate-pulse" />
                  </div>

                  {/* MIDDLE HORIZONTAL ROW: [ACADEMIA] -> [SKILLBRIDGE CORE] -> [CAREER OUTCOMES] */}
                  <div className="w-full flex items-center justify-between gap-2 relative z-20 my-1">
                    {/* 2. LEFT NODE: ACADEMIA */}
                    <div className="relative group shrink-0">
                      <div
                        className={`backdrop-blur-xl border hover:border-cyan-400 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-xl transition-all transform hover:-translate-y-1 cursor-default ${
                          isDark
                            ? "bg-slate-950/95 border-cyan-500/40 shadow-cyan-950/50"
                            : "bg-white border-cyan-300 shadow-cyan-100"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div
                            className={`text-xs font-bold tracking-wide ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            ACADEMIA
                          </div>
                          <div
                            className={`text-[9px] font-medium ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Curriculum
                          </div>
                        </div>
                      </div>
                      <div className="absolute -bottom-2 left-2 bg-cyan-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        Pathways
                      </div>
                    </div>

                    {/* STREAM: ACADEMIA RIGHT TO CORE */}
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-amber-400 relative overflow-hidden rounded-full mx-1">
                      <div className="absolute top-0 left-0 w-full h-full bg-cyan-300/80 animate-pulse" />
                    </div>

                    {/* 3. CENTRAL FOCAL CORE: SKILLBRIDGE CORE */}
                    <div className="relative shrink-0 group">
                      {/* Pulse outer rings */}
                      <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-orange-500 opacity-40 blur-md group-hover:opacity-75 transition duration-500 animate-pulse" />

                      <div
                        className={`relative backdrop-blur-2xl border-2 rounded-2xl px-4 py-3 text-center shadow-2xl ${
                          isDark
                            ? "bg-slate-950/95 border-sky-400/70 shadow-sky-500/40"
                            : "bg-white border-sky-500 shadow-sky-200"
                        }`}
                      >
                        <div className="w-10 h-10 mx-auto mb-1.5 rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-400 to-orange-500 p-0.5 shadow-md">
                          <div
                            className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                              isDark ? "bg-slate-950" : "bg-white"
                            }`}
                          >
                            <Sparkles className="w-5 h-5 text-sky-500 animate-spin-slow" />
                          </div>
                        </div>
                        <div
                          className={`text-xs font-black tracking-wider uppercase ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          SkillBridge
                        </div>
                      </div>
                    </div>

                    {/* STREAM: CORE OUTWARD RIGHT TO CAREER OUTCOMES */}
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-sky-400 via-amber-400 to-orange-400 relative overflow-hidden rounded-full mx-1">
                      <div className="absolute top-0 left-0 w-full h-full bg-amber-300/80 animate-pulse" />
                    </div>

                    {/* 4. RIGHT OUTPUT NODE: CAREER OUTCOMES */}
                    <div className="relative group shrink-0">
                      <div
                        className={`backdrop-blur-xl border hover:border-amber-400 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-xl transition-all transform hover:-translate-y-1 cursor-default ${
                          isDark
                            ? "bg-slate-950/95 border-amber-500/40 shadow-amber-950/50"
                            : "bg-white border-amber-300 shadow-amber-100"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                          <Target size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-500 tracking-wide">
                            OUTCOMES
                          </div>
                          <div
                            className={`text-[9px] font-medium ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Readiness +24%
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        92% Match
                      </div>
                    </div>
                  </div>

                  {/* VERTICAL STREAM: INDUSTRY UP TO CORE */}
                  <div className="w-0.5 h-12 bg-gradient-to-t from-orange-500 via-amber-400 to-sky-400 relative overflow-hidden rounded-full my-1">
                    <div className="absolute top-0 left-0 w-full h-full bg-orange-300/80 animate-pulse" />
                  </div>

                  {/* 5. BOTTOM NODE: INDUSTRY */}
                  <div className="relative z-20 group">
                    <div
                      className={`backdrop-blur-xl border hover:border-orange-400 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xl transition-all transform hover:-translate-y-1 cursor-default ${
                        isDark
                          ? "bg-slate-950/95 border-orange-500/40 shadow-orange-950/50"
                          : "bg-white border-orange-300 shadow-orange-100"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <div
                          className={`text-xs font-bold tracking-wide ${
                            isDark ? "text-white" : "text-slate-900"
                          }`}
                        >
                          INDUSTRY
                        </div>
                        <span
                          className={`text-[10px] font-medium ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Job Demand & Hiring
                        </span>
                      </div>
                    </div>
                    {/* Floating mini badge */}
                    <div className="absolute -bottom-3 -left-2 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                      Verified
                    </div>
                  </div>

                  {/* FLOATING GLASS UI CHIPS */}
                  <div
                    className={`absolute top-3 left-4 backdrop-blur-md border text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md pointer-events-none ${
                      isDark
                        ? "bg-slate-900/90 border-orange-500/40 text-orange-400"
                        : "bg-white/95 border-orange-200 text-orange-600"
                    }`}
                  >
                    <CheckCircle2 size={13} className="text-orange-500" />
                    Skill gap detected
                  </div>

                  <div
                    className={`absolute bottom-4 right-4 backdrop-blur-md border text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md pointer-events-none ${
                      isDark
                        ? "bg-slate-900/90 border-sky-500/40 text-sky-400"
                        : "bg-white/95 border-sky-200 text-sky-700"
                    }`}
                  >
                    <Sparkles size={13} className="text-sky-500" />
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
        className={`py-16 border-y relative ${
          isDark
            ? "bg-slate-900/60 border-slate-800"
            : "bg-slate-100/70 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              The Challenge We Solve
            </span>
            <h2
              className={`text-3xl font-black ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              The Skill-Gap Paradigm in Technical Education
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Traditional education faces a critical disconnect between academic
              curriculum and rapid industry skill evolution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Problem 1: Students */}
            <div
              className={`border rounded-2xl p-6 transition-all space-y-4 hover:border-sky-500/40 ${
                isDark
                  ? "bg-slate-900/80 border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center">
                <GraduationCap size={24} />
              </div>
              <h3
                className={`text-lg font-bold flex items-center gap-2 ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                <GraduationCap size={20} className="text-sky-500" />
                Students
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                &ldquo;Unclear about which skills industries actually
                demand.&rdquo;
              </p>
              <div
                className={`pt-2 text-[11px] flex items-center gap-1.5 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Lack of structured skill benchmark evaluation
              </div>
            </div>

            {/* Problem 2: Industry */}
            <div
              className={`border rounded-2xl p-6 transition-all space-y-4 hover:border-orange-500/40 ${
                isDark
                  ? "bg-slate-900/80 border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                <Briefcase size={24} />
              </div>
              <h3
                className={`text-lg font-bold flex items-center gap-2 ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                <Briefcase size={20} className="text-orange-500" />
                Industries
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                &ldquo;Difficulty finding candidates with the right
                skills.&rdquo;
              </p>
              <div
                className={`pt-2 text-[11px] flex items-center gap-1.5 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                High screening costs & mismatch between degree and proficiency
              </div>
            </div>

            {/* Problem 3: Academia */}
            <div
              className={`border rounded-2xl p-6 transition-all space-y-4 hover:border-cyan-500/40 ${
                isDark
                  ? "bg-slate-900/80 border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <h3
                className={`text-lg font-bold flex items-center gap-2 ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                <Building2 size={20} className="text-cyan-500" />
                Academia
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                &ldquo;Limited visibility into student skill gaps and industry
                requirements.&rdquo;
              </p>
              <div
                className={`pt-2 text-[11px] flex items-center gap-1.5 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Delayed placement feedback & curriculum misalignment
              </div>
            </div>
          </div>

          {/* Unified Solution Statement */}
          <div
            className={`mt-12 p-6 rounded-2xl text-center space-y-2 border ${
              isDark
                ? "bg-gradient-to-r from-sky-950/40 via-slate-900 to-orange-950/40 border-sky-500/30"
                : "bg-gradient-to-r from-sky-50 via-slate-50 to-orange-50 border-sky-200"
            }`}
          >
            <h3
              className={`text-xl sm:text-2xl font-black ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              One platform. Three ecosystems. One common goal: career-ready
              talent.
            </h3>
            <p
              className={`text-xs max-w-2xl mx-auto ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
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
            <span className="text-xs font-bold uppercase tracking-wider text-sky-500 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              Platform Workflow
            </span>
            <h2
              className={`text-3xl font-black ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              How SkillBridge Works
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
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
                color: "text-sky-500",
                bg: "bg-sky-500/10 border-sky-500/20",
              },
              {
                step: "02",
                title: "Build Skill Profile",
                desc: "Generate a verified Skill Matrix and digital portfolio showcase.",
                icon: Award,
                color: "text-cyan-500",
                bg: "bg-cyan-500/10 border-cyan-500/20",
              },
              {
                step: "03",
                title: "Analyze Skill Gaps",
                desc: "Compare personal proficiency against real-time industry demand benchmarks.",
                icon: BarChart3,
                color: "text-amber-500",
                bg: "bg-amber-500/10 border-amber-500/20",
              },
              {
                step: "04",
                title: "Discover Opportunities",
                desc: "Explore verified internships and job postings matching your skill profile.",
                icon: Briefcase,
                color: "text-orange-500",
                bg: "bg-orange-500/10 border-orange-500/20",
              },
              {
                step: "05",
                title: "Apply & Track",
                desc: "Submit applications directly and monitor recruitment stages in real time.",
                icon: ClipboardList,
                color: "text-blue-500",
                bg: "bg-blue-500/10 border-blue-500/20",
              },
            ].map((st) => (
              <div
                key={st.step}
                className={`border rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 group ${
                  isDark
                    ? "bg-slate-900/80 border-slate-800 hover:border-sky-500/40"
                    : "bg-white border-slate-200 shadow-sm hover:border-sky-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-2xl font-black transition-colors ${
                        isDark
                          ? "text-slate-600 group-hover:text-sky-400"
                          : "text-slate-300 group-hover:text-sky-600"
                      }`}
                    >
                      {st.step}
                    </span>
                    <div
                      className={`p-2.5 rounded-xl border ${st.bg} ${st.color}`}
                    >
                      <st.icon size={20} />
                    </div>
                  </div>
                  <h4
                    className={`font-bold text-sm ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    {st.title}
                  </h4>
                  <p
                    className={`text-xs leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
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
        className={`py-24 border-t relative overflow-hidden ${
          isDark
            ? "bg-slate-900/60 border-slate-800"
            : "bg-slate-100/60 border-slate-200"
        }`}
      >
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] blur-[120px] pointer-events-none rounded-full ${
            isDark ? "bg-sky-600/10" : "bg-sky-300/20"
          }`}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-500 bg-sky-500/10 px-3.5 py-1.5 rounded-full border border-sky-500/20 shadow-inner">
              OPPORTUNITIES
            </span>
            <h2
              className={`text-3xl sm:text-5xl font-black tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Don't just learn skills.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-cyan-400 to-orange-500">
                Use them.
              </span>
            </h2>
            <p
              className={`text-sm sm:text-base leading-relaxed max-w-2xl mx-auto ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Discover internships, projects and early-career opportunities that
              actually match your growing skill profile.
            </p>
            <p
              className={`text-[11px] italic font-medium pt-1 ${
                isDark ? "text-sky-400/70" : "text-sky-700"
              }`}
            >
              * Live opportunities sourced dynamically from active SkillBridge
              database postings.
            </p>
          </div>

          {loadingDemand ? (
            <div className="py-16 text-center text-xs text-slate-400 space-y-3">
              <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto shadow-lg shadow-sky-500/20" />
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
                    className={`group relative backdrop-blur-xl border rounded-3xl p-6 transition-all duration-300 transform hover:-translate-y-2 flex flex-col justify-between space-y-6 cursor-pointer shadow-xl overflow-hidden ${
                      isDark
                        ? "bg-slate-900/90 border-slate-800 hover:border-sky-500/50 hover:shadow-sky-950/40"
                        : "bg-white border-slate-200 hover:border-sky-400 hover:shadow-slate-300/60"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Header Row: Company Icon & Match Score */}
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-orange-500/10 border border-sky-500/30 text-sky-500 font-black flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition-transform duration-300">
                          {companyInitial}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-xs ${
                            isDark
                              ? "text-sky-300 bg-sky-500/10 border-sky-500/20"
                              : "text-sky-700 bg-sky-50 border-sky-200"
                          }`}
                        >
                          <Sparkles
                            size={13}
                            className="text-orange-500 animate-pulse"
                          />
                          {matchPercent}% match
                        </span>
                      </div>

                      {/* Role Details */}
                      <div className="space-y-1">
                        <h3
                          className={`text-lg font-bold transition-colors line-clamp-1 tracking-tight ${
                            isDark
                              ? "text-white group-hover:text-sky-400"
                              : "text-slate-900 group-hover:text-sky-600"
                          }`}
                        >
                          {roleTitle}
                        </h3>
                        <p
                          className={`text-xs font-semibold tracking-wide ${
                            isDark ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          {companyName}
                        </p>
                      </div>

                      {/* Location Badge */}
                      <div
                        className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border w-fit ${
                          isDark
                            ? "text-slate-300 bg-slate-950/60 border-slate-800"
                            : "text-slate-700 bg-slate-100 border-slate-200"
                        }`}
                      >
                        <MapPin size={14} className="text-sky-500 shrink-0" />
                        <span className="font-medium">{location}</span>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div
                      className={`pt-4 border-t flex items-center justify-between text-xs font-semibold ${
                        isDark ? "border-slate-800" : "border-slate-200"
                      }`}
                    >
                      <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
                        SkillBenchmarked *
                      </span>
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-xs ${
                          isDark
                            ? "bg-slate-800 text-slate-300 group-hover:bg-sky-500 group-hover:text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-sky-600 group-hover:text-white"
                        }`}
                      >
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
            <div
              className={`text-center py-14 px-6 border rounded-3xl max-w-xl mx-auto space-y-4 shadow-2xl ${
                isDark
                  ? "bg-slate-900/80 border-slate-800"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-500">
                <Briefcase size={26} />
              </div>
              <div className="space-y-1">
                <h4
                  className={`text-base font-bold ${
                    isDark ? "text-slate-200" : "text-slate-800"
                  }`}
                >
                  No active opportunities in DB yet
                </h4>
                <p
                  className={`text-xs max-w-sm mx-auto leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  * Live opportunities will populate here dynamically as
                  industry partners post hiring criteria.
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 via-cyan-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/25 cursor-pointer"
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
                className={`inline-flex items-center gap-2 px-8 py-3.5 font-bold text-xs rounded-2xl border transition-all cursor-pointer shadow-xl group ${
                  isDark
                    ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-sky-500/50"
                    : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-sky-300"
                }`}
              >
                View All {totalPublishedOpportunities} Live DB Opportunities
                <ArrowUpRight
                  size={16}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-sky-500"
                />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================= 4. WHO IS SKILLBRIDGE FOR? ================= */}
      <section
        id="who-is-it-for"
        className={`py-20 border-t ${
          isDark
            ? "bg-slate-900/40 border-slate-800"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              User Roles & Value
            </span>
            <h2
              className={`text-3xl font-black ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Who is SkillBridge For?
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
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
                    ? "bg-gradient-to-r from-sky-500 to-cyan-600 text-white border-sky-500 shadow-md shadow-sky-500/30"
                    : isDark
                      ? "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 shadow-xs"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* 4 CARDS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 1. Students Card */}
            <div
              className={`border rounded-3xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "students"
                  ? "border-sky-500 ring-1 ring-sky-500/50 shadow-xl"
                  : isDark
                    ? "bg-slate-900/80 border-slate-800"
                    : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center">
                  <GraduationCap size={26} />
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    Students
                  </h3>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Accelerate your career readiness with benchmark assessments.
                  </p>
                </div>
                <ul
                  className={`space-y-2.5 text-xs ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-500 shrink-0 mt-0.5"
                    />
                    <span>Skill assessment & timed evaluations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-500 shrink-0 mt-0.5"
                    />
                    <span>Personalized skill gap analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-500 shrink-0 mt-0.5"
                    />
                    <span>Internship & job opportunity discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-500 shrink-0 mt-0.5"
                    />
                    <span>Application status tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-sky-500 shrink-0 mt-0.5"
                    />
                    <span>Verified digital portfolio & certificates</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-sky-500/10 hover:bg-sky-500 text-sky-500 hover:text-white border border-sky-500/30 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
              >
                Explore as Student
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* 2. Industries Card */}
            <div
              className={`border rounded-3xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "industries"
                  ? "border-orange-500 ring-1 ring-orange-500/50 shadow-xl"
                  : isDark
                    ? "bg-slate-900/80 border-slate-800"
                    : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                  <Briefcase size={26} />
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    Industries
                  </h3>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Source pre-assessed, verified candidates directly from
                    campuses.
                  </p>
                </div>
                <ul
                  className={`space-y-2.5 text-xs ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-orange-500 shrink-0 mt-0.5"
                    />
                    <span>Register and get company verified</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-orange-500 shrink-0 mt-0.5"
                    />
                    <span>Post internships & full-time job openings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-orange-500 shrink-0 mt-0.5"
                    />
                    <span>Specify required skill proficiencies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-orange-500 shrink-0 mt-0.5"
                    />
                    <span>Review pre-screened applicants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-orange-500 shrink-0 mt-0.5"
                    />
                    <span>Recruit suitable talent efficiently</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white border border-orange-500/30 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
              >
                Join as Industry
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* 3. Institutions Card */}
            <div
              className={`border rounded-3xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "institutions"
                  ? "border-cyan-500 ring-1 ring-cyan-500/50 shadow-xl"
                  : isDark
                    ? "bg-slate-900/80 border-slate-800"
                    : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center">
                  <Building2 size={26} />
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    Institutions
                  </h3>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Gain macro visibility into institutional skill readiness and
                    demand.
                  </p>
                </div>
                <ul
                  className={`space-y-2.5 text-xs ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-cyan-500 shrink-0 mt-0.5"
                    />
                    <span>Monitor student skill development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-cyan-500 shrink-0 mt-0.5"
                    />
                    <span>Analyze institutional skill readiness index</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-cyan-500 shrink-0 mt-0.5"
                    />
                    <span>Track internship & placement pipeline</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-cyan-500 shrink-0 mt-0.5"
                    />
                    <span>Understand real-time industry demand trends</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-500 hover:text-white border border-cyan-500/30 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
              >
                Join as Institution
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* 4. Academicians Card */}
            <div
              className={`border rounded-3xl p-6 transition-all space-y-6 flex flex-col justify-between ${
                activeAudienceTab === "academicians"
                  ? "border-amber-500 ring-1 ring-amber-500/50 shadow-xl"
                  : isDark
                    ? "bg-slate-900/80 border-slate-800"
                    : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <BookOpen size={26} />
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isDark ? "text-slate-100" : "text-slate-900"
                    }`}
                  >
                    Academicians
                  </h3>
                  <p
                    className={`text-xs mt-1 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Bridge research and teaching with corporate technology
                    standards.
                  </p>
                </div>
                <ul
                  className={`space-y-2.5 text-xs ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <span>Faculty opportunity discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <span>Faculty Development Programs (FDPs)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <span>Industry training & exposure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <span>Research collaboration & mentorship</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={15}
                      className="text-amber-500 shrink-0 mt-0.5"
                    />
                    <span>Direct industry interaction</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/login"
                className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white border border-amber-500/30 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
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
            <span className="text-xs font-bold uppercase tracking-wider text-sky-500 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              Platform Modules
            </span>
            <h2
              className={`text-3xl font-black ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Core Platform Capabilities
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
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
                color: "text-sky-500",
                bg: "bg-sky-500/10 border-sky-500/20",
              },
              {
                title: "Skill Gap Analysis",
                desc: "Compare student proficiency with actual industry skill demand.",
                icon: BarChart3,
                color: "text-cyan-500",
                bg: "bg-cyan-500/10 border-cyan-500/20",
              },
              {
                title: "Industry Demand",
                desc: "Understand which skills are currently required across available opportunities.",
                icon: Target,
                color: "text-amber-500",
                bg: "bg-amber-500/10 border-amber-500/20",
              },
              {
                title: "Internships & Jobs",
                desc: "Discover and apply for relevant opportunities.",
                icon: Briefcase,
                color: "text-orange-500",
                bg: "bg-orange-500/10 border-orange-500/20",
              },
              {
                title: "Application Tracking",
                desc: "Track applications and recruitment progress.",
                icon: ClipboardList,
                color: "text-blue-500",
                bg: "bg-blue-500/10 border-blue-500/20",
              },
              {
                title: "Digital Portfolio",
                desc: "Showcase verified skills, certifications, projects and achievements.",
                icon: Award,
                color: "text-sky-500",
                bg: "bg-sky-500/10 border-sky-500/20",
              },
              {
                title: "Academia–Industry Collaboration",
                desc: "Enable interaction between students, institutions, academicians and industry.",
                icon: Users,
                color: "text-cyan-500",
                bg: "bg-cyan-500/10 border-cyan-500/20",
              },
              {
                title: "Institutional Analytics",
                desc: "Help institutions understand student readiness and industry requirements.",
                icon: TrendingUp,
                color: "text-amber-500",
                bg: "bg-amber-500/10 border-amber-500/20",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className={`border rounded-2xl p-6 transition-all space-y-4 group ${
                  isDark
                    ? "bg-slate-900/80 border-slate-800 hover:border-sky-500/40"
                    : "bg-white border-slate-200 shadow-sm hover:border-sky-300"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center ${feat.bg} ${feat.color}`}
                >
                  <feat.icon size={22} />
                </div>
                <h4
                  className={`font-bold text-base transition-colors ${
                    isDark
                      ? "text-slate-100 group-hover:text-sky-400"
                      : "text-slate-900 group-hover:text-sky-600"
                  }`}
                >
                  {feat.title}
                </h4>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
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
        className={`py-20 border-t relative ${
          isDark
            ? "bg-slate-900/60 border-slate-800"
            : "bg-slate-100/60 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Live Data Aggregation
              </span>
              <h2
                className={`text-3xl font-black ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                What Skills Does Industry Need?
              </h2>
              <p
                className={`text-sm leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                SkillBridge derives industry demand directly from the skills
                requested in active industry opportunities posted on the
                platform.
              </p>
              <p
                className={`text-[11px] italic font-medium ${
                  isDark ? "text-sky-400/80" : "text-sky-700"
                }`}
              >
                * Data is dynamically calculated from active postings stored in
                the SkillBridge database.
              </p>
              <div
                className={`p-4 rounded-xl space-y-2 text-xs border ${
                  isDark
                    ? "bg-slate-900/90 border-slate-800 text-slate-300"
                    : "bg-white border-slate-200 text-slate-700 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sky-500">
                  <ShieldCheck size={16} /> Transparent Demand Calculation
                </div>
                <p
                  className={`text-[11px] ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Frequencies update dynamically as corporate partners publish
                  internship and employment openings.
                </p>
              </div>
            </div>

            {/* DEMAND SKILLS VISUALIZATION */}
            <div className="w-full lg:w-[500px]">
              <div
                className={`border rounded-3xl p-6 shadow-xl space-y-5 ${
                  isDark
                    ? "bg-slate-900/90 border-slate-800"
                    : "bg-white border-slate-200"
                }`}
              >
                <div
                  className={`flex items-center justify-between border-b pb-3 ${
                    isDark ? "border-slate-800" : "border-slate-200"
                  }`}
                >
                  <span
                    className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isDark ? "text-slate-200" : "text-slate-800"
                    }`}
                  >
                    <Target size={16} className="text-amber-500" />
                    Industry Skill Demand Index
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      isDark
                        ? "text-sky-300 bg-slate-950 border-slate-800"
                        : "text-sky-700 bg-sky-50 border-sky-200"
                    }`}
                  >
                    {totalPublishedOpportunities > 0
                      ? `${totalPublishedOpportunities} Active Postings`
                      : "Live Telemetry"}
                  </span>
                </div>

                {loadingDemand ? (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                    <div className="animate-spin w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full mx-auto" />
                    <p>Loading real-time skill demand from backend...</p>
                  </div>
                ) : demandSkills.length > 0 ? (
                  <div className="space-y-4">
                    {demandSkills.map((sk) => (
                      <div key={sk.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span
                            className={
                              isDark ? "text-slate-200" : "text-slate-800"
                            }
                          >
                            {sk.name}
                          </span>
                          <span className="text-sky-500 font-bold">
                            {sk.percentage}% Demand
                          </span>
                        </div>
                        <div
                          className={`w-full rounded-full h-2 overflow-hidden border ${
                            isDark
                              ? "bg-slate-950 border-slate-800"
                              : "bg-slate-100 border-slate-200"
                          }`}
                        >
                          <div
                            className="bg-gradient-to-r from-sky-500 via-cyan-400 via-amber-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(15, sk.percentage))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`py-6 text-center space-y-2 rounded-2xl p-4 border ${
                      isDark
                        ? "bg-slate-950/60 border-slate-800"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        isDark ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      SkillBridge derives industry demand from the skills
                      requested in industry opportunities.
                    </p>
                    <p
                      className={`text-[11px] ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
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
            <span className="text-xs font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
              Ecosystem Integrity
            </span>
            <h2
              className={`text-3xl font-black ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Built for a Trusted Ecosystem
            </h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Industries can register on SkillBridge, while verification helps
              maintain a reliable recruitment ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`border rounded-2xl p-6 space-y-3 ${
                isDark
                  ? "bg-slate-900/80 border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 font-bold flex items-center justify-center border border-sky-500/20 text-sm">
                01
              </div>
              <h4
                className={`font-bold text-base ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                Corporate Registration
              </h4>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Organizations create official profiles with corporate
                documentation and industry category verification.
              </p>
            </div>

            <div
              className={`border rounded-2xl p-6 space-y-3 ${
                isDark
                  ? "bg-slate-900/80 border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 font-bold flex items-center justify-center border border-cyan-500/20 text-sm">
                02
              </div>
              <h4
                className={`font-bold text-base ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                Admin Audit & Review
              </h4>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Platform administrators audit company details to ensure
                legitimacy before granting publishing privileges.
              </p>
            </div>

            <div
              className={`border rounded-2xl p-6 space-y-3 ${
                isDark
                  ? "bg-slate-900/80 border-orange-500/30"
                  : "bg-white border-orange-200 shadow-sm"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 font-bold flex items-center justify-center border border-orange-500/20 text-sm">
                03
              </div>
              <h4
                className={`font-bold text-base ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
              >
                Verified Hiring Partner
              </h4>
              <p
                className={`text-xs leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Verified companies access candidate Skill Matrix profiles and
                post pre-screened campus recruitment opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 8. FINAL CTA ================= */}
      <section
        id="get-started"
        className={`py-20 border-t relative ${
          isDark
            ? "bg-gradient-to-b from-slate-900 to-[#0b1329] border-slate-800"
            : "bg-gradient-to-b from-slate-100 to-sky-50 border-slate-200"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-500 text-xs font-semibold">
            Join SkillBridge Today
          </div>

          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-black leading-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Build skills. Close gaps. Connect with industry.
          </h2>

          <p
            className={`text-sm sm:text-base max-w-2xl mx-auto font-normal ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Turn your skills into opportunities with SkillBridge. The unified
            platform empowering students, institutions, and industry recruiters.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r bg-sky-500 hover:bg-sky-700 hover:text-white text-white font-bold text-sm rounded-xl shadow-xl shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Get Started Now
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/login"
              className={`w-full sm:w-auto px-8 py-3.5 font-semibold text-sm rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"
                  : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs"
              }`}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#060b18] border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-10 border-b border-slate-800/80">
            {/* Brand & Attribution Column */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <img
                  src="/skillbridge_logo.png"
                  alt="SkillBridge Logo"
                  className="w-8 h-8 rounded-lg object-cover border border-sky-500/30"
                />
                <span className="text-xl font-black text-white tracking-tight">
                  SkillBridge
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-sm">
                Portal for Academia–Industry Collaboration for Skill Mapping,
                Internships &amp; Placement
              </p>
              <div className="pt-2 space-y-2 border-t border-slate-900">
                <p className="text-xs font-bold text-sky-400">
                  Built by Team CipherX
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-200 font-semibold">
                    Smart India Hackathon 2026
                  </span>
                  <span>&bull;</span>
                  <span>
                    Problem Statement:{" "}
                    <strong className="text-slate-200">26044</strong>
                  </span>
                </div>
              </div>
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
                    className="hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("features")}
                    className="hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection("industry-demand")}
                    className="hover:text-sky-400 transition-colors cursor-pointer"
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
                    className="hover:text-sky-400 transition-colors"
                  >
                    For Students
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-sky-400 transition-colors"
                  >
                    For Industry
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-sky-400 transition-colors"
                  >
                    For Institutions
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-sky-400 transition-colors"
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
                    className="hover:text-sky-400 transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="hover:text-sky-400 transition-colors"
                  >
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link
                    to="/opportunities"
                    className="hover:text-sky-400 transition-colors"
                  >
                    Public Opportunities
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/dipanjan2907/Skill_Bridge_SIH"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-sky-400 transition-colors flex items-center gap-1"
                  >
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-medium">
            <p>&copy; 2026 Team CipherX. All Rights Reserved.</p>
            <p className="flex flex-wrap items-center gap-1.5 text-slate-400">
              <span>Developed for Smart India Hackathon 2026</span>
              <span>&bull;</span>
              <span>Problem Statement 26044</span>
              <span>&bull;</span>
              <a
                href="https://github.com/dipanjan2907/Skill_Bridge_SIH"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 underline font-semibold transition-colors"
              >
                GitHub Repository
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
