import { useState, useEffect } from "react";
import {
  Home,
  ClipboardCheck,
  BookOpen,
  Briefcase,
  FileText,
  Bookmark,
  MessageCircle,
  Building2,
  GraduationCap,
  Users,
  X,
  Sun,
  Moon,
  LogOut,
  BarChart2,
  Handshake,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import SideItem from "../common/SideItem";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import type { StudentProfileData } from "../../types/profile";

import { API_BASE_URL } from "../../config/api";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, token, logout } = useAuth();
  const [profileData, setProfileData] = useState<StudentProfileData | null>(
    null,
  );

  useEffect(() => {
    const fetchProfile = async (forceRefresh = false) => {
      if (!forceRefresh) {
        const cached = sessionStorage.getItem("sb_student_profile");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.profile) {
              setProfileData(parsed.profile);
              return;
            }
          } catch (_e) {}
        }
      }

      const authToken = token || localStorage.getItem("skillbridge_token");
      if (!authToken) return;

      try {
        const res = await fetch(`${API_BASE_URL}/student/profile`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const result = await res.json();
          if (result && result.profile) {
            setProfileData(result.profile);
            sessionStorage.setItem("sb_student_profile", JSON.stringify(result));
          }
        }
      } catch (err) {
        console.warn("Sidebar fetch profile notice:", err);
      }
    };

    fetchProfile();

    const handleProfileUpdate = () => {
      sessionStorage.removeItem("sb_student_profile");
      fetchProfile(true);
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    onClose?.();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const role = user?.role ? user.role.toString().toLowerCase() : "student";
  const isInstitutionRole = [
    "institution",
    "academician",
    "faculty",
    "institute",
  ].includes(role);

  const isHomeActive =
    location.pathname === "/dashboard" || location.pathname === "/";
  const isDetailsActive =
    location.pathname === "/student/details";
  const isIndustryActive = location.pathname === "/industry/profile";
  const isIndustryOppActive = location.pathname === "/industry/opportunities";
  const isIndustryQuestionsActive = location.pathname === "/industry/questions";
  const isStudentOppActive = location.pathname === "/opportunities";
  const isStudentAppsActive = location.pathname === "/student/applications";
  const isCompaniesActive = location.pathname === "/companies";
  const isSkillGapActive = location.pathname === "/student/skill-gap";
  const isAdminActive = location.pathname === "/admin/dashboard";
  const isInstitutionActive = location.pathname === "/institution/dashboard";
  const isInstStudentsActive = location.pathname === "/institution/students";
  const isInstQuestionsActive = location.pathname === "/institution/questions";
  const isCollabActive = location.pathname === "/collaborations";
  const isSavedActive = location.pathname === "/student/saved";
  const isLearningActive = location.pathname === "/student/learning";
  const isExperiencesActive =
    location.pathname === "/student/experiences" || location.pathname === "/experiences";

  // Calculate 2-letter initials from name, stripping titles (Dr., Prof., Mr., etc.)
  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return "SB";
    const titles = new Set([
      "dr",
      "dr.",
      "mr",
      "mr.",
      "mrs",
      "mrs.",
      "ms",
      "ms.",
      "prof",
      "prof.",
      "er",
      "er.",
      "shri",
      "smt",
      "sir",
      "madam",
    ]);
    const parts = name
      .trim()
      .split(/\s+/)
      .filter((part) => !titles.has(part.toLowerCase()));

    if (parts.length === 0) {
      const raw = name.replace(/[^a-zA-Z]/g, "");
      return raw.substring(0, 2).toUpperCase() || "SB";
    }

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Dynamic values from database fetch
  const displayName =
    role === "admin"
      ? user?.name || "System Admin"
      : role === "industry"
        ? user?.name || "Industry Partner"
        : isInstitutionRole
          ? user?.name || "Academic Institution"
          : profileData?.name || user?.name || "Student User";

  const degreeText =
    role === "admin"
      ? "Administrator Console"
      : role === "industry"
        ? "Corporate Account"
        : isInstitutionRole
          ? "Institution Portal"
          : [profileData?.degree, profileData?.department]
              .filter(Boolean)
              .join(" • ") || "Program details pending";

  const institutionName =
    role === "admin"
      ? "SkillBridge Admin"
      : role === "industry"
        ? "Verified Partner"
        : isInstitutionRole
          ? "Academic Intelligence Portal"
          : profileData?.institution || "Institute details pending";

  // Calculate actual profile completion strength % from DB fields
  const calculateStrength = () => {
    if (!profileData) return 50;
    const fields = [
      profileData.name,
      profileData.email,
      profileData.phone,
      profileData.bio,
      profileData.institution,
      profileData.degree,
      profileData.department,
      profileData.cgpa,
      profileData.location,
    ];
    const filled = fields.filter((f) => f && String(f).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  const profileStrength = calculateStrength();

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />

      <aside className={`sidebar custom-scrollbar ${isOpen ? "open" : ""}`}>
        {/* Mobile Header */}
        <div className="sidebar-header-mobile">
          <div className="logo cursor-pointer" onClick={() => handleNavigation("/dashboard")}>
            <img src="/logo.jpeg" alt="SkillBridge Logo" className="logo-icon object-cover" />
            <strong>SkillBridge</strong>
          </div>

          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Profile Header */}
        <div
          className="profile"
          onClick={() => {
            if (role === "industry") handleNavigation("/industry/profile");
            else if (role === "admin") handleNavigation("/admin/dashboard");
            else handleNavigation("/student/details");
          }}
          style={{ cursor: "pointer" }}
          title="Click to view profile details"
        >
          <div className="avatar">{getInitials(displayName)}</div>

          <div>
            <h3>{displayName}</h3>
            <p>{degreeText}</p>
            <p>{institutionName}</p>
          </div>
        </div>

        {/* Profile Strength (for Students) */}
        {role === "student" && (
          <div className="profile-strength">
            <div>
              <span>Profile Strength</span>
              <b>{profileStrength}%</b>
            </div>

            <div className="strength-bar">
              <span style={{ width: `${profileStrength}%` }} />
            </div>
          </div>
        )}

        {/* Theme Switcher */}
        <div className="sidebar-theme-toggle" onClick={toggleTheme}>
          <div className="theme-toggle-label">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </div>
          <div className={`theme-switch-pill ${theme}`}>
            <div className="switch-thumb" />
          </div>
        </div>

        {/* Role-Based Navigation */}
        <nav>
          {role === "admin" ? (
            <>
              <div className="nav-heading">ADMINISTRATION</div>
              <div
                onClick={() => handleNavigation("/admin/dashboard")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Building2 />}
                  text="Verification"
                  active={isAdminActive}
                />
              </div>
            </>
          ) : role === "industry" ? (
            <>
              <div className="nav-heading">INDUSTRY PORTAL</div>
              <div
                onClick={() => handleNavigation("/industry/profile")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Building2 />}
                  text="Company Profile"
                  active={isIndustryActive}
                />
              </div>

              <div
                onClick={() => handleNavigation("/dashboard")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Home />}
                  text="Dashboard"
                  active={isHomeActive}
                />
              </div>

              <div className="nav-heading">MANAGEMENT</div>
              <div
                onClick={() => handleNavigation("/industry/opportunities")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Briefcase />}
                  text="Opportunities & Skills"
                  active={isIndustryOppActive}
                />
              </div>
              <div
                onClick={() => handleNavigation("/industry/questions")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<ClipboardCheck />}
                  text="Assessment Question Bank"
                  active={isIndustryQuestionsActive}
                  badge="Contribute"
                />
              </div>
              <div
                onClick={() => handleNavigation("/collaborations")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Handshake />}
                  text="Academia Collaborations"
                  active={isCollabActive}
                  badge="Initiatives"
                />
              </div>
            </>
          ) : isInstitutionRole ? (
            <>
              <div className="nav-heading">INSTITUTION PORTAL</div>
              <div
                onClick={() => handleNavigation("/institution/dashboard")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Building2 />}
                  text="Institution Dashboard"
                  active={isInstitutionActive}
                />
              </div>
              <div
                onClick={() => handleNavigation("/institution/students")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Users />}
                  text="Enrolled Student Details & Skills"
                  active={isInstStudentsActive}
                />
              </div>
              <div
                onClick={() => handleNavigation("/institution/questions")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<FileText />}
                  text="Faculty Question Bank"
                  active={isInstQuestionsActive}
                  badge="Contribute"
                />
              </div>
              <div
                onClick={() => handleNavigation("/opportunities")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Briefcase />}
                  text="Academician Opportunities"
                  active={isStudentOppActive}
                  badge="Industry"
                />
              </div>
              <div
                onClick={() => handleNavigation("/collaborations")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Handshake />}
                  text="Industry Collaborations"
                  active={isCollabActive}
                  badge="Ecosystem"
                />
              </div>
            </>
          ) : (
            <>
              <div
                onClick={() => handleNavigation("/dashboard")}
                style={{ cursor: "pointer" }}
              >
                <SideItem icon={<Home />} text="Home" active={isHomeActive} />
              </div>

              <div
                onClick={() => handleNavigation("/student/details")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<ClipboardCheck />}
                  text="My Details"
                  active={isDetailsActive}
                />
              </div>

              <div
                onClick={() => handleNavigation("/student/skill-gap")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<BarChart2 />}
                  text="Skill Gap Analysis"
                  active={isSkillGapActive}
                  badge="Analytics"
                />
              </div>
              <div
                onClick={() => handleNavigation("/student/learning")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<BookOpen />}
                  text="Learning Path"
                  active={isLearningActive}
                  badge="BETA"
                />
              </div>
              <div
                onClick={() => handleNavigation("/student/experiences")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Briefcase />}
                  text="Experiences"
                  active={isExperiencesActive}
                />
              </div>
              <div
                onClick={() => handleNavigation("/student/applications")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<FileText />}
                  text="Applications"
                  active={isStudentAppsActive}
                />
              </div>
              <div
                onClick={() => handleNavigation("/student/saved")}
                style={{ cursor: "pointer" }}
              >
                <SideItem icon={<Bookmark />} text="Saved" active={isSavedActive} />
              </div>
              <div
                onClick={() =>
                  handleNavigation("/coming-soon?feature=Direct%20Messages")
                }
                style={{ cursor: "pointer" }}
              >
                <SideItem icon={<MessageCircle />} text="Messages" />
              </div>

              <div className="nav-heading">EXPLORE</div>
              <div
                onClick={() => handleNavigation("/collaborations")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Handshake />}
                  text="Academia-Industry Collaborations"
                  active={isCollabActive}
                  badge="Ecosystem"
                />
              </div>
              <div
                onClick={() => handleNavigation("/opportunities")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Briefcase />}
                  text="Browse Opportunities"
                  active={isStudentOppActive}
                />
              </div>
              <div
                onClick={() => handleNavigation("/companies")}
                style={{ cursor: "pointer" }}
              >
                <SideItem
                  icon={<Building2 />}
                  text="Companies"
                  active={isCompaniesActive}
                />
              </div>
              <div
                onClick={() =>
                  handleNavigation("/coming-soon?feature=Learning%20Programs")
                }
                style={{ cursor: "pointer" }}
              >
                <SideItem icon={<GraduationCap />} text="Learning Programs" />
              </div>
            </>
          )}

          <div className="nav-heading">ACCOUNT</div>
          <div onClick={handleLogout} style={{ cursor: "pointer" }}>
            <SideItem icon={<LogOut />} text="Sign Out" />
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
