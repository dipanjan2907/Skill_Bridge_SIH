import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Building2,
  BookOpen,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../config/api";
import { InstitutionSelectCombobox } from "../components/common/InstitutionSelectCombobox";
import "./Auth.css"; // Make sure to import the new CSS file!

const Auth: React.FC = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [dbInstitutions, setDbInstitutions] = useState<
    Array<{ id: number; name: string; code: string; location: string }>
  >([]);

  useEffect(() => {
    const loadPublicInstitutions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/institution/public`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const approvedInsts = data.data.filter(
            (inst: any) =>
              !inst.verification_status ||
              inst.verification_status.toLowerCase() === "approved",
          );
          setDbInstitutions(approvedInsts);
        }
      } catch (err) {
        console.error("Failed to load institutions:", err);
      }
    };
    loadPublicInstitutions();
  }, []);

  const [signInData, setSignInData] = useState({
    identifier: "",
    password: "",
  });
  const [signUpData, setSignUpData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "Student",
    institution_id: "",
    companyName: "",
    industrySector: "",
    companyType: "",
  });

  const getRolePlaceholders = () => {
    switch (signUpData.role) {
      case "Faculty":
        return {
          nameLabel: "Full Name (with Title)",
          namePlaceholder: "e.g. Dr. Priya Nair",
          usernamePlaceholder: "e.g. prof_priya",
          emailLabel: "Institutional Email Address",
          emailPlaceholder: "e.g. priya.nair@iitm.ac.in",
        };
      case "Institute":
        return {
          nameLabel: "Institution Name",
          namePlaceholder: "e.g. IIT Madras",
          usernamePlaceholder: "e.g. iit_madras",
          emailLabel: "Official Institute Email",
          emailPlaceholder: "e.g. registrar@iitm.ac.in",
        };
      case "Industry":
        return {
          nameLabel: "Representative Name",
          namePlaceholder: "e.g. Rahul Sharma",
          usernamePlaceholder: "e.g. rahul_zoho",
          emailLabel: "Corporate Email Address",
          emailPlaceholder: "e.g. rahul.sharma@zoho.com",
        };
      case "Student":
      default:
        return {
          nameLabel: "Full Name",
          namePlaceholder: "e.g. Aarav Patel",
          usernamePlaceholder: "e.g. aarav_patel",
          emailLabel: "Email Address",
          emailPlaceholder: "e.g. aarav.patel@student.ac.in",
        };
    }
  };

  const placeholders = getRolePlaceholders();

  const handleSignInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignInData({ ...signInData, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSignUpChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signInData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to sign in");
      }

      setSuccessMsg("Welcome back! Entering the bridge...");
      login(data.token, data.user);

      const targetPath =
        data.user?.role?.toLowerCase() === "admin"
          ? "/admin/dashboard"
          : data.user?.role?.toLowerCase() === "industry"
            ? "/industry/profile"
            : "/dashboard";

      setTimeout(() => navigate(targetPath), 600);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (["Student", "Faculty", "Institute"].includes(signUpData.role)) {
      if (!signUpData.institution_id) {
        setErrorMsg(
          "Please select a registered University / Institution from our database.",
        );
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        ...signUpData,
        institution_id: signUpData.institution_id
          ? Number(signUpData.institution_id)
          : undefined,
        companyName:
          signUpData.role === "Industry"
            ? signUpData.companyName || signUpData.name
            : undefined,
        industrySector:
          signUpData.role === "Industry"
            ? signUpData.industrySector
            : undefined,
        companyType:
          signUpData.role === "Industry" ? signUpData.companyType : undefined,
      };

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create account");
      }

      setSuccessMsg(
        signUpData.role === "Industry"
          ? "Industry node established! Redirecting..."
          : "Account synthesized! Redirecting...",
      );
      login(data.token, data.user);

      const targetPath =
        data.user?.role?.toLowerCase() === "industry"
          ? "/industry/profile"
          : "/dashboard";

      setTimeout(() => navigate(targetPath), 600);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`neo-auth-wrapper ${theme}`}>
      {/* Animated Background Orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <div className="neo-auth-container">
        {/* Left Side: Branding / Visuals */}
        <div className="neo-brand-panel">
          <div className="brand-header flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(56,189,248,0.25)]">
                SkillBridge
              </h2>
              <p className="brand-subtitle">Bridge Skills. Build Careers.</p>
            </div>
          </div>

          <div className="glass-hero-card">
            <div className="glowing-badge">
              <Sparkles size={14} className="sparkle-icon" /> AI-Powered
              Matching
            </div>
            <h1 className="hero-heading">
              Decode Your <span className="text-gradient">Career</span>
            </h1>
            <p className="hero-text">
              Enter an ecosystem where top tech companies, verified skills, and
              elite opportunities converge.
            </p>

            <ul className="hero-feature-list">
              <li>
                <div className="feature-icon-box">
                  <CheckCircle2 size={16} />
                </div>
                <span>Automated Skill Verification</span>
              </li>
              <li>
                <div className="feature-icon-box">
                  <CheckCircle2 size={16} />
                </div>
                <span>Real-Time Internship Matching</span>
              </li>
              <li>
                <div className="feature-icon-box">
                  <CheckCircle2 size={16} />
                </div>
                <span>Stand-out Academic Portfolios</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Interactive Form */}
        <div className="neo-form-panel">
          <div className="form-glass-container">
            {/* Segmented Toggle Control */}
            <div className="segmented-control">
              <div
                className={`segment-indicator ${mode === "signup" ? "right" : "left"}`}
              ></div>
              <button
                className={`segment-btn ${mode === "signin" ? "active" : ""}`}
                onClick={() => {
                  setMode("signin");
                  setErrorMsg("");
                }}
                type="button"
              >
                Sign In
              </button>
              <button
                className={`segment-btn ${mode === "signup" ? "active" : ""}`}
                onClick={() => {
                  setMode("signup");
                  setErrorMsg("");
                }}
                type="button"
              >
                Register
              </button>
            </div>

            {/* Alerts */}
            {errorMsg && <div className="neo-alert error">{errorMsg}</div>}
            {successMsg && (
              <div className="neo-alert success">{successMsg}</div>
            )}

            {/* FORM RENDER */}
            {mode === "signin" ? (
              <form onSubmit={handleSignInSubmit} className="neo-form slide-in">
                <div className="form-header">
                  <h2>Welcome Back</h2>
                  <p>Resume your journey on SkillBridge.</p>
                </div>

                <div className="neo-input-group">
                  <label>Email or Username</label>
                  <div className="input-box">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="text"
                      name="identifier"
                      value={signInData.identifier}
                      onChange={handleSignInChange}
                      placeholder="e.g. aarav.patel@student.ac.in"
                      required
                    />
                  </div>
                </div>

                <div className="neo-input-group">
                  <div className="label-row">
                    <label>Password</label>
                    <a
                      href="#forgot"
                      onClick={(e) => e.preventDefault()}
                      className="forgot-link"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="input-box">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={signInData.password}
                      onChange={handleSignInChange}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="neo-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loader"></span>
                  ) : (
                    <>
                      <span>Access Portal</span> <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="neo-form slide-in">
                <div className="form-header">
                  <h2>Initialize Profile</h2>
                  <p>Select your persona to begin.</p>
                </div>

                <div className="neo-role-grid">
                  {[
                    { id: "Student", icon: GraduationCap },
                    { id: "Faculty", icon: BookOpen },
                    { id: "Institute", icon: Building2 },
                    { id: "Industry", icon: Briefcase },
                  ].map((role) => (
                    <div
                      key={role.id}
                      className={`neo-role-card ${signUpData.role === role.id ? "active" : ""}`}
                      onClick={() =>
                        setSignUpData({ ...signUpData, role: role.id })
                      }
                    >
                      <role.icon size={20} className="role-icon" />
                      <span>{role.id}</span>
                    </div>
                  ))}
                </div>

                <div className="input-row">
                  <div className="neo-input-group">
                    <label>{placeholders.nameLabel}</label>
                    <div className="input-box">
                      <UserIcon size={18} className="input-icon" />
                      <input
                        type="text"
                        name="name"
                        value={signUpData.name}
                        onChange={handleSignUpChange}
                        placeholder={placeholders.namePlaceholder}
                        required
                      />
                    </div>
                  </div>
                  <div className="neo-input-group">
                    <label>Username</label>
                    <div className="input-box">
                      <UserIcon size={18} className="input-icon" />
                      <input
                        type="text"
                        name="username"
                        value={signUpData.username}
                        onChange={handleSignUpChange}
                        placeholder={placeholders.usernamePlaceholder}
                        required
                      />
                    </div>
                  </div>
                </div>

                {signUpData.role === "Industry" && (
                  <div className="input-row">
                    <div className="neo-input-group">
                      <label>Company Name</label>
                      <div className="input-box">
                        <Building2 size={18} className="input-icon" />
                        <input
                          type="text"
                          name="companyName"
                          value={signUpData.companyName}
                          onChange={handleSignUpChange}
                          placeholder="e.g. Zoho Corporation"
                          required
                        />
                      </div>
                    </div>
                    <div className="neo-input-group">
                      <label>Industry Sector</label>
                      <div className="input-box">
                        <Briefcase size={18} className="input-icon" />
                        <input
                          type="text"
                          name="industrySector"
                          value={signUpData.industrySector}
                          onChange={handleSignUpChange}
                          placeholder="e.g. SaaS & Cloud"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {["Student", "Faculty"].includes(signUpData.role) && (
                  <div className="neo-input-group">
                    <label>
                      University / Institution{" "}
                      <span className="text-amber-500 font-bold">*</span>
                    </label>
                    <InstitutionSelectCombobox
                      institutions={dbInstitutions}
                      selectedId={signUpData.institution_id}
                      onSelect={(inst) => {
                        setSignUpData((prev) => ({
                          ...prev,
                          institution_id: inst ? String(inst.id) : "",
                        }));
                      }}
                      placeholder="Search registered university or college..."
                      required
                    />
                    <span className="text-[11px] text-slate-400 opacity-80 mt-1 block">
                      * Registration is strictly permitted only for institutions
                      approved in our database.
                    </span>
                  </div>
                )}

                <div className="neo-input-group">
                  <label>{placeholders.emailLabel}</label>
                  <div className="input-box">
                    <Mail size={18} className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={signUpData.email}
                      onChange={handleSignUpChange}
                      placeholder={placeholders.emailPlaceholder}
                      required
                    />
                  </div>
                </div>

                <div className="neo-input-group">
                  <label>Password</label>
                  <div className="input-box">
                    <Lock size={18} className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={signUpData.password}
                      onChange={handleSignUpChange}
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="neo-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loader"></span>
                  ) : (
                    <>
                      <span>Create Account</span> <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
