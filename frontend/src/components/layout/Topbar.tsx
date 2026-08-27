import {
  Search,
  Bell,
  MessageCircle,
  Menu,
  Sparkles,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

interface TopbarProps {
  onToggleSidebar?: () => void;
  onToggleRightPanel?: () => void;
  isRightPanelOpen?: boolean;
}

const Topbar = ({
  onToggleSidebar,
  onToggleRightPanel,
  isRightPanelOpen,
}: TopbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName = user?.name || "Student User";
  const displayRole = user?.role || "Student";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <button
          className="icon-button mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <div
          className="logo"
          onClick={() => navigate("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          <img
            src="/logo.jpeg"
            alt="SkillBridge Logo"
            className="logo-icon object-cover"
          />

          <div className="logo-text">
            <strong>SkillBridge</strong>

            <small>Bridge Skills. Build Careers.</small>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search">
        <Search
          size={18}
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/coming-soon?feature=Global%20Search")}
        />

        <input
          type="text"
          placeholder="Search internships, jobs, skills, companies..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate("/coming-soon?feature=Global%20Search");
            }
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="top-links">
        <span
          className={
            location.pathname === "/dashboard" || location.pathname === "/"
              ? "active"
              : ""
          }
          onClick={() => navigate("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          Home
        </span>

        <span
          className={location.pathname === "/companies" ? "active" : ""}
          onClick={() => navigate("/companies")}
          style={{ cursor: "pointer" }}
        >
          Industry Connect
        </span>

        <span
          className={location.pathname === "/opportunities" ? "active" : ""}
          onClick={() => navigate("/opportunities")}
          style={{ cursor: "pointer" }}
        >
          Opportunities
        </span>

        <span
          className={
            location.pathname.startsWith("/coming-soon") &&
            location.search.includes("Learning")
              ? "active"
              : ""
          }
          onClick={() => navigate("/coming-soon?feature=Learning%20Hub")}
          style={{ cursor: "pointer" }}
        >
          Learning
        </span>
      </nav>

      {/* Actions */}
      <div className="top-actions">
        {/* Theme Switcher Button */}
        <button
          className="icon-button theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          aria-label="Toggle theme mode"
        >
          {theme === "dark" ? (
            <Sun size={19} className="theme-icon sun" />
          ) : (
            <Moon size={19} className="theme-icon moon" />
          )}
        </button>

        <button
          className={`icon-button mobile-panel-btn ${isRightPanelOpen ? "active" : ""}`}
          onClick={onToggleRightPanel}
          title="Toggle Career Match & AI Assistant"
          aria-label="Toggle Career Match and AI Assistant"
        >
          <Sparkles size={18} />
        </button>

        <button
          className="icon-button"
          aria-label="Notifications"
          title="Notifications"
          onClick={() => navigate("/coming-soon?feature=Notifications")}
        >
          <Bell size={20} />
        </button>

        <button
          className="icon-button"
          aria-label="Messages"
          title="Direct Messages"
          onClick={() => navigate("/coming-soon?feature=Direct%20Messages")}
        >
          <MessageCircle size={20} />
        </button>

        <div
          className="user-profile-widget"
          onClick={() => navigate("/student/details")}
          style={{ cursor: "pointer" }}
          title="View My Details"
        >
          <div className="mini-avatar">{userInitials}</div>

          <div className="user-info">
            <b>{displayName}</b>
            <small>{displayRole}</small>
          </div>
        </div>

        {/* Logout Button */}
        <button
          className="icon-button logout-btn"
          onClick={handleLogout}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Topbar;
