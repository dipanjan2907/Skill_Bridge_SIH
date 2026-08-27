import React, { useState, useEffect } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";
import type { IndustryProfile } from "../../types/industry";
import {
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Save,
  Globe,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import { API_BASE_URL } from "../../config/api";

const IndustryProfilePage: React.FC = () => {
  const { token } = useAuth();

  const [profile, setProfile] = useState<IndustryProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    companyType: "",
    industrySector: "",
    description: "",
    website: "",
    location: "",
    contactEmail: "",
    phone: "",
    logo: "",
  });

  const fetchProfile = async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/industry/profile`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();

      if (res.ok && result.success && result.data) {
        setProfile(result.data);
        setFormData({
          companyName: result.data.companyName || "",
          companyType: result.data.companyType || "",
          industrySector: result.data.industrySector || "",
          description: result.data.description || "",
          website: result.data.website || "",
          location: result.data.location || "",
          contactEmail: result.data.contactEmail || "",
          phone: result.data.phone || "",
          logo: result.data.logo || "",
        });
      } else {
        setErrorMessage(result.message || "Failed to load company profile.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error loading company profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/industry/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (res.ok && result.success && result.data) {
        setProfile(result.data);
        setSuccessMessage("Company profile updated successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(result.message || "Failed to update profile.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network failure updating profile.");
    } finally {
      setSaving(false);
    }
  };

  const status = profile?.verificationStatus || "pending";
  const isApproved = status === "approved";

  return (
    <MainLayout showRightPanel={false}>
      <div className="industry-profile-container">
        {/* Header Title */}
        <div className="page-header">
          <div>
            <span className="page-category">Industry Portal</span>
            <h1>Company Profile & Status</h1>
            <p>Manage your company details and verification status.</p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="state-card loading-state">
            <div className="spinner" />
            <p>Loading company profile...</p>
          </div>
        ) : (
          <>
            {/* Status Banner */}
            <div className={`status-banner status-${status}`}>
              <div className="status-banner-icon">
                {status === "pending" && (
                  <Clock className="text-amber" size={24} />
                )}
                {status === "approved" && (
                  <CheckCircle2 className="text-emerald" size={24} />
                )}
                {status === "rejected" && (
                  <XCircle className="text-red" size={24} />
                )}
              </div>

              <div className="status-banner-content">
                <div className="status-banner-header">
                  <h3>
                    {status === "pending" && "🟡 Verification Pending"}
                    {status === "approved" && "🟢 Verified Industry"}
                    {status === "rejected" && "🔴 Verification Rejected"}
                  </h3>
                  <span className={`status-pill status-pill-${status}`}>
                    {status.toUpperCase()}
                  </span>
                </div>

                <p className="status-banner-text">
                  {status === "pending" &&
                    "Your company profile is currently under verification by an administrator. You can update your company profile details while review is in progress."}
                  {status === "approved" &&
                    "Your company has been verified. You have full access to industry tools and features."}
                  {status === "rejected" &&
                    "Your company verification was rejected. Please review the reason below, update your details, and request another review."}
                </p>

                {status === "rejected" && profile?.rejectionReason && (
                  <div className="rejection-box">
                    <strong>Rejection Reason:</strong>
                    <p>{profile.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Error / Success Alerts */}
            {errorMessage && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success">
                <CheckCircle2 size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Profile Form */}
            <div className="profile-grid">
              <form onSubmit={handleSubmit} className="profile-form-card">
                <div className="card-header">
                  <div className="card-title">
                    <Building2 className="card-icon" size={20} />
                    <div>
                      <h2>Company Details</h2>
                      <p>Update your company information for review.</p>
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Company Name *</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="e.g. Acme Technologies Inc."
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Company Type</label>
                    <select
                      name="companyType"
                      value={formData.companyType}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Company Type</option>
                      <option value="Private Limited">Private Limited</option>
                      <option value="Public Limited">Public Limited</option>
                      <option value="Startup">Startup</option>
                      <option value="MNC">
                        Multinational Corporation (MNC)
                      </option>
                      <option value="Non-Profit">Non-Profit / NGO</option>
                      <option value="Government">
                        Government / Enterprise
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Industry Sector</label>
                    <input
                      type="text"
                      name="industrySector"
                      value={formData.industrySector}
                      onChange={handleInputChange}
                      placeholder="e.g. Software & IT, FinTech"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Company Description</label>
                    <textarea
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Provide a brief overview of your company, mission, and key products..."
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Globe size={14} /> Website URL
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <MapPin size={14} /> Location / Headquarters
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Bengaluru, Karnataka, India"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Mail size={14} /> Contact Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      placeholder="contact@company.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Phone size={14} /> Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Company Logo URL</label>
                    <input
                      type="url"
                      name="logo"
                      value={formData.logo}
                      onChange={handleInputChange}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={saving}
                  >
                    <Save size={16} />
                    <span>
                      {saving ? "Saving Changes..." : "Save Company Profile"}
                    </span>
                  </button>
                </div>
              </form>

              {/* Restricted Actions Side Panel */}
              <div className="restricted-actions-card">
                <div className="card-header">
                  <div className="card-title">
                    <Briefcase className="card-icon" size={20} />
                    <div>
                      <h2>Industry Features</h2>
                      <p>Features and capabilities status.</p>
                    </div>
                  </div>
                </div>

                <div className="actions-list">
                  {/* Opportunity Posting Feature */}
                  <div className={`action-card ${!isApproved ? "locked" : ""}`}>
                    <div className="action-card-header">
                      <div className="action-info">
                        <Sparkles size={18} className="action-icon" />
                        <div>
                          <h4>Post Opportunities</h4>
                          <p>
                            {isApproved
                              ? "Create & manage jobs or internships"
                              : "Post Opportunities — Available after verification"}
                          </p>
                        </div>
                      </div>

                      {!isApproved ? (
                        <span className="lock-badge">
                          <Lock size={12} /> Locked
                        </span>
                      ) : (
                        <span className="unlocked-badge">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                    </div>

                    {!isApproved && (
                      <div className="restricted-note">
                        <AlertCircle size={13} />
                        <span>
                          Approval required to post jobs and internships.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Talent Search Feature */}
                  <div className={`action-card ${!isApproved ? "locked" : ""}`}>
                    <div className="action-card-header">
                      <div className="action-info">
                        <Building2 size={18} className="action-icon" />
                        <div>
                          <h4>Post Collaboration Events</h4>
                          <p>
                            {isApproved
                              ? "Create and publish collaboration events"
                              : "Post Collaboration Events — Available after verification"}
                          </p>
                        </div>
                      </div>

                      {!isApproved ? (
                        <span className="lock-badge">
                          <Lock size={12} /> Locked
                        </span>
                      ) : (
                        <span className="unlocked-badge">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      )}
                    </div>

                    {!isApproved && (
                      <div className="restricted-note">
                        <AlertCircle size={13} />
                        <span>
                          Approval required to search student talent pool.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default IndustryProfilePage;
