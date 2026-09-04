import React, { useEffect, useState } from "react";
import {
  FileText,
  UploadCloud,
  FileCheck,
  Eye,
  Download,
  Trash2,
  Plus,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Edit,
  Loader2,
  FileUp,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

interface ResumeData {
  id: number;
  student_id: number;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

interface CertificateData {
  id: number;
  student_id: number;
  title: string;
  issuer: string;
  issue_date?: string | null;
  issue_year?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  verification_status: "pending" | "verified" | "rejected";
  created_at?: string;
  updated_at?: string;
}

interface DigitalDocumentsManagerProps {
  token: string | null;
  onProfileUpdated?: () => void;
}

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (_e) {
    return dateStr;
  }
};

export const DigitalDocumentsManager: React.FC<
  DigitalDocumentsManagerProps
> = ({ token, onProfileUpdated }) => {
  // Resume state
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [resumeLoading, setResumeLoading] = useState(true);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeSuccess, setResumeSuccess] = useState<string | null>(null);

  // Certificates state
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [certsLoading, setCertsLoading] = useState(true);
  const [certsError, setCertsError] = useState<string | null>(null);

  // Modals & form state
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificateData | null>(null);
  const [certFormLoading, setCertFormLoading] = useState(false);
  const [certFormError, setCertFormError] = useState<string | null>(null);
  const [certFormSuccess, setCertFormSuccess] = useState<string | null>(null);

  // Certificate form values
  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certIssueDate, setCertIssueDate] = useState("");
  const [certCredentialId, setCertCredentialId] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    title: string;
    fileName: string;
  } | null>(null);

  const fetchResume = async () => {
    if (!token) return;
    setResumeLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/student/resume`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setResume(data.resume || null);
      } else {
        console.error("Fetch resume error:", data.error);
      }
    } catch (err: any) {
      console.error("Fetch resume network error:", err);
    } finally {
      setResumeLoading(false);
    }
  };

  const fetchCertificates = async () => {
    if (!token) return;
    setCertsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/student/certificates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCertificates(data.certificates || []);
      } else {
        setCertsError(data.error || "Failed to load certificates");
      }
    } catch (err: any) {
      setCertsError(`Network error: ${err.message}`);
    } finally {
      setCertsLoading(false);
    }
  };

  useEffect(() => {
    fetchResume();
    fetchCertificates();
  }, [token]);

  // Handle Resume Upload
  const handleResumeFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setResumeError(null);
    setResumeSuccess(null);

    // Validation
    const allowedExts = [".pdf", ".doc", ".docx"];
    const fileName = file.name.toLowerCase();
    const isValid = allowedExts.some((ext) => fileName.endsWith(ext));
    if (!isValid) {
      setResumeError(
        "Invalid resume format. Only PDF, DOC, and DOCX files are allowed.",
      );
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setResumeError("File size exceeds 3MB limit.");
      return;
    }

    setResumeUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const method = resume ? "PUT" : "POST";
      const res = await fetch(`${API_BASE_URL}/student/resume`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResume(data.resume);
        setResumeSuccess("Resume updated successfully!");
        if (onProfileUpdated) onProfileUpdated();
      } else {
        setResumeError(data.error || "Failed to upload resume.");
      }
    } catch (err: any) {
      setResumeError(`Upload error: ${err.message}`);
    } finally {
      setResumeUploading(false);
      e.target.value = "";
    }
  };

  // Handle Delete Resume
  const handleDeleteResume = async () => {
    if (
      !token ||
      !window.confirm("Are you sure you want to delete your active resume?")
    )
      return;

    setResumeUploading(true);
    setResumeError(null);
    setResumeSuccess(null);

    try {
      const res = await fetch(`${API_BASE_URL}/student/resume`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setResume(null);
        setResumeSuccess("Resume removed successfully.");
        if (onProfileUpdated) onProfileUpdated();
      } else {
        setResumeError(data.error || "Failed to delete resume.");
      }
    } catch (err: any) {
      setResumeError(`Delete error: ${err.message}`);
    } finally {
      setResumeUploading(false);
    }
  };

  // Open Add Certificate Modal
  const openAddCertModal = () => {
    setEditingCert(null);
    setCertTitle("");
    setCertIssuer("");
    setCertIssueDate("");
    setCertCredentialId("");
    setCertFile(null);
    setCertFormError(null);
    setCertFormSuccess(null);
    setShowAddCertModal(true);
  };

  // Open Edit Certificate Modal
  const openEditCertModal = (cert: CertificateData) => {
    setEditingCert(cert);
    setCertTitle(cert.title);
    setCertIssuer(cert.issuer);
    setCertIssueDate(cert.issue_date ? cert.issue_date.split("T")[0] : "");
    setCertCredentialId(cert.credential_id || "");
    setCertFile(null);
    setCertFormError(null);
    setCertFormSuccess(null);
    setShowAddCertModal(true);
  };

  // Submit Certificate Form (Add or Edit)
  const handleSubmitCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!certTitle.trim()) {
      setCertFormError("Certificate title is required.");
      return;
    }
    if (!certIssuer.trim()) {
      setCertFormError("Issuing organization is required.");
      return;
    }
    if (certFile && certFile.size > 7 * 1024 * 1024) {
      setCertFormError("Certificate file size exceeds 7MB limit.");
      return;
    }

    setCertFormLoading(true);
    setCertFormError(null);

    const formData = new FormData();
    formData.append("title", certTitle.trim());
    formData.append("issuer", certIssuer.trim());
    if (certIssueDate) formData.append("issueDate", certIssueDate);
    if (certCredentialId)
      formData.append("credentialId", certCredentialId.trim());
    if (certFile) formData.append("file", certFile);

    try {
      const url = editingCert
        ? `${API_BASE_URL}/student/certificates/${editingCert.id}`
        : `${API_BASE_URL}/student/certificates`;
      const method = editingCert ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setCertFormSuccess(
          editingCert
            ? "Certificate updated successfully!"
            : "Certificate added successfully!",
        );
        setTimeout(() => {
          setShowAddCertModal(false);
          fetchCertificates();
          if (onProfileUpdated) onProfileUpdated();
        }, 600);
      } else {
        setCertFormError(data.error || "Failed to save certificate.");
      }
    } catch (err: any) {
      setCertFormError(`Error: ${err.message}`);
    } finally {
      setCertFormLoading(false);
    }
  };

  // Delete Certificate
  const handleDeleteCertificate = async (id: number) => {
    if (
      !token ||
      !window.confirm("Are you sure you want to delete this certificate?")
    )
      return;

    try {
      const res = await fetch(`${API_BASE_URL}/student/certificates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        fetchCertificates();
        if (onProfileUpdated) onProfileUpdated();
      } else {
        alert(data.error || "Failed to delete certificate.");
      }
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div
      className="digital-documents-container"
      style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
    >
      {/* SECTION 1: RESUME MANAGEMENT */}
      <div
        className="document-card"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-xl)",
          padding: "1.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FileText size={22} className="text-primary" />
              Digital Resume / CV
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.88rem",
                marginTop: "0.2rem",
              }}
            >
              Manage your active student resume used for automated application
              submissions and recruiter matching.
            </p>
          </div>

          <div>
            <label
              className="btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: resumeUploading ? "not-allowed" : "pointer",
                padding: "0.6rem 1.25rem",
                borderRadius: "var(--radius-md)",
                opacity: resumeUploading ? 0.7 : 1,
              }}
            >
              {resumeUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UploadCloud size={16} />
              )}
              {resume ? "Replace Resume" : "Upload Resume"}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
                disabled={resumeUploading}
                onChange={handleResumeFileChange}
              />
            </label>
          </div>
        </div>

        {resumeError && (
          <div className="auth-alert error" style={{ marginBottom: "1rem" }}>
            <AlertCircle size={15} />
            {resumeError}
          </div>
        )}

        {resumeSuccess && (
          <div className="auth-alert success" style={{ marginBottom: "1rem" }}>
            <CheckCircle2 size={15} />
            {resumeSuccess}
          </div>
        )}

        {resumeLoading ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <Loader2
              size={24}
              className="animate-spin"
              style={{ margin: "0 auto 0.5rem" }}
            />
            <p style={{ fontSize: "0.88rem" }}>
              Loading active resume status...
            </p>
          </div>
        ) : resume ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1.25rem",
              background: "var(--bg-app)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--primary-light)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                {resume.file_type.includes("pdf") ? "PDF" : "DOC"}
              </div>

              <div>
                <h4
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "var(--text-primary)",
                  }}
                >
                  {resume.file_name}
                </h4>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginTop: "0.25rem",
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>{formatFileSize(resume.file_size)}</span>
                  <span>•</span>
                  <span>Uploaded {formatDate(resume.uploaded_at)}</span>
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const viewUrl = `${API_BASE_URL}/student/resume/view?token=${token}`;
                  const isWordDoc = resume.file_name.toLowerCase().endsWith(".doc") || resume.file_name.toLowerCase().endsWith(".docx");
                  if (isWordDoc) {
                    window.open(viewUrl, "_blank");
                  } else {
                    setPreviewDoc({
                      url: viewUrl,
                      title: "Active Student Resume",
                      fileName: resume.file_name,
                    });
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 0.9rem",
                  fontSize: "0.85rem",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                }}
              >
                <Eye size={14} /> View Document
              </button>

              <a
                href={`${API_BASE_URL}/student/resume/download?token=${token}`}
                download={resume.file_name}
                className="btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 0.9rem",
                  fontSize: "0.85rem",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                }}
              >
                <Download size={14} /> Download
              </a>

              <button
                type="button"
                className="btn-icon"
                onClick={handleDeleteResume}
                title="Delete Resume"
                style={{
                  width: "34px",
                  height: "34px",
                  color: "#ef4444",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem 1rem",
              background: "var(--bg-app)",
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--border-color)",
            }}
          >
            <FileUp
              size={36}
              style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}
            />
            <p
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              No active resume uploaded yet
            </p>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.82rem",
                marginTop: "0.25rem",
              }}
            >
              Upload your PDF, DOC, or DOCX resume (Max 3MB) to share with
              employers.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: ACADEMIC & PROFESSIONAL CERTIFICATES */}
      <div
        className="document-card"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-xl)",
          padding: "1.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Award size={22} className="text-primary" />
              Verified Certificates & Credentials
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.88rem",
                marginTop: "0.2rem",
              }}
            >
              Upload and manage your institutional degrees, online course
              certifications, and licenses.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={openAddCertModal}
          >
            <Plus size={16} /> Add New Certificate
          </button>
        </div>

        {certsError && (
          <div className="auth-alert error" style={{ marginBottom: "1rem" }}>
            <AlertCircle size={15} />
            {certsError}
          </div>
        )}

        {certsLoading ? (
          <div
            style={{
              padding: "2rem",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <Loader2
              size={24}
              className="animate-spin"
              style={{ margin: "0 auto 0.5rem" }}
            />
            <p style={{ fontSize: "0.88rem" }}>
              Loading certificate portfolio...
            </p>
          </div>
        ) : certificates.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2.5rem 1rem",
              background: "var(--bg-app)",
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--border-color)",
            }}
          >
            <Award
              size={36}
              style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}
            />
            <p
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              No certifications recorded in your profile
            </p>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.82rem",
                marginTop: "0.25rem",
              }}
            >
              Click "Add New Certificate" above to upload your credentials and
              get institution verification.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {certificates.map((cert) => {
              const statusColor =
                cert.verification_status === "verified"
                  ? "#10b981"
                  : cert.verification_status === "rejected"
                    ? "#ef4444"
                    : "#f59e0b";

              const statusIcon =
                cert.verification_status === "verified" ? (
                  <CheckCircle2 size={13} />
                ) : cert.verification_status === "rejected" ? (
                  <AlertCircle size={13} />
                ) : (
                  <Clock size={13} />
                );

              return (
                <div
                  key={cert.id}
                  style={{
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        marginBottom: "0.6rem",
                      }}
                    >
                      <h4
                        style={{
                          fontWeight: 700,
                          fontSize: "1.05rem",
                          color: "var(--text-primary)",
                          lineHeight: 1.3,
                        }}
                      >
                        {cert.title}
                      </h4>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "0.25rem 0.6rem",
                          borderRadius: "9999px",
                          background: `${statusColor}18`,
                          color: statusColor,
                          border: `1px solid ${statusColor}40`,
                          textTransform: "capitalize",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusIcon}
                        {cert.verification_status}
                      </span>
                    </div>

                    <p
                      style={{
                        color: "var(--primary-color)",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        marginBottom: "0.4rem",
                      }}
                    >
                      {cert.issuer}
                    </p>

                    {(cert.issue_date || cert.issue_year) && (
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.82rem",
                        }}
                      >
                        Issued: {formatDate(cert.issue_date) || cert.issue_year}
                      </p>
                    )}

                    {cert.credential_id && (
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.8rem",
                          marginTop: "0.2rem",
                          wordBreak: "break-all",
                        }}
                      >
                        Credential ID: <code>{cert.credential_id}</code>
                      </p>
                    )}

                    {cert.file_name && (
                      <div
                        style={{
                          marginTop: "0.75rem",
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          background: "var(--bg-card)",
                          padding: "0.4rem 0.6rem",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <FileCheck size={14} className="text-primary" />
                        <span
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cert.file_name}
                        </span>
                        <span>({formatFileSize(cert.file_size)})</span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid var(--border-color)",
                    }}
                  >
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      {cert.credential_url && (
                        <>
                          <button
                            type="button"
                            className="project-link-btn"
                            onClick={() => {
                              const viewUrl = `${API_BASE_URL}/student/certificates/${cert.id}/view?token=${token}`;
                              const fileName = cert.file_name || cert.title;
                              const isWordDoc = fileName.toLowerCase().endsWith(".doc") || fileName.toLowerCase().endsWith(".docx");
                              if (isWordDoc) {
                                window.open(viewUrl, "_blank");
                              } else {
                                setPreviewDoc({
                                  url: viewUrl,
                                  title: cert.title,
                                  fileName,
                                });
                              }
                            }}
                            style={{
                              fontSize: "0.8rem",
                              padding: "0.35rem 0.65rem",
                              cursor: "pointer",
                            }}
                          >
                            <Eye size={12} /> View
                          </button>

                          <a
                            href={`${API_BASE_URL}/student/certificates/${cert.id}/download?token=${token}`}
                            download={cert.file_name || "certificate"}
                            className="project-link-btn"
                            style={{
                              fontSize: "0.8rem",
                              padding: "0.35rem 0.65rem",
                              textDecoration: "none",
                            }}
                          >
                            <Download size={12} /> Download
                          </a>
                        </>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => openEditCertModal(cert)}
                        title="Edit Certificate"
                        style={{
                          width: "30px",
                          height: "30px",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleDeleteCertificate(cert.id)}
                        title="Delete Certificate"
                        style={{
                          width: "30px",
                          height: "30px",
                          color: "#ef4444",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT CERTIFICATE MODAL */}
      {showAddCertModal && (
        <div className="github-modal-overlay">
          <div className="github-modal-card" style={{ maxWidth: "540px" }}>
            <div className="github-modal-header">
              <h3>
                <Award size={18} className="text-primary" />
                {editingCert ? "Edit Certificate Entry" : "Add New Certificate"}
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowAddCertModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitCertificate}>
              <div className="github-modal-body">
                {certFormError && (
                  <div className="auth-alert error" style={{ margin: 0 }}>
                    <AlertCircle size={15} />
                    {certFormError}
                  </div>
                )}

                {certFormSuccess && (
                  <div className="auth-alert success" style={{ margin: 0 }}>
                    <CheckCircle2 size={15} />
                    {certFormSuccess}
                  </div>
                )}

                <div className="form-group">
                  <label>Certificate / Degree Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Certified Solutions Architect or B.Tech CS"
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Issuing Organization / Institution *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon Web Services, Coursera, IIT Kharagpur"
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Issue Date</label>
                    <input
                      type="date"
                      value={certIssueDate}
                      onChange={(e) => setCertIssueDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Credential ID / Serial No.</label>
                    <input
                      type="text"
                      placeholder="e.g. AWS-98234-XYZ"
                      value={certCredentialId}
                      onChange={(e) => setCertCredentialId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Attach Certificate File (PDF / Image)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                    style={{
                      padding: "0.6rem",
                      background: "var(--bg-app)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-primary)",
                      fontSize: "0.85rem",
                    }}
                  />
                  <small
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.78rem",
                      marginTop: "0.3rem",
                    }}
                  >
                    Supported formats: PDF, JPG, PNG (Max 7MB).
                    {editingCert?.credential_url &&
                      " Leave blank to keep existing file."}
                  </small>
                </div>
              </div>

              <div className="github-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddCertModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={certFormLoading}
                >
                  {certFormLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {editingCert ? "Update Certificate" : "Save Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INLINE DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="github-modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="github-modal-card"
            style={{
              maxWidth: "920px",
              width: "95%",
              height: "88vh",
              display: "flex",
              flexDirection: "column",
              padding: 0,
              overflow: "hidden",
            }}
          >
            <div
              className="github-modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--border-color)",
                background: "var(--bg-card)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <FileText size={20} className="text-primary" />
                <div>
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      margin: 0,
                      color: "var(--text-primary)",
                    }}
                  >
                    {previewDoc.title}
                  </h3>
                  <small
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.78rem",
                    }}
                  >
                    {previewDoc.fileName}
                  </small>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.8rem",
                    borderRadius: "var(--radius-md)",
                    textDecoration: "none",
                  }}
                >
                  Open in New Tab ↗
                </a>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setPreviewDoc(null)}
                  title="Close Preview"
                  style={{
                    width: "32px",
                    height: "32px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              style={{
                flex: 1,
                background: "var(--bg-app)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <iframe
                src={previewDoc.url}
                title={previewDoc.title}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
