import React, { useState, useEffect } from "react";
import MainLayout from "../../components/layout/MainLayout";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";
import {
  Handshake,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Building2,
  GraduationCap,
  Trash2,
  Check,
  Zap,
  RotateCw,
} from "lucide-react";
import "./CollaborationsPage.css";

interface SkillItem {
  id: number;
  name: string;
  category?: string;
}

interface Collaboration {
  id: number;
  created_by: number;
  industry_id: number | null;
  institution_id: number | null;
  title: string;
  description: string;
  collaboration_type: string;
  target_audience: "Student" | "Faculty" | "Both";
  start_date: string | null;
  end_date: string | null;
  start_time?: string | null;
  location: string | null;
  mode: "Online" | "Offline" | "Hybrid";
  capacity: number;
  status: "draft" | "published" | "closed";
  created_at: string;
  creator_name: string;
  creator_role: string;
  company_name?: string | null;
  company_logo?: string | null;
  institution_name?: string | null;
  participant_count: number;
  skills: SkillItem[];
  match_score?: number | null;
  my_status?: "Applied" | "Accepted" | "Rejected" | "Completed" | null;
}

interface Participant {
  participant_id: number;
  user_id: number;
  role: string;
  status: "Applied" | "Accepted" | "Rejected" | "Completed";
  applied_at: string;
  name: string;
  email: string;
  degree?: string;
  department?: string;
  current_sem?: string;
  roll_number?: string;
  cgpa?: number | string;
  phone?: string;
}

const COLLAB_TYPES = [
  "Mentorship",
  "Workshop",
  "Guest Lecture",
  "Innovation Challenge",
  "Live Industry Project",
  "Research Collaboration",
  "Faculty Training",
  "Industrial Training",
];

