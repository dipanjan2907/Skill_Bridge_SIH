import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  FileText,
  MapPin,
  IndianRupee,
  Briefcase,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { StudentApplicationDetailModal } from "../../components/student/StudentApplicationDetailModal";

import { API_BASE_URL } from "../../config/api";

export const StudentApplicationsPage: React.FC = () => {
  const { token } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Detail Modal state
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    const authToken = token || localStorage.getItem("skillbridge_token");

    try {
      const res = await fetch(`${API_BASE_URL}/student/applications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load applications.");
      }

      setApplications(Array.isArray(data.applications) ? data.applications : []);
    } catch (err: any) {
      console.error("fetchApplications error:", err);
      setError(err.message || "Could not fetch your applications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === "all") return true;
    return app.status === statusFilter;
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "shortlisted":
        return (
          <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[11px] rounded-full uppercase tracking-wider">
            Shortlisted
          </span>
        );
      case "selected":
        return (
          <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] rounded-full uppercase tracking-wider">
            Selected 🎉
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-[11px] rounded-full uppercase tracking-wider">
            Not Selected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold text-[11px] rounded-full uppercase tracking-wider">
            Applied
          </span>
        );
    }
  };

  const formatStipend = (min: number | null, max: number | null, type: string) => {
    if (!min && !max) return "Disclosed on interview";
    const unit = type === "internship" ? "/month" : "/annum";
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${unit}`;
    if (min) return `From ₹${min.toLocaleString()} ${unit}`;
    if (max) return `Up to ₹${max.toLocaleString()} ${unit}`;
    return "Disclosed on interview";
  };

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* HEADER CARD */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
              <FileText size={28} />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Application Tracker
              </span>
              <h1 className="text-2xl font-bold text-slate-100 mt-0.5">
                My Applications
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Track real-time updates and review details of all your submitted applications.
              </p>
            </div>
          </div>
        </div>

        {/* STATUS FILTER TABS */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              onClick={() => setStatusFilter("all")}
            >
              All Applications ({applications.length})
            </button>

            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "applied"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              onClick={() => setStatusFilter("applied")}
            >
              Applied ({applications.filter((a) => a.status === "applied").length})
            </button>

            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "shortlisted"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              onClick={() => setStatusFilter("shortlisted")}
            >
              Shortlisted ({applications.filter((a) => a.status === "shortlisted").length})
            </button>

            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "selected"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              onClick={() => setStatusFilter("selected")}
            >
              Selected ({applications.filter((a) => a.status === "selected").length})
            </button>

            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "rejected"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              onClick={() => setStatusFilter("rejected")}
            >
              Rejected ({applications.filter((a) => a.status === "rejected").length})
            </button>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* APPLICATIONS GRID / LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
            <Loader2 className="animate-spin text-indigo-400" size={36} />
            <p className="text-slate-400 text-sm font-medium">Fetching your application history...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center px-4">
            <div className="p-4 bg-slate-800/50 rounded-2xl text-slate-500 mb-3">
              <Briefcase size={44} />
            </div>
            <h3 className="text-lg font-bold text-slate-200">No Applications Found</h3>
            <p className="text-slate-400 text-sm max-w-md mt-1">
              {statusFilter === "all"
                ? "You haven't submitted any job or internship applications yet."
                : `No applications found with status '${statusFilter}'.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* TOP HEADER */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                        {app.opportunity?.industry?.logo ? (
                          <img
                            src={app.opportunity.industry.logo}
                            alt={app.opportunity.industry.companyName}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          (app.opportunity?.industry?.companyName || "C").charAt(0).toUpperCase()
                        )}
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block">
                          {app.opportunity?.industry?.companyName || "Verified Partner"}
                        </span>
                        <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {app.opportunity?.title}
                        </h3>
                      </div>
                    </div>

                    {renderStatusBadge(app.status)}
                  </div>

                  {/* METRICS */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-indigo-400" />
                      {app.opportunity?.workMode}{" "}
                      {app.opportunity?.location ? `• ${app.opportunity.location}` : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IndianRupee size={13} className="text-emerald-400" />
                      {formatStipend(
                        app.opportunity?.stipendMin,
                        app.opportunity?.stipendMax,
                        app.opportunity?.type
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-amber-400" />
                      Applied: {new Date(app.appliedAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* FOOTER ACTION */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 uppercase font-medium">
                    ID #{app.id}
                  </span>

                  <button
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700/60 cursor-pointer"
                    onClick={() => {
                      setSelectedAppId(app.id);
                      setIsDetailOpen(true);
                    }}
                  >
                    <Eye size={14} /> View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DETAIL MODAL */}
        <StudentApplicationDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          applicationId={selectedAppId}
        />
      </div>
    </MainLayout>
  );
};

export default StudentApplicationsPage;
