import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles,
  Building2,
  GraduationCap,
  MapPin,
  Calendar,
  IndianRupee,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import type {
  Opportunity,
  OpportunityType,
  MasterSkill,
  CreateOpportunityPayload,
} from "../../types/opportunity";

interface OpportunityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  opportunityToEdit?: Opportunity | null;
  masterSkills: MasterSkill[];
  token: string | null;
}

import { API_BASE_URL } from "../../config/api";

export const OpportunityFormModal: React.FC<OpportunityFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  opportunityToEdit,
  masterSkills,
  token,
}) => {
  const [targetAudience, setTargetAudience] = useState<"STUDENT" | "ACADEMICIAN" | "BOTH">("STUDENT");
  const [type, setType] = useState<OpportunityType>("internship");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("On-site");
  const [stipendMin, setStipendMin] = useState<string>("");
  const [stipendMax, setStipendMax] = useState<string>("");
  const [duration, setDuration] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");

  // Required skills state
  const [requiredSkills, setRequiredSkills] = useState<
    { skillId?: number; skillName: string; requiredProficiency: number }[]
  >([]);
  const [selectedSkillId, setSelectedSkillId] = useState<number | "">("");
  const [customSkillName, setCustomSkillName] = useState<string>("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [proficiencyScore, setProficiencyScore] = useState<number>(70);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opportunityToEdit) {
      setTargetAudience(opportunityToEdit.target_audience || "STUDENT");
      setType(opportunityToEdit.type || "internship");
      setTitle(opportunityToEdit.title || "");
      setDescription(opportunityToEdit.description || "");
      setLocation(opportunityToEdit.location || "");
      setWorkMode(opportunityToEdit.work_mode || "On-site");
      setStipendMin(
        opportunityToEdit.stipend_min !== null ? String(opportunityToEdit.stipend_min) : ""
      );
      setStipendMax(
        opportunityToEdit.stipend_max !== null ? String(opportunityToEdit.stipend_max) : ""
      );
      setDuration(opportunityToEdit.duration || "");
      setEligibility(opportunityToEdit.eligibility || "");
      setApplicationDeadline(
        opportunityToEdit.application_deadline
          ? opportunityToEdit.application_deadline.split("T")[0]
          : ""
      );

      if (opportunityToEdit.requiredSkills && Array.isArray(opportunityToEdit.requiredSkills)) {
        setRequiredSkills(
          opportunityToEdit.requiredSkills.map((s) => ({
            skillId: s.skill_id,
            skillName: s.skill_name || `Skill #${s.skill_id}`,
            requiredProficiency: s.required_proficiency,
          }))
        );
      } else {
        setRequiredSkills([]);
      }
    } else {
      // Reset form
      setTargetAudience("STUDENT");
      setType("internship");
      setTitle("");
      setDescription("");
      setLocation("");
      setWorkMode("On-site");
      setStipendMin("");
      setStipendMax("");
      setDuration("");
      setEligibility("");
      setApplicationDeadline("");
      setRequiredSkills([]);
    }
    setError(null);
  }, [opportunityToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (!selectedSkillId) return;
    const skillObj = masterSkills.find((s) => s.id === Number(selectedSkillId));
    if (!skillObj) return;

    if (requiredSkills.some((s) => s.skillId === skillObj.id)) {
      setError(`Skill "${skillObj.name}" has already been added.`);
      return;
    }

    setRequiredSkills((prev) => [
      ...prev,
      {
        skillId: skillObj.id,
        skillName: skillObj.name,
        requiredProficiency: Math.min(100, Math.max(0, proficiencyScore)),
      },
    ]);
    setSelectedSkillId("");
    setError(null);
  };

  const handleCreateCustomSkill = async () => {
    if (!customSkillName.trim()) return;
    const name = customSkillName.trim();

    if (requiredSkills.some((s) => s.skillName.toLowerCase() === name.toLowerCase())) {
      setError(`Skill "${name}" has already been added.`);
      return;
    }

    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      const res = await fetch(`${API_BASE_URL}/skills`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, category: "Technical" }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.skill) {
        setRequiredSkills((prev) => [
          ...prev,
          {
            skillId: data.skill.id,
            skillName: data.skill.name,
            requiredProficiency: Math.min(100, Math.max(0, proficiencyScore)),
          },
        ]);
        setCustomSkillName("");
        setIsAddingCustom(false);
        setError(null);
      } else {
        setRequiredSkills((prev) => [
          ...prev,
          {
            skillName: name,
            requiredProficiency: Math.min(100, Math.max(0, proficiencyScore)),
          },
        ]);
        setCustomSkillName("");
        setIsAddingCustom(false);
        setError(null);
      }
    } catch (err: any) {
      console.error("Custom skill creation error:", err);
      setRequiredSkills((prev) => [
        ...prev,
        {
          skillName: name,
          requiredProficiency: Math.min(100, Math.max(0, proficiencyScore)),
        },
      ]);
      setCustomSkillName("");
      setIsAddingCustom(false);
      setError(null);
    }
  };

  const handleRemoveSkill = (indexToRemove: number) => {
    setRequiredSkills((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (targetStatus: "draft" | "published") => {
    if (!title.trim()) {
      setError("Opportunity Title is required.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError("Please provide a role description of at least 10 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload: CreateOpportunityPayload = {
      targetAudience,
      type,
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || undefined,
      workMode,
      stipendMin: stipendMin !== "" ? Number(stipendMin) : null,
      stipendMax: stipendMax !== "" ? Number(stipendMax) : null,
      duration: duration.trim() || undefined,
      eligibility: eligibility.trim() || undefined,
      applicationDeadline: applicationDeadline || undefined,
      status: targetStatus,
      requiredSkills: requiredSkills.map((s) => ({
        skillId: s.skillId,
        skillName: s.skillName,
        requiredProficiency: s.requiredProficiency,
      })),
    };

    try {
      const authToken = token || localStorage.getItem("skillbridge_token");
      const url = opportunityToEdit
        ? `${API_BASE_URL}/industry/opportunities/${opportunityToEdit.id}`
        : `${API_BASE_URL}/industry/opportunities`;

      const method = opportunityToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save opportunity.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Opportunity submit error:", err);
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {opportunityToEdit ? "Edit Opportunity Listing" : "Create New Opportunity"}
              </h2>
              <p className="text-xs text-slate-400">
                Configure candidate requirements, compensation, and minimum skill benchmarks.
              </p>
            </div>
          </div>
          <button
            className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2.5 shrink-0">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* MODAL SCROLLABLE BODY */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* TARGET AUDIENCE SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target Audience *
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950/60 border border-slate-800 rounded-xl">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  targetAudience === "STUDENT"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
                onClick={() => {
                  setTargetAudience("STUDENT");
                  if (
                    ![
                      "internship",
                      "job",
                      "project",
                      "apprenticeship",
                    ].includes(type)
                  ) {
                    setType("internship");
                  }
                }}
              >
                <GraduationCap size={15} />
                <span>Students</span>
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  targetAudience === "ACADEMICIAN"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
                onClick={() => {
                  setTargetAudience("ACADEMICIAN");
                  if (
                    ![
                      "faculty_internship",
                      "industrial_training",
                      "fdp",
                      "consultancy",
                      "research_collaboration",
                      "guest_lecture",
                    ].includes(type)
                  ) {
                    setType("faculty_internship");
                  }
                }}
              >
                <Building2 size={15} />
                <span>Academicians</span>
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  targetAudience === "BOTH"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
                onClick={() => setTargetAudience("BOTH")}
              >
                <Sparkles size={15} />
                <span>Both</span>
              </button>
            </div>
          </div>

          {/* TYPE SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Opportunity Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as OpportunityType)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
            >
              {(targetAudience === "STUDENT" || targetAudience === "BOTH") && (
                <optgroup label="Student Opportunities" className="bg-slate-900 text-slate-400">
                  <option value="internship" className="bg-slate-900 text-slate-100 py-2">
                    🎓 Student Internship
                  </option>
                  <option value="job" className="bg-slate-900 text-slate-100 py-2">
                    💼 Full-Time Job
                  </option>
                  <option value="project" className="bg-slate-900 text-slate-100 py-2">
                    💻 Industry Project
                  </option>
                  <option value="apprenticeship" className="bg-slate-900 text-slate-100 py-2">
                    🛠️ Apprenticeship
                  </option>
                </optgroup>
              )}

              {(targetAudience === "ACADEMICIAN" || targetAudience === "BOTH") && (
                <optgroup label="Academician & Faculty Opportunities" className="bg-slate-900 text-slate-400">
                  <option value="faculty_internship" className="bg-slate-900 text-slate-100 py-2">
                    👨‍🏫 Faculty Internship
                  </option>
                  <option value="industrial_training" className="bg-slate-900 text-slate-100 py-2">
                    🏭 Industrial Training for Faculty
                  </option>
                  <option value="fdp" className="bg-slate-900 text-slate-100 py-2">
                    📚 Faculty Development Program (FDP)
                  </option>
                  <option value="consultancy" className="bg-slate-900 text-slate-100 py-2">
                    💡 Industry Consultancy Project
                  </option>
                  <option value="research_collaboration" className="bg-slate-900 text-slate-100 py-2">
                    🔬 Joint Research Collaboration
                  </option>
                  <option value="guest_lecture" className="bg-slate-900 text-slate-100 py-2">
                    🎙️ Guest Lecture / Keynote Session
                  </option>
                </optgroup>
              )}
            </select>
          </div>

          {/* TITLE */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Opportunity Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer / Machine Learning Intern"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Role Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the role responsibilities, project goals, technology stack, and expectations..."
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none"
              required
            />
          </div>

          {/* WORK MODE & LOCATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={13} className="text-indigo-400" /> Work Mode *
              </label>
              {/* SELECT OPTION DARK MODE FIX */}
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
              >
                <option value="On-site" className="bg-slate-900 text-slate-100 py-2">
                  On-site
                </option>
                <option value="Remote" className="bg-slate-900 text-slate-100 py-2">
                  Remote
                </option>
                <option value="Hybrid" className="bg-slate-900 text-slate-100 py-2">
                  Hybrid
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Location / City
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bengaluru, KA or Remote"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* STIPEND / SALARY MIN & MAX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <IndianRupee size={13} className="text-emerald-400" />
                {type === "internship" ? "Stipend Min (₹/month)" : "Salary Min (₹/annum)"}
              </label>
              <input
                type="number"
                value={stipendMin}
                onChange={(e) => setStipendMin(e.target.value)}
                placeholder="e.g. 20000"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <IndianRupee size={13} className="text-emerald-400" />
                {type === "internship" ? "Stipend Max (₹/month)" : "Salary Max (₹/annum)"}
              </label>
              <input
                type="number"
                value={stipendMax}
                onChange={(e) => setStipendMax(e.target.value)}
                placeholder="e.g. 35000"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* DURATION & DEADLINE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Duration / Commitment
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 6 Months / Full-Time"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} className="text-amber-400" /> Application Deadline
              </label>
              <input
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* ELIGIBILITY */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Eligibility Criteria
            </label>
            <textarea
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              rows={2}
              placeholder="e.g. B.Tech / M.Tech in Computer Science or related fields, 2026/2027 batch"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none transition-all resize-none"
            />
          </div>

          {/* REQUIRED SKILLS BENCHMARKS SECTION */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={15} className="text-indigo-400" /> Required Skill Benchmarks
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select skills from master database or add custom skills required for candidates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingCustom(!isAddingCustom)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold transition-colors"
              >
                {isAddingCustom ? "← Select Master Skill" : "+ Create New Skill"}
              </button>
            </div>

            {!isAddingCustom ? (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* MASTER SKILL SELECTOR OPTION DARK MODE FIX */}
                <div className="sm:col-span-6 relative">
                  <select
                    value={selectedSkillId}
                    onChange={(e) =>
                      setSelectedSkillId(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 rounded-xl pl-3.5 pr-9 py-2.5 text-xs font-medium outline-none appearance-none cursor-pointer transition-all hover:border-slate-600 shadow-inner"
                  >
                    <option value="" className="bg-slate-900 text-slate-400 py-2">
                      -- Select Master Skill --
                    </option>
                    {masterSkills.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100 py-2 font-medium">
                        {s.name} • {s.category || "General"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                </div>

                {/* PROFICIENCY SLIDER */}
                <div className="sm:col-span-4 flex flex-col justify-center px-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-indigo-400 mb-1">
                    <span>Target Benchmark:</span>
                    <span className="bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300 font-bold">
                      {proficiencyScore}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={proficiencyScore}
                    onChange={(e) => setProficiencyScore(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* ADD BUTTON */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    disabled={!selectedSkillId}
                    className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                      selectedSkillId
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-indigo-950/20 p-3 border border-indigo-500/30 rounded-xl">
                {/* CUSTOM SKILL INPUT */}
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    value={customSkillName}
                    onChange={(e) => setCustomSkillName(e.target.value)}
                    placeholder="Enter new skill (e.g. Next.js, Rust, LLMOps)"
                    className="w-full bg-slate-900 border border-indigo-500/40 focus:border-indigo-400 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2 text-xs outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateCustomSkill();
                      }
                    }}
                  />
                </div>

                {/* PROFICIENCY SLIDER */}
                <div className="sm:col-span-4 flex flex-col justify-center px-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-indigo-400 mb-1">
                    <span>Target Benchmark:</span>
                    <span className="bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300 font-bold">
                      {proficiencyScore}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={proficiencyScore}
                    onChange={(e) => setProficiencyScore(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* CREATE & ADD BUTTON */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleCreateCustomSkill}
                    disabled={!customSkillName.trim()}
                    className={`w-full flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-semibold transition-all ${
                      customSkillName.trim()
                        ? "bg-pink-600 hover:bg-pink-500 text-white shadow-md cursor-pointer"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Plus size={14} /> Add Custom
                  </button>
                </div>
              </div>
            )}

            {/* CHIPS LIST */}
            <div className="pt-2 border-t border-slate-800/80">
              {requiredSkills.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No skill benchmarks added yet. Select a master skill or create a custom skill above.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.map((s, idx) => (
                    <div
                      key={s.skillId || `custom-${idx}`}
                      className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200"
                    >
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>{s.skillName}</span>
                      <span className="bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded text-[11px]">
                        ≥{s.requiredProficiency}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors ml-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <button
            type="button"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-semibold transition-all border border-slate-700/50 cursor-pointer"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              onClick={() => handleSubmit("draft")}
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Save Draft
            </button>

            <button
              type="button"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              onClick={() => handleSubmit("published")}
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Publish Opportunity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
