import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "../../components/layout/MainLayout";
import {
  Building2,
  Search,
  MapPin,
  Globe,
  Briefcase,
  Mail,
  Phone,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Filter,
  RotateCw,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";

interface PartnerCompany {
  id: number;
  companyName: string;
  companyType?: string | null;
  industrySector?: string | null;
  description?: string | null;
  website?: string | null;
  location?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  logo?: string | null;
  verificationStatus: string;
  activeOpportunitiesCount: number;
  opportunities?: Array<{
    id: number;
    title: string;
    type: string;
    location?: string | null;
    work_mode: string;
    stipend_min?: number | null;
    stipend_max?: number | null;
  }>;
}

const CompaniesPage: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<PartnerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState("all");
  const [selectedCompanyModal, setSelectedCompanyModal] = useState<PartnerCompany | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE_URL}/companies`;
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (selectedSector !== "all") params.append("sector", selectedSector);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load partner companies.");
      }

      setCompanies(Array.isArray(data.companies) ? data.companies : []);
    } catch (err: any) {
      console.error("fetchCompanies error:", err);
      setError(err.message || "Could not fetch company listings.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedSector]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Extract unique sectors from company list
  const sectors = Array.from(
    new Set(companies.map((c) => c.industrySector).filter(Boolean))
  ) as string[];

  return (
    <MainLayout showRightPanel={false}>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* HERO / HEADER CARD */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
                <Building2 size={32} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Industry Network & Directory
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mt-0.5">
                  Partner Companies & Employers
                </h1>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Connect with hiring partners, explore company profiles, and discover active internships & full-time career opportunities.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-center">
                <span className="text-xs text-slate-400 block font-medium">Verified Partners</span>
                <span className="text-lg font-bold text-indigo-400">
                  {companies.filter((c) => c.verificationStatus === "approved").length || companies.length}
                </span>
              </div>
              <div className="px-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-center">
                <span className="text-xs text-slate-400 block font-medium">Live Roles</span>
                <span className="text-lg font-bold text-emerald-400">
                  {companies.reduce((acc, c) => acc + (Number(c.activeOpportunitiesCount) || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTERS BAR */}
        <div className="bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies by name, location, or description..."
              className="w-full bg-slate-800/50 border border-slate-700/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/60 rounded-xl px-3 py-1.5">
              <Filter size={15} className="text-indigo-400" />
              <select
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  All Sectors
                </option>
                {sectors.map((sec) => (
                  <option key={sec} value={sec} className="bg-slate-900 text-slate-200">
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchCompanies}
              disabled={loading}
              className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-indigo-300 rounded-xl transition-all cursor-pointer"
              title="Refresh companies list"
            >
              <RotateCw size={16} className={loading ? "animate-spin text-indigo-400" : ""} />
            </button>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4">
            <Loader2 className="animate-spin text-indigo-400" size={36} />
            <p className="text-slate-400 text-sm font-medium">Loading partner company directory...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center px-4">
            <div className="p-4 bg-slate-800/50 rounded-2xl text-slate-500 mb-3">
              <Building2 size={44} />
            </div>
            <h3 className="text-lg font-bold text-slate-200">No Partner Companies Found</h3>
            <p className="text-slate-400 text-sm max-w-md mt-1">
              No registered industry partners matched your current search filters.
            </p>
          </div>
        ) : (
          /* COMPANY CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {companies.map((comp) => (
              <div
                key={comp.id}
                className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Header: Logo & Company Name */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg shrink-0">
                        {comp.logo ? (
                          <img
                            src={comp.logo}
                            alt={comp.companyName}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          (comp.companyName || "C").charAt(0).toUpperCase()
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {comp.companyName}
                          </h3>
                          {comp.verificationStatus === "approved" && (
                            <span title="Verified Employer">
                              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-indigo-400 font-medium">
                          {comp.industrySector || comp.companyType || "Technology Partner"}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-full text-[11px] font-bold shrink-0">
                      {comp.activeOpportunitiesCount} Live {Number(comp.activeOpportunitiesCount) === 1 ? "Role" : "Roles"}
                    </span>
                  </div>

                  {/* Location & Website bar */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                    {comp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-indigo-400" />
                        {comp.location}
                      </span>
                    )}
                    {comp.website && (
                      <a
                        href={comp.website.startsWith("http") ? comp.website : `https://${comp.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-indigo-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe size={13} /> Website <ExternalLink size={10} />
                      </a>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                    {comp.description || "Verified corporate partner looking for talented students to hire across various engineering and business domains."}
                  </p>

                  {/* Active Opportunities Preview */}
                  {comp.opportunities && comp.opportunities.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={11} className="text-indigo-400" /> Featured Active Postings:
                      </span>
                      <div className="space-y-1.5">
                        {comp.opportunities.slice(0, 2).map((opp) => (
                          <div
                            key={opp.id}
                            className="p-2 bg-slate-800/40 hover:bg-slate-800/70 rounded-lg border border-slate-700/40 flex items-center justify-between transition-colors cursor-pointer"
                            onClick={() => navigate("/opportunities")}
                          >
                            <div className="flex items-center gap-2">
                              <Briefcase size={13} className="text-indigo-400" />
                              <span className="text-xs font-medium text-slate-200 truncate max-w-[170px]">
                                {opp.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 uppercase">
                              {opp.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedCompanyModal(comp)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <Eye size={14} /> Full Company Profile
                  </button>

                  <button
                    onClick={() => navigate("/opportunities")}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer"
                  >
                    Explore Roles <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FULL COMPANY MODAL VIEW */}
        {selectedCompanyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl">
                    {selectedCompanyModal.logo ? (
                      <img
                        src={selectedCompanyModal.logo}
                        alt={selectedCompanyModal.companyName}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      (selectedCompanyModal.companyName || "C").charAt(0).toUpperCase()
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-100">
                        {selectedCompanyModal.companyName}
                      </h2>
                      {selectedCompanyModal.verificationStatus === "approved" && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Verified Employer
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-400 font-medium mt-0.5">
                      {selectedCompanyModal.industrySector || selectedCompanyModal.companyType || "Industry Corporate Partner"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCompanyModal(null)}
                  className="text-slate-400 hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Company Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {selectedCompanyModal.location && (
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                    <span className="text-slate-400 block mb-1 font-medium">Headquarters Location</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1">
                      <MapPin size={14} className="text-indigo-400" />
                      {selectedCompanyModal.location}
                    </span>
                  </div>
                )}

                {selectedCompanyModal.website && (
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                    <span className="text-slate-400 block mb-1 font-medium">Official Website</span>
                    <a
                      href={selectedCompanyModal.website.startsWith("http") ? selectedCompanyModal.website : `https://${selectedCompanyModal.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 font-bold flex items-center gap-1 hover:underline"
                    >
                      <Globe size={14} />
                      {selectedCompanyModal.website} <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                {selectedCompanyModal.contactEmail && (
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                    <span className="text-slate-400 block mb-1 font-medium">Contact Email</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1">
                      <Mail size={14} className="text-cyan-400" />
                      {selectedCompanyModal.contactEmail}
                    </span>
                  </div>
                )}

                {selectedCompanyModal.phone && (
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                    <span className="text-slate-400 block mb-1 font-medium">Contact Phone</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1">
                      <Phone size={14} className="text-emerald-400" />
                      {selectedCompanyModal.phone}
                    </span>
                  </div>
                )}
              </div>

              {/* Bio / Overview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Overview</h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  {selectedCompanyModal.description || "No detailed description provided by company admin."}
                </p>
              </div>

              {/* Posted Opportunities in Modal */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Published Opportunities ({selectedCompanyModal.opportunities?.length || 0})
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedCompanyModal(null);
                      navigate("/opportunities");
                    }}
                    className="text-xs font-semibold text-indigo-400 hover:underline"
                  >
                    View All in Discovery →
                  </button>
                </div>

                {selectedCompanyModal.opportunities && selectedCompanyModal.opportunities.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCompanyModal.opportunities.map((opp) => (
                      <div
                        key={opp.id}
                        className="p-3 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl border border-slate-700/40 flex items-center justify-between transition-all"
                      >
                        <div>
                          <h5 className="text-sm font-bold text-slate-100">{opp.title}</h5>
                          <span className="text-xs text-slate-400">
                            {opp.work_mode} {opp.location ? `• ${opp.location}` : ""}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedCompanyModal(null);
                            navigate("/opportunities");
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                        >
                          Apply / Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No live active job postings right now.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CompaniesPage;
