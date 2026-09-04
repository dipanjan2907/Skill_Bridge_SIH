import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Edit,
  Trash2,
  FileQuestion,
  Award,
  BarChart3,
  X,
  Sparkles,
  Send,
  Building2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";

interface QuestionItem {
  id: number;
  skill_id: number;
  skill_name: string;
  skill_category: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  difficulty: "Easy" | "Medium" | "Hard";
  explanation: string;
  source_type: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

interface SkillOption {
  id: number;
  name: string;
  category?: string;
}

interface IndustryStats {
  total_questions: number;
  approved: number;
  pending: number;
  rejected: number;
  total_student_attempts: number;
  avg_student_accuracy: number;
}

export const IndustryQuestionManagement: React.FC = () => {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [stats, setStats] = useState<IndustryStats>({
    total_questions: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    total_student_attempts: 0,
    avg_student_accuracy: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [statusTab, setStatusTab] = useState<string>("all");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    skill_id: "",
    question: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A" as "A" | "B" | "C" | "D",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard",
    explanation: "",
  });

  // Skill Request Form State
  const [skillReqData, setSkillReqData] = useState({
    skill_name: "",
    category: "Technical",
    reason: "",
  });

  const fetchQuestionsAndSkills = async () => {
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch user submitted questions
      const resQ = await fetch(`${API_BASE_URL}/assessment/questions/my`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const dataQ = await resQ.json();
      if (resQ.ok && dataQ.success) {
        setQuestions(dataQ.questions || []);
      }

      // 2. Fetch master skills list
      const resS = await fetch(`${API_BASE_URL}/skills`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const dataS = await resS.json();
      if (resS.ok && Array.isArray(dataS)) {
        setSkills(dataS);
      } else if (resS.ok && dataS.skills) {
        setSkills(dataS.skills);
      }

      // 3. Fetch industry stats
      const resStats = await fetch(`${API_BASE_URL}/assessment/stats/industry`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const dataStats = await resStats.json();
      if (resStats.ok && dataStats.success) {
        setStats(dataStats.stats);
      }
    } catch (err: any) {
      console.error("Error loading question data:", err);
      setErrorMsg("Failed to load your submitted question bank.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsAndSkills();
  }, [token]);

  const handleOpenSubmitModal = (itemToEdit?: QuestionItem) => {
    if (itemToEdit) {
      setEditingQuestion(itemToEdit);
      setFormData({
        skill_id: String(itemToEdit.skill_id),
        question: itemToEdit.question,
        option_a: itemToEdit.option_a,
        option_b: itemToEdit.option_b,
        option_c: itemToEdit.option_c,
        option_d: itemToEdit.option_d,
        correct_option: itemToEdit.correct_option,
        difficulty: itemToEdit.difficulty,
        explanation: itemToEdit.explanation,
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        skill_id: skills.length > 0 ? String(skills[0].id) : "",
        question: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_option: "A",
        difficulty: "Medium",
        explanation: "",
      });
    }
    setIsSubmitModalOpen(true);
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    if (!formData.skill_id) {
      setErrorMsg("Please select a valid skill.");
      return;
    }
    if (formData.question.trim().length < 5) {
      setErrorMsg("Question text must be at least 5 characters long.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      skill_id: parseInt(formData.skill_id, 10),
      question: formData.question.trim(),
      option_a: formData.option_a.trim(),
      option_b: formData.option_b.trim(),
      option_c: formData.option_c.trim(),
      option_d: formData.option_d.trim(),
      correct_option: formData.correct_option,
      difficulty: formData.difficulty,
      explanation: formData.explanation.trim(),
    };

    try {
      const url = editingQuestion
        ? `${API_BASE_URL}/assessment/questions/${editingQuestion.id}`
        : `${API_BASE_URL}/assessment/questions`;
      const method = editingQuestion ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg(result.message || "Question submitted for Admin moderation.");
        setTimeout(() => setSuccessMsg(null), 4000);
        setIsSubmitModalOpen(false);
        fetchQuestionsAndSkills();
      } else {
        setErrorMsg(result.message || "Failed to save assessment question.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while submitting question.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/assessment/questions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMsg("Question deleted successfully.");
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchQuestionsAndSkills();
      } else {
        setErrorMsg(result.message || "Failed to delete question.");
      }
    } catch (err: any) {
      setErrorMsg("Network error deleting question.");
    }
  };

  const handleSkillRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken) return;

    if (!skillReqData.skill_name.trim()) {
      setErrorMsg("Skill name is required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/assessment/skills/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(skillReqData),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setSuccessMsg(result.message || "Skill request submitted to Admin.");
        setTimeout(() => setSuccessMsg(null), 4000);
        setIsSkillModalOpen(false);
        setSkillReqData({ skill_name: "", category: "Technical", reason: "" });
      } else {
        setErrorMsg(result.message || "Failed to request skill.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error submitting skill request.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filteredQuestions = questions.filter((q) => {
    const matchesTab = statusTab === "all" || q.status === statusTab;
    const matchesSkill =
      selectedSkillFilter === "all" || String(q.skill_id) === selectedSkillFilter;
    const qText = q.question.toLowerCase();
    const sName = (q.skill_name || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = !search || qText.includes(search) || sName.includes(search);
    return matchesTab && matchesSkill && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/50 border border-indigo-500/20 backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
              <Building2 size={16} /> Industry Assessment Management
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Shared Assessment Question Bank
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl mt-1">
              Contribute high-quality, industry-validated questions to SkillBridge's shared skill bank.
              Submitted questions are moderated by Administrators before entering randomized student assessments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSkillModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles size={15} className="text-amber-400" />
              <span>Request New Skill</span>
            </button>

            <button
              onClick={() => handleOpenSubmitModal()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle size={16} />
              <span>Submit New Question</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Counter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Contributed</span>
            <FileQuestion size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats.total_questions}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Approved & Live</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{stats.approved}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pending Review</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{stats.pending}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Rejected</span>
            <XCircle size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">{stats.rejected}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Student Attempts</span>
            <Award size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2">{stats.total_student_attempts}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Student Accuracy</span>
            <BarChart3 size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{stats.avg_student_accuracy}%</div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {["all", "pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusTab === tab
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "all" ? "All Questions" : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search question text or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/70 border border-slate-700/60 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-800/70 border border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-slate-300">
            <Filter size={12} className="text-slate-400" />
            <select
              value={selectedSkillFilter}
              onChange={(e) => setSelectedSkillFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Skills</option>
              {skills.map((s) => (
                <option key={s.id} value={String(s.id)} className="bg-slate-900 text-slate-200">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Question Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-slate-900/40 rounded-xl border border-slate-800/60">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mb-3" />
          <p>Loading assessment questions...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800/60 text-slate-400 space-y-3">
          <HelpCircle size={40} className="mx-auto text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-300">No Questions Found</h3>
          <p className="text-xs max-w-md mx-auto">
            {searchTerm || statusTab !== "all" || selectedSkillFilter !== "all"
              ? "No assessment questions match your active filters."
              : "You haven't contributed any assessment questions yet. Start building your company's question bank today!"}
          </p>
          <button
            onClick={() => handleOpenSubmitModal()}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            <PlusCircle size={14} /> Submit Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl bg-slate-900/70 border backdrop-blur-md transition-all ${
                item.status === "approved"
                  ? "border-emerald-500/30 hover:border-emerald-500/50"
                  : item.status === "rejected"
                  ? "border-rose-500/30 hover:border-rose-500/50"
                  : "border-amber-500/30 hover:border-amber-500/50"
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium">
                    {item.skill_name}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      item.difficulty === "Easy"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : item.difficulty === "Hard"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {item.difficulty}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 border ${
                      item.status === "approved"
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : item.status === "rejected"
                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {item.status === "approved" && <CheckCircle2 size={12} />}
                    {item.status === "pending" && <Clock size={12} />}
                    {item.status === "rejected" && <XCircle size={12} />}
                    <span className="capitalize">{item.status}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  {item.status !== "approved" && (
                    <>
                      <button
                        onClick={() => handleOpenSubmitModal(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit question"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  {item.status === "approved" && (
                    <button
                      onClick={() => handleOpenSubmitModal(item)}
                      className="px-2.5 py-1 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title="Editing an approved question will submit it for Admin re-moderation"
                    >
                      <Edit size={12} /> Edit (Re-submit)
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="py-3">
                <p className="text-sm font-semibold text-slate-100 leading-relaxed">
                  {item.question}
                </p>

                {/* Options grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {[
                    { key: "A", text: item.option_a },
                    { key: "B", text: item.option_b },
                    { key: "C", text: item.option_c },
                    { key: "D", text: item.option_d },
                  ].map((opt) => (
                    <div
                      key={opt.key}
                      className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                        item.correct_option === opt.key
                          ? "bg-emerald-950/40 text-emerald-200 border-emerald-500/40 font-medium"
                          : "bg-slate-800/40 text-slate-300 border-slate-700/40"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full text-center leading-5 text-[10px] font-bold shrink-0 ${
                          item.correct_option === opt.key
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="truncate">{opt.text}</span>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                {item.explanation && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300">
                    <span className="font-semibold text-indigo-300">Explanation: </span>
                    {item.explanation}
                  </div>
                )}

                {/* Rejection notice if rejected */}
                {item.status === "rejected" && item.rejection_reason && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                    <div className="font-semibold flex items-center gap-1.5 text-rose-400 mb-1">
                      <AlertCircle size={14} /> Admin Rejection Reason:
                    </div>
                    <p>{item.rejection_reason}</p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Click "Edit" above to update the question based on feedback and re-submit it for review.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit / Edit Question Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileQuestion size={16} />
              {editingQuestion ? "Edit Assessment Question" : "Submit Assessment Question"}
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              {editingQuestion ? "Update Question Details" : "Add Question to Skill Bank"}
            </h3>

            <form onSubmit={handleQuestionSubmit} className="space-y-4 text-xs">
              {/* Skill & Difficulty Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Skill *</label>
                  <select
                    value={formData.skill_id}
                    onChange={(e) => setFormData({ ...formData, skill_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="" disabled>Select target skill</option>
                    {skills.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name} ({s.category || "Technical"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Difficulty Level *</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value as any })
                    }
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Question Text *</label>
                <textarea
                  rows={3}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="Enter clear, concise question prompt..."
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Options grid */}
              <div className="space-y-3">
                <label className="block text-slate-300 font-medium">Multiple Choice Options *</label>
                {[
                  { key: "A", keyName: "option_a", val: formData.option_a },
                  { key: "B", keyName: "option_b", val: formData.option_b },
                  { key: "C", keyName: "option_c", val: formData.option_c },
                  { key: "D", keyName: "option_d", val: formData.option_d },
                ].map((opt) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, correct_option: opt.key as any })
                      }
                      className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                        formData.correct_option === opt.key
                          ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                      title={`Mark Option ${opt.key} as correct answer`}
                    >
                      {opt.key}
                    </button>
                    <input
                      type="text"
                      placeholder={`Option ${opt.key} text...`}
                      value={opt.val}
                      onChange={(e) =>
                        setFormData({ ...formData, [opt.keyName]: e.target.value })
                      }
                      className={`flex-1 p-2.5 bg-slate-800 border rounded-xl text-slate-200 focus:outline-none ${
                        formData.correct_option === opt.key
                          ? "border-emerald-500/60"
                          : "border-slate-700 focus:border-indigo-500"
                      }`}
                      required
                    />
                  </div>
                ))}
                <p className="text-[11px] text-slate-400">
                  Click on letter badge (A, B, C, or D) to select the correct answer. Selected:{" "}
                  <strong className="text-emerald-400">Option {formData.correct_option}</strong>
                </p>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Answer Explanation *</label>
                <textarea
                  rows={2}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Provide detailed explanation to guide students after submission..."
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{submitting ? "Saving..." : editingQuestion ? "Update & Resubmit" : "Submit for Moderation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Skill Request Modal */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
            <button
              onClick={() => setIsSkillModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles size={16} /> Skill Request
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Request New Skill</h3>

            <form onSubmit={handleSkillRequestSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Skill Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js, Rust, Kubernetes..."
                  value={skillReqData.skill_name}
                  onChange={(e) => setSkillReqData({ ...skillReqData, skill_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Skill Category</label>
                <input
                  type="text"
                  placeholder="Technical / Soft Skills / Domain"
                  value={skillReqData.category}
                  onChange={(e) => setSkillReqData({ ...skillReqData, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Why is this skill needed for industry assessment?"
                  value={skillReqData.reason}
                  onChange={(e) => setSkillReqData({ ...skillReqData, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSkillModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{submitting ? "Submitting..." : "Submit Request"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndustryQuestionManagement;