const CollaborationsPage: React.FC = () => {
  const { token, user } = useAuth();

  const role = user?.role ? user.role.toString().toLowerCase() : "student";
  const isIndustry = role === "industry";
  const canCreate = ["industry", "institution", "academician", "faculty", "institute", "admin"].includes(role);

  // State
  const [activeTab, setActiveTab] = useState<"explore" | "my" | "created">(
    isIndustry ? "created" : "explore"
  );
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [myParticipations, setMyParticipations] = useState<any[]>([]);
  const [myCreated, setMyCreated] = useState<Collaboration[]>([]);
  const [masterSkills, setMasterSkills] = useState<SkillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dedicated Refresh Handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchCollaborations(), fetchMyCollaborations()]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");

  // Modals
  const [selectedCollab, setSelectedCollab] = useState<Collaboration | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  // Apply State
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState("Mentorship");
  const [formAudience, setFormAudience] = useState<"Student" | "Faculty" | "Both">("Both");
  const [formMode, setFormMode] = useState<"Online" | "Offline" | "Hybrid">("Online");
  const [formLocation, setFormLocation] = useState("");
  const [formCapacity, setFormCapacity] = useState(50);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>([]);
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [skillFilterText, setSkillFilterText] = useState("");

  // Participants State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // Fetch Collaborations
  const fetchCollaborations = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (typeFilter) queryParams.append("type", typeFilter);
      if (modeFilter) queryParams.append("mode", modeFilter);
      if (audienceFilter) queryParams.append("target_audience", audienceFilter);

      const res = await fetch(`${API_BASE_URL}/collaborations?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCollaborations(data.collaborations || []);
      } else {
        setError(data.message || "Failed to load collaborations.");
      }
    } catch (err: any) {
      setError("Network error fetching collaborations.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch My Collaborations
  const fetchMyCollaborations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/collaborations/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyParticipations(data.participations || []);
        setMyCreated(data.created || []);
      }
    } catch (err) {
      console.error("Error fetching my collaborations:", err);
    }
  };

  // Fetch Master Skills
  const fetchMasterSkills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data)) {
          setMasterSkills(data);
        } else if (data.skills && Array.isArray(data.skills)) {
          setMasterSkills(data.skills);
        }
      }
    } catch (err) {
      console.error("Error fetching master skills:", err);
    }
  };

  useEffect(() => {
    fetchCollaborations();
    fetchMyCollaborations();
    fetchMasterSkills();
  }, [search, typeFilter, modeFilter, audienceFilter]);

  // Handle Apply
  const handleApply = async (collabId: number) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/collaborations/${collabId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: "success", text: "Successfully joined initiative!" });
        fetchCollaborations();
        fetchMyCollaborations();
        if (selectedCollab && selectedCollab.id === collabId) {
          setSelectedCollab({ ...selectedCollab, my_status: "Applied", participant_count: selectedCollab.participant_count + 1 });
        }
      } else {
        setActionMessage({ type: "error", text: data.message || "Failed to apply." });
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "Network error during application." });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Application
  const handleCancelApplication = async (collabId: number) => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/collaborations/${collabId}/apply`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: "success", text: "Application cancelled." });
        fetchCollaborations();
        fetchMyCollaborations();
        if (selectedCollab && selectedCollab.id === collabId) {
          setSelectedCollab({ ...selectedCollab, my_status: null, participant_count: Math.max(0, selectedCollab.participant_count - 1) });
        }
      } else {
        setActionMessage({ type: "error", text: data.message || "Failed to cancel application." });
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "Network error during cancellation." });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/collaborations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          collaboration_type: formType,
          target_audience: formAudience,
          mode: formMode,
          location: formLocation,
          capacity: formCapacity,
          start_date: formStartDate || null,
          end_date: formEndDate || null,
          start_time: formStartTime || null,
          skill_ids: [...selectedSkillIds, ...customSkills],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ type: "success", text: "Collaboration initiative published!" });
        setCreateModalOpen(false);
        // Reset form
        setFormTitle("");
        setFormDesc("");
        setFormLocation("");
        setFormStartDate("");
        setFormEndDate("");
        setFormStartTime("");
        setSelectedSkillIds([]);
        setCustomSkills([]);
        setSkillFilterText("");
        fetchCollaborations();
        fetchMyCollaborations();
      } else {
        setActionMessage({ type: "error", text: data.message || "Failed to create collaboration." });
      }
    } catch (err) {
      setActionMessage({ type: "error", text: "Network error creating collaboration." });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Manage Participants Open
  const openManageParticipants = async (collab: Collaboration) => {
    setSelectedCollab(collab);
    setManageModalOpen(true);
    setParticipantsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/collaborations/${collab.id}/participants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error("Error loading participants:", err);
    } finally {
      setParticipantsLoading(false);
    }
  };

  // Handle Participant Status Update
  const handleUpdateParticipantStatus = async (participantId: number, newStatus: string) => {
    if (!selectedCollab) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/collaborations/${selectedCollab.id}/participants/${participantId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setParticipants((prev) =>
          prev.map((p) => (p.participant_id === participantId ? { ...p, status: newStatus as any } : p))
        );
      }
    } catch (err) {
      console.error("Error updating participant status:", err);
    }
  };

  // Delete Collaboration
  const handleDeleteCollaboration = async (collabId: number) => {
    if (!window.confirm("Are you sure you want to delete this collaboration initiative?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/collaborations/${collabId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchCollaborations();
        fetchMyCollaborations();
        setDetailModalOpen(false);
      }
    } catch (err) {
      console.error("Error deleting collaboration:", err);
    }
  };

  const getStatusBadgeClass = (st?: string | null) => {
    switch (st) {
      case "Accepted":
        return "badge-accepted";
      case "Applied":
        return "badge-applied";
      case "Completed":
        return "badge-completed";
      case "Rejected":
        return "badge-rejected";
      default:
        return "";
    }
  };

  return (
    <MainLayout showRightPanel={false}>
      <div className="collaborations-page-container">
          {/* Header Banner */}
          <div className="collab-hero-header">
            <div className="collab-hero-text">
              <div className="collab-hero-pill">
                <Handshake size={16} />
                <span>ACADEMIA - INDUSTRY ECOSYSTEM</span>
              </div>

              <h1>
                Bridge Industry Innovation with <span>Academic Excellence</span>
              </h1>

              <p>
                Discover mentorship programs, joint research, guest lectures, innovation challenges, and industrial training initiatives connecting students, faculty, and industry partners.
              </p>
            </div>

            <div className="collab-hero-actions">
              <button
                className={`btn-refresh-header ${isRefreshing ? "refreshing" : ""}`}
                onClick={handleRefresh}
                title="Refresh Collaboration Initiatives"
              >
                <RotateCw size={17} className={isRefreshing ? "spin-icon" : ""} />
                <span>Refresh</span>
              </button>

              {canCreate && (
                <button
                  className="btn-create-initiative"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus size={18} />
                  Publish Initiative
                </button>
              )}
            </div>
          </div>

          {/* Action Message Banner */}
          {actionMessage && (
            <div className={`collab-toast ${actionMessage.type}`}>
              {actionMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{actionMessage.text}</span>
              <button onClick={() => setActionMessage(null)}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Nav Tabs */}
          <div className="collab-tabs">
            <button
              className={`collab-tab ${activeTab === "explore" ? "active" : ""}`}
              onClick={() => setActiveTab("explore")}
            >
              <Sparkles size={16} />
              Explore Initiatives ({collaborations.length})
            </button>

            {!isIndustry && (
              <button
                className={`collab-tab ${activeTab === "my" ? "active" : ""}`}
                onClick={() => setActiveTab("my")}
              >
                <Award size={16} />
                My Participations ({myParticipations.length})
              </button>
            )}

            {canCreate && (
              <button
                className={`collab-tab ${activeTab === "created" ? "active" : ""}`}
                onClick={() => setActiveTab("created")}
              >
                <Building2 size={16} />
                Managed Initiatives ({myCreated.length})
              </button>
            )}
          </div>

          {/* TAB 1: EXPLORE */}
          {activeTab === "explore" && (
            <>
              {/* Filter Bar */}
              <div className="collab-filter-bar">
                <div className="collab-search-box">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search by title, organization, or keyword..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button className="clear-search" onClick={() => setSearch("")}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="collab-filter-group">
                  <Filter size={16} className="filter-icon" />

                  {/* Type Filter */}
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">All Types</option>
                    {COLLAB_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  {/* Mode Filter */}
                  <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
                    <option value="">All Modes</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>

                  {/* Audience Filter */}
                  <select value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)}>
                    <option value="">All Audiences</option>
                    <option value="Student">Students</option>
                    <option value="Faculty">Faculty & Academicians</option>
                    <option value="Both">Both (Students & Faculty)</option>
                  </select>

                  {/* Refresh Button */}
                  <button
                    className={`btn-refresh-collab ${isRefreshing ? "refreshing" : ""}`}
                    onClick={handleRefresh}
                    title="Refresh Initiatives"
                  >
                    <RotateCw size={15} className={isRefreshing ? "spin-icon" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Grid */}
              {loading ? (
                <div className="collab-loading-state">
                  <Loader2 size={36} className="spin-icon" />
                  <p>Loading collaboration initiatives from database...</p>
                </div>
              ) : error ? (
                <div className="collab-error-state">
                  <AlertCircle size={32} />
                  <p>{error}</p>
                  <button onClick={fetchCollaborations}>Retry</button>
                </div>
              ) : collaborations.length === 0 ? (
                <div className="collab-empty-state">
                  <Handshake size={48} />
                  <h3>No Collaboration Initiatives Found</h3>
                  <p>No initiatives matched your current search filters.</p>
                </div>
              ) : (
                <div className="collab-grid">
                  {collaborations.map((item) => (
                    <div key={item.id} className="collab-card">
                      <div className="collab-card-header">
                        <span className="collab-type-badge">{item.collaboration_type}</span>

                        {item.match_score !== null && item.match_score !== undefined && (
                          <span
                            className={`collab-match-badge ${
                              item.match_score >= 70
                                ? "high"
                                : item.match_score >= 40
                                ? "medium"
                                : "low"
                            }`}
                            title="Skill match compatibility based on your profile skills"
                          >
                            <Zap size={13} />
                            {item.match_score}% Skill Match
                          </span>
                        )}

                        {item.my_status && (
                          <span className={`collab-my-status ${getStatusBadgeClass(item.my_status)}`}>
                            {item.my_status}
                          </span>
                        )}
                      </div>

                      <h3 className="collab-card-title">{item.title}</h3>

                      <div className="collab-org-row">
                        {item.company_name ? (
                          <>
                            <Building2 size={15} />
                            <span>{item.company_name}</span>
                          </>
                        ) : (
                          <>
                            <GraduationCap size={15} />
                            <span>{item.institution_name || item.creator_name}</span>
                          </>
                        )}
                      </div>

                      <p className="collab-card-desc">{item.description}</p>

                      {/* Required Skills */}
                      {item.skills && item.skills.length > 0 && (
                        <div className="collab-skills-tags">
                          {item.skills.map((sk) => (
                            <span key={sk.id} className="skill-tag">
                              {sk.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="collab-meta-list">
                        <div className="meta-item">
                          <MapPin size={14} />
                          <span>
                            {item.mode} {item.location ? `• ${item.location}` : ""}
                          </span>
                        </div>

                        <div className="meta-item">
                          <Users size={14} />
                          <span>
                            {item.participant_count} / {item.capacity} Joined
                          </span>
                        </div>

                        {item.start_date && (
                          <div className="meta-item">
                            <Calendar size={14} />
                            <span>
                              {new Date(item.start_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        )}

                        {item.start_time && (
                          <div className="meta-item">
                            <Clock size={14} />
                            <span>{item.start_time}</span>
                          </div>
                        )}
                      </div>

                      {/* Audience Pill */}
                      <div className="collab-audience-pill">
                        Target Audience: <b>{item.target_audience}</b>
                      </div>

                      <div className="collab-card-actions">
                        <button
                          className="btn-view-details"
                          onClick={() => {
                            setSelectedCollab(item);
                            setDetailModalOpen(true);
                          }}
                        >
                          View Details & Apply
                        </button>

                        {item.created_by === user?.id && (
                          <button
                            className="btn-manage-card"
                            onClick={() => openManageParticipants(item)}
                          >
                            Manage ({item.participant_count})
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 2: MY PARTICIPATIONS */}
          {activeTab === "my" && !isIndustry && (
            <div className="my-collaborations-section">
              {myParticipations.length === 0 ? (
                <div className="collab-empty-state">
                  <Award size={48} />
                  <h3>No Application Records</h3>
                  <p>You haven't joined or applied to any collaboration initiatives yet.</p>
                </div>
              ) : (
                <div className="participations-table-container">
                  <table className="collab-table">
                    <thead>
                      <tr>
                        <th>Initiative Title</th>
                        <th>Type</th>
                        <th>Organizer</th>
                        <th>Mode & Location</th>
                        <th>Applied On</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myParticipations.map((p) => (
                        <tr key={p.participant_id}>
                          <td>
                            <strong>{p.title}</strong>
                          </td>
                          <td>
                            <span className="table-type-badge">{p.collaboration_type}</span>
                          </td>
                          <td>{p.company_name || p.institution_name || p.creator_name}</td>
                          <td>
                            {p.mode} {p.location ? `(${p.location})` : ""}
                          </td>
                          <td>{new Date(p.applied_at).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-pill ${getStatusBadgeClass(p.participation_status)}`}>
                              {p.participation_status}
                            </span>
                          </td>
                          <td>
                            {p.participation_status === "Applied" && (
                              <button
                                className="btn-cancel-app"
                                onClick={() => handleCancelApplication(p.collaboration_id)}
                                disabled={actionLoading}
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANAGED INITIATIVES */}
          {activeTab === "created" && canCreate && (
            <div className="created-collaborations-section">
              {myCreated.length === 0 ? (
                <div className="collab-empty-state">
                  <Building2 size={48} />
                  <h3>No Initiatives Published Yet</h3>
                  <p>Publish an initiative to invite students and academicians to participate.</p>
                  <button
                    className="btn-create-initiative"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    <Plus size={16} /> Publish First Initiative
                  </button>
                </div>
              ) : (
                <div className="created-grid">
                  {myCreated.map((item) => (
                    <div key={item.id} className="created-collab-card">
                      <div className="created-header">
                        <span className="collab-type-badge">{item.collaboration_type}</span>
                        <span className="created-status-published">Published</span>
                      </div>

                      <h3>{item.title}</h3>
                      <p>{item.description}</p>

                      <div className="created-stats">
                        <div>
                          <Users size={16} />
                          <b>{item.participant_count}</b> / {item.capacity} Applicants
                        </div>

                        <div>
                          <Calendar size={16} />
                          <span>
                            {item.start_date
                              ? new Date(item.start_date).toLocaleDateString()
                              : "Flexible Start"}
                          </span>
                        </div>
                      </div>

                      <div className="created-actions">
                        <button
                          className="btn-manage-participants"
                          onClick={() => openManageParticipants(item)}
                        >
                          <Users size={16} /> Manage Participants ({item.participant_count})
                        </button>

                        <button
                          className="btn-delete-collab"
                          onClick={() => handleDeleteCollaboration(item.id)}
                          title="Delete Collaboration"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      {/* DETAIL & APPLY MODAL */}
      {detailModalOpen && selectedCollab && (
        <div className="collab-modal-overlay" onClick={() => setDetailModalOpen(false)}>
          <div className="collab-modal-content custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            <button className="collab-modal-close" onClick={() => setDetailModalOpen(false)}>
              <X size={20} />
            </button>

            <div className="collab-detail-header">
              <span className="collab-type-badge">{selectedCollab.collaboration_type}</span>
              {selectedCollab.match_score !== null && selectedCollab.match_score !== undefined && (
                <span className="collab-match-badge high">
                  <Zap size={14} /> {selectedCollab.match_score}% Skill Match
                </span>
              )}
            </div>

            <h2>{selectedCollab.title}</h2>

            <div className="collab-modal-org">
              {selectedCollab.company_name ? (
                <>
                  <Building2 size={18} />
                  <span>Hosted by <strong>{selectedCollab.company_name}</strong></span>
                </>
              ) : (
                <>
                  <GraduationCap size={18} />
                  <span>Organized by <strong>{selectedCollab.institution_name || selectedCollab.creator_name}</strong></span>
                </>
              )}
            </div>

            <div className="collab-detail-grid">
              <div className="detail-box">
                <span className="box-label">Mode & Location</span>
                <span className="box-val">
                  {selectedCollab.mode} {selectedCollab.location ? `(${selectedCollab.location})` : ""}
                </span>
              </div>

              <div className="detail-box">
                <span className="box-label">Capacity & Seats</span>
                <span className="box-val">
                  {selectedCollab.participant_count} / {selectedCollab.capacity} Slots Filled
                </span>
              </div>

              <div className="detail-box">
                <span className="box-label">Target Audience</span>
                <span className="box-val">{selectedCollab.target_audience}</span>
              </div>

              <div className="detail-box">
                <span className="box-label">Duration & Timing</span>
                <span className="box-val">
                  {selectedCollab.start_date
                    ? `${new Date(selectedCollab.start_date).toLocaleDateString()} ${
                        selectedCollab.end_date ? `to ${new Date(selectedCollab.end_date).toLocaleDateString()}` : ""
                      }`
                    : "Flexible / Ongoing"}
                  {selectedCollab.start_time ? ` (${selectedCollab.start_time})` : ""}
                </span>
              </div>
            </div>

            <div className="collab-detail-section">
              <h4>Full Initiative Overview</h4>
              <p>{selectedCollab.description}</p>
            </div>

            {selectedCollab.skills && selectedCollab.skills.length > 0 && (
              <div className="collab-detail-section">
                <h4>Required Competencies & Skills</h4>
                <div className="collab-skills-tags">
                  {selectedCollab.skills.map((sk) => (
                    <span key={sk.id} className="skill-tag highlight">
                      {sk.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Application Action Footer */}
            <div className="collab-detail-footer">
              {selectedCollab.my_status ? (
                <div className="my-status-container">
                  <span className={`status-pill ${getStatusBadgeClass(selectedCollab.my_status)}`}>
                    Application Status: {selectedCollab.my_status}
                  </span>
                  {selectedCollab.my_status === "Applied" && (
                    <button
                      className="btn-cancel-app"
                      onClick={() => handleCancelApplication(selectedCollab.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 size={16} className="spin-icon" /> : "Cancel Application"}
                    </button>
                  )}
                </div>
              ) : selectedCollab.created_by === user?.id ? (
                <button
                  className="btn-primary-action"
                  onClick={() => {
                    setDetailModalOpen(false);
                    openManageParticipants(selectedCollab);
                  }}
                >
                  <Users size={16} /> Manage Participants
                </button>
              ) : (
                <button
                  className="btn-primary-action"
                  onClick={() => handleApply(selectedCollab.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="spin-icon" />
                  ) : (
                    <Handshake size={18} />
                  )}
                  Apply / Register for Initiative
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE INITIATIVE MODAL */}
      {createModalOpen && (
        <div className="collab-modal-overlay" onClick={() => setCreateModalOpen(false)}>
          <div className="collab-modal-content custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            <button className="collab-modal-close" onClick={() => setCreateModalOpen(false)}>
              <X size={20} />
            </button>

            <h2>Publish Academia–Industry Initiative</h2>
            <p className="modal-subtitle">
              Create a mentorship, workshop, or collaborative initiative for students and faculty.
            </p>

            <form onSubmit={handleCreateSubmit} className="collab-form">
              <div className="form-group">
                <label>Initiative Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Full Stack Development Mentorship"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Collaboration Type *</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)}>
                    {COLLAB_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Audience *</label>
                  <select
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as any)}
                  >
                    <option value="Both">Both (Students & Faculty)</option>
                    <option value="Student">Students Only</option>
                    <option value="Faculty">Faculty / Academicians Only</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Mode *</label>
                  <select value={formMode} onChange={(e) => setFormMode(e.target.value as any)}>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Location / Link</label>
                  <input
                    type="text"
                    placeholder="e.g. Virtual Portal or Kolkata Center"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Max Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Schedule Time / Hours</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM - 01:00 PM IST"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description & Objectives *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the initiative's goal, practical exposure, and expected outcomes..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              {/* Required Competencies / Skills Section */}
              <div className="form-group collab-competencies-container">
                <div className="competencies-header">
                  <label>Required Competencies / Skills</label>
                  <span className="competencies-count-badge">
                    {selectedSkillIds.length + customSkills.length} Selected
                  </span>
                </div>

                {/* Selected Skills Badges Tray */}
                {(selectedSkillIds.length > 0 || customSkills.length > 0) && (
                  <div className="selected-competencies-tray">
                    {selectedSkillIds.map((id) => {
                      const skillObj = masterSkills.find((s) => s.id === id);
                      if (!skillObj) return null;
                      return (
                        <span key={id} className="selected-competency-pill">
                          {skillObj.name}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSkillIds((prev) => prev.filter((sId) => sId !== id))
                            }
                            title="Remove competency"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}

                    {customSkills.map((cName) => (
                      <span key={cName} className="selected-competency-pill custom">
                        {cName} (Custom)
                        <button
                          type="button"
                          onClick={() =>
                            setCustomSkills((prev) => prev.filter((name) => name !== cName))
                          }
                          title="Remove custom competency"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Filter & Add Custom Skill Input */}
                <div className="competencies-search-wrapper">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search or add custom competency (e.g. React, Docker, AI/ML)..."
                    value={skillFilterText}
                    onChange={(e) => setSkillFilterText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = skillFilterText.trim();
                        if (trimmed) {
                          const existingMaster = masterSkills.find(
                            (s) => s.name.toLowerCase() === trimmed.toLowerCase()
                          );
                          if (existingMaster) {
                            if (!selectedSkillIds.includes(existingMaster.id)) {
                              setSelectedSkillIds((prev) => [...prev, existingMaster.id]);
                            }
                          } else if (isIndustry || role === "admin") {
                            if (!customSkills.includes(trimmed)) {
                              setCustomSkills((prev) => [...prev, trimmed]);
                            }
                          }
                          setSkillFilterText("");
                        }
                      }
                    }}
                  />
                  {skillFilterText && (
                    <button
                      type="button"
                      className="clear-skill-search"
                      onClick={() => setSkillFilterText("")}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Master Skills Selectable Grid & Custom Addition */}
                <div className="skill-selector-grid">
                  {masterSkills
                    .filter((sk) =>
                      sk.name.toLowerCase().includes(skillFilterText.toLowerCase())
                    )
                    .map((sk) => {
                      const isSelected = selectedSkillIds.includes(sk.id);
                      return (
                        <div
                          key={sk.id}
                          className={`skill-pill-select ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedSkillIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== sk.id)
                                : [...prev, sk.id]
                            );
                          }}
                        >
                          {isSelected ? <Check size={12} /> : <Plus size={12} />}
                          <span>{sk.name}</span>
                        </div>
                      );
                    })}

                  {skillFilterText.trim() &&
                    !masterSkills.some(
                      (s) => s.name.toLowerCase() === skillFilterText.trim().toLowerCase()
                    ) && (
                      <div
                        className="skill-pill-select custom-add-pill"
                        onClick={() => {
                          const trimmed = skillFilterText.trim();
                          if (trimmed && !customSkills.includes(trimmed)) {
                            setCustomSkills((prev) => [...prev, trimmed]);
                            setSkillFilterText("");
                          }
                        }}
                      >
                        <Plus size={12} />
                        <span>Add "{skillFilterText.trim()}" (Custom)</span>
                      </div>
                    )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="btn-primary-action" disabled={actionLoading}>
                  {actionLoading ? <Loader2 size={16} className="spin-icon" /> : <Plus size={16} />}
                  Publish Initiative
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE PARTICIPANTS MODAL */}
      {manageModalOpen && selectedCollab && (
        <div className="collab-modal-overlay" onClick={() => setManageModalOpen(false)}>
          <div className="collab-modal-content wide custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            <button className="collab-modal-close" onClick={() => setManageModalOpen(false)}>
              <X size={20} />
            </button>

            <h2>Manage Participants</h2>
            <p className="modal-subtitle">
              Review and update applicant statuses for <strong>{selectedCollab.title}</strong>
            </p>

            {participantsLoading ? (
              <div className="collab-loading-state">
                <Loader2 size={32} className="spin-icon" />
                <p>Loading participants...</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="collab-empty-state">
                <Users size={36} />
                <p>No applications submitted for this initiative yet.</p>
              </div>
            ) : (
              <div className="participants-table-container">
                <table className="collab-table">
                  <thead>
                    <tr>
                      <th>Participant Name</th>
                      <th>Role</th>
                      <th>Email / Contact</th>
                      <th>Academic Info</th>
                      <th>Applied On</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => (
                      <tr key={p.participant_id}>
                        <td>
                          <strong>{p.name}</strong>
                          {p.roll_number && <div className="sub-text">Roll: {p.roll_number}</div>}
                        </td>
                        <td>
                          <span className="role-tag">{p.role}</span>
                        </td>
                        <td>
                          <div>{p.email}</div>
                          {p.phone && <div className="sub-text">{p.phone}</div>}
                        </td>
                        <td>
                          {p.department || p.degree ? (
                            <div>
                              {p.department} {p.current_sem ? `(${p.current_sem})` : ""}
                              {p.cgpa ? <div className="sub-text">CGPA: {p.cgpa}</div> : ""}
                            </div>
                          ) : (
                            <span className="sub-text">N/A</span>
                          )}
                        </td>
                        <td>{new Date(p.applied_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-pill ${getStatusBadgeClass(p.status)}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-button-group">
                            {p.status !== "Accepted" && (
                              <button
                                className="btn-action-accept"
                                onClick={() => handleUpdateParticipantStatus(p.participant_id, "Accepted")}
                                title="Accept Participant"
                              >
                                Accept
                              </button>
                            )}

                            {p.status !== "Completed" && p.status === "Accepted" && (
                              <button
                                className="btn-action-complete"
                                onClick={() => handleUpdateParticipantStatus(p.participant_id, "Completed")}
                                title="Mark Completed"
                              >
                                Complete
                              </button>
                            )}

                            {p.status !== "Rejected" && (
                              <button
                                className="btn-action-reject"
                                onClick={() => handleUpdateParticipantStatus(p.participant_id, "Rejected")}
                                title="Reject Participant"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CollaborationsPage;
