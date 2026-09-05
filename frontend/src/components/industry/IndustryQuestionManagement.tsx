import React, { useState, useEffect, useRef } from "react";
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
  Upload,
  Download,
  FileText,
  ArrowLeft,
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

type BulkQuestion = {
  clientId: string;
  skill_id: string;
  skill: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  difficulty: string;
  explanation: string;
  errors: string[];
};

const QUESTION_TEMPLATE = `QUESTION:
What is the purpose of TypeScript?

SKILL:
TypeScript

A:
To replace JavaScript

B:
To add static typing to JavaScript

C:
To replace HTML

D:
To replace CSS

ANSWER:
B

DIFFICULTY:
Medium

EXPLANATION:
TypeScript adds static typing and additional features to JavaScript.

QUESTION:
Which React hook stores local component state?

SKILL:
React

A:
useEffect

B:
useMemo

C:
useState

D:
useContext

ANSWER:
C

DIFFICULTY:
Easy

EXPLANATION:
useState creates and updates state held by a function component.`;

const normalize = (value: string) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

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
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<"input" | "review">("input");
  const [bulkText, setBulkText] = useState("");
  const [bulkQuestions, setBulkQuestions] = useState<BulkQuestion[]>([]);
  const [bulkEditId, setBulkEditId] = useState<string | null>(null);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(
    null,
  );
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
      const resStats = await fetch(
        `${API_BASE_URL}/assessment/stats/industry`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
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

  const validateBulkQuestion = (
    item: Omit<BulkQuestion, "errors">,
    allItems: Omit<BulkQuestion, "errors">[] = [],
  ): BulkQuestion => {
    const errors: string[] = [];
    const normSkill = normalize(item.skill);
    let matchingSkill = skills.find(
      (skill) => normalize(skill.name) === normSkill,
    );
    if (!matchingSkill && normSkill) {
      matchingSkill = skills.find((skill) => {
        const sNorm = normalize(skill.name);
        return sNorm.includes(normSkill) || normSkill.includes(sNorm);
      });
    }
    // If still no skill matched, fallback to active skill filter or first available skill
    if (!matchingSkill && skills.length > 0) {
      if (selectedSkillFilter !== "all") {
        matchingSkill = skills.find(
          (s) => String(s.id) === selectedSkillFilter,
        );
      }
      if (!matchingSkill) {
        matchingSkill = skills[0];
      }
    }

    if (!item.question?.trim()) errors.push("Question is required.");
    if (!matchingSkill)
      errors.push(`Please select a valid skill for this question.`);
    if (!item.option_a?.trim()) errors.push("Option A is required.");
    if (!item.option_b?.trim()) errors.push("Option B is required.");
    if (!item.option_c?.trim()) errors.push("Option C is required.");
    if (!item.option_d?.trim()) errors.push("Option D is required.");

    const correctOption = ["A", "B", "C", "D"].includes(
      item.correct_option?.trim().toUpperCase(),
    )
      ? item.correct_option.trim().toUpperCase()
      : "A";

    let difficulty = item.difficulty?.trim() || "Medium";
    difficulty =
      difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    if (!["Easy", "Medium", "Hard"].includes(difficulty)) difficulty = "Medium";

    const explanation =
      item.explanation && item.explanation.trim().length >= 5
        ? item.explanation.trim()
        : item.question?.trim()
          ? `Explanation for: ${item.question.trim()}`
          : "No detailed explanation provided.";

    const duplicate = allItems.some(
      (other) =>
        other.clientId !== item.clientId &&
        normalize(other.skill || matchingSkill?.name || "") ===
          normalize(item.skill || matchingSkill?.name || "") &&
        normalize(other.question) === normalize(item.question),
    );
    if (item.question?.trim() && duplicate)
      errors.push("This is a duplicate question in the current import batch.");

    return {
      ...item,
      skill: matchingSkill ? matchingSkill.name : item.skill,
      skill_id: matchingSkill
        ? String(matchingSkill.id)
        : skills[0]
          ? String(skills[0].id)
          : "1",
      correct_option: correctOption,
      difficulty,
      explanation,
      errors,
    };
  };

  const parseBulkText = () => {
    setBulkError(null);
    if (!bulkText.trim())
      return setBulkError(
        "Paste question content or upload a supported text file before parsing.",
      );
    if (bulkText.length > 50_000)
      return setBulkError(
        `Import limit exceeded. Your input has ${bulkText.length.toLocaleString()} characters; the maximum is 50,000.`,
      );

    // Split by QUESTION / Q1 / Q / numbered headers
    let rawBlocks = bulkText.split(
      /(?:^|\n)\s*(?:[#*`\->\d.\s]*(?:\bQUESTION|\bQ\d+|\bQ\b)\s*[:.\-]\s*)/im,
    );
    if (rawBlocks.length <= 1) {
      rawBlocks = bulkText.split(/(?:^|\n)\s*(?:\d+[\.\)]\s+)/im);
    }
    const blocks = rawBlocks.slice(1);
    if (!blocks.length)
      return setBulkError(
        "No question blocks were found. Make sure questions start with 'QUESTION:' or '1.' format.",
      );
    if (blocks.length > 100)
      return setBulkError(
        `Import limit exceeded. ${blocks.length} questions were detected; the maximum is 100.`,
      );

    const labelPattern =
      /(?:^|\n)\s*(?:[#*`\->\s]*)(SKILL|TARGET SKILL|OPTION\s*[ABCD]|[ABCD]|CORRECT\s*ANSWER|CORRECT\s*OPTION|CORRECT|ANSWER|ANS|DIFFICULTY\s*LEVEL|DIFFICULTY|EXPLANATION|EXPLAIN|RATIONALE)(?:[#*`\s]*)\s*[:.\)\-]\s*/gim;
    const cleanVal = (val: string) =>
      val.replace(/^[\s#*`\->]+|[\s#*`]+$/g, "").trim();

    const parsed = blocks.map((block, index) => {
      const matches = [...block.matchAll(labelPattern)];
      const fields: Record<string, string> = {
        QUESTION: cleanVal(block.slice(0, matches[0]?.index ?? block.length)),
      };
      matches.forEach((match, matchIndex) => {
        const rawKey = match[1].toUpperCase().replace(/\s+/g, " ");
        let key = rawKey;
        if (rawKey.includes("SKILL")) key = "SKILL";
        else if (rawKey === "OPTION A" || rawKey === "A") key = "A";
        else if (rawKey === "OPTION B" || rawKey === "B") key = "B";
        else if (rawKey === "OPTION C" || rawKey === "C") key = "C";
        else if (rawKey === "OPTION D" || rawKey === "D") key = "D";
        else if (
          rawKey.includes("ANSWER") ||
          rawKey.includes("CORRECT") ||
          rawKey === "ANS"
        )
          key = "ANSWER";
        else if (rawKey.includes("DIFFICULTY")) key = "DIFFICULTY";
        else if (
          rawKey.includes("EXPLANATION") ||
          rawKey.includes("EXPLAIN") ||
          rawKey.includes("RATIONALE")
        )
          key = "EXPLANATION";

        const start = (match.index ?? 0) + match[0].length;
        const end = matches[matchIndex + 1]?.index ?? block.length;
        fields[key] = cleanVal(block.slice(start, end));
      });

      let diff = fields.DIFFICULTY || "Medium";
      if (diff)
        diff = diff.charAt(0).toUpperCase() + diff.slice(1).toLowerCase();
      if (!["Easy", "Medium", "Hard"].includes(diff)) diff = "Medium";

      let ans = fields.ANSWER || "";
      const ansMatch = ans.match(/\b([ABCD])\b/i) || ans.match(/([ABCD])/i);
      if (ansMatch) {
        ans = ansMatch[1].toUpperCase();
      } else if (ans.trim()) {
        const normAns = normalize(ans);
        if (normAns === normalize(fields.A || "")) ans = "A";
        else if (normAns === normalize(fields.B || "")) ans = "B";
        else if (normAns === normalize(fields.C || "")) ans = "C";
        else if (normAns === normalize(fields.D || "")) ans = "D";
      }
      if (!["A", "B", "C", "D"].includes(ans)) ans = "A";

      const defaultSkillName =
        (selectedSkillFilter !== "all"
          ? skills.find((s) => String(s.id) === selectedSkillFilter)?.name
          : null) ||
        skills[0]?.name ||
        "General";

      return {
        clientId: `${Date.now()}-${index}`,
        skill_id: "",
        skill: fields.SKILL || defaultSkillName,
        question: fields.QUESTION || "",
        option_a: fields.A || "Option A",
        option_b: fields.B || "Option B",
        option_c: fields.C || "Option C",
        option_d: fields.D || "Option D",
        correct_option: ans,
        difficulty: diff,
        explanation: fields.EXPLANATION || "",
      };
    });
    setBulkQuestions(parsed.map((item) => validateBulkQuestion(item, parsed)));
    setBulkStep("review");
  };

  const openBulkImport = () => {
    setBulkError(null);
    setBulkText("");
    setBulkQuestions([]);
    setBulkEditId(null);
    setBulkStep("input");
    setIsBulkModalOpen(true);
  };

  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([QUESTION_TEMPLATE], { type: "text/plain" }),
    );
    link.download = "skillbridge-question-import-template.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["txt", "md", "markdown"].includes(extension))
      return setBulkError("Only .txt, .md, and .markdown files are supported.");
    if (file.size > 55_000)
      return setBulkError(
        "File is too large. Keep imported content within 50,000 characters.",
      );
    const text = await file.text();
    if (text.length > 50_000)
      return setBulkError(
        `Import limit exceeded. Your file contains ${text.length.toLocaleString()} characters; the maximum is 50,000.`,
      );
    setBulkError(null);
    setBulkText(text);
  };

  const saveBulkEdit = (item: BulkQuestion) => {
    const rawItems = bulkQuestions.map((question) =>
      question.clientId === item.clientId
        ? { ...item, errors: undefined }
        : { ...question, errors: undefined },
    );
    setBulkQuestions(
      rawItems.map((question) => validateBulkQuestion(question, rawItems)),
    );
    setBulkEditId(null);
  };

  const submitBulkImport = async () => {
    if (bulkQuestions.length === 0)
      return setBulkError("No questions found in this import batch.");
    if (bulkQuestions.some((question) => question.errors.length))
      return setBulkError(
        "Please fix or remove invalid questions before submitting.",
      );
    if (
      !window.confirm(
        `Ready to submit ${bulkQuestions.length} question${bulkQuestions.length === 1 ? "" : "s"}? They will be submitted for Admin moderation.`,
      )
    )
      return;
    const authToken = token || localStorage.getItem("skillbridge_token");
    if (!authToken)
      return setBulkError(
        "Your authentication session has expired. Please log in again.",
      );

    setBulkSubmitting(true);
    setBulkError(null);
    try {
      const payloadQuestions = bulkQuestions.map((q) => {
        let sid = parseInt(q.skill_id, 10);
        if (isNaN(sid) || sid <= 0) {
          const match = skills.find(
            (s) => normalize(s.name) === normalize(q.skill),
          );
          sid = match ? match.id : skills[0]?.id || 1;
        }
        return {
          skill_id: sid,
          question: q.question.trim(),
          option_a: q.option_a.trim() || "Option A",
          option_b: q.option_b.trim() || "Option B",
          option_c: q.option_c.trim() || "Option C",
          option_d: q.option_d.trim() || "Option D",
          correct_option: ["A", "B", "C", "D"].includes(q.correct_option)
            ? q.correct_option
            : "A",
          difficulty: ["Easy", "Medium", "Hard"].includes(q.difficulty)
            ? q.difficulty
            : "Medium",
          explanation:
            q.explanation && q.explanation.trim().length >= 5
              ? q.explanation.trim()
              : q.question.trim()
                ? `Explanation for: ${q.question.trim()}`
                : "No detailed explanation provided.",
        };
      });

      const res1 = await fetch(
        `${API_BASE_URL}/assessment/questions/bulkimport`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ questions: payloadQuestions }),
        },
      );
      const result1 = await res1.json();
      if (!res1.ok || !result1.success)
        return setBulkError(
          result1.message || "Import failed. No questions were added.",
        );
      setSuccessMsg(result1.message || "Questions imported successfully.");
      setTimeout(() => setSuccessMsg(null), 5000);
      setIsBulkModalOpen(false);
      fetchQuestionsAndSkills();
    } catch (err: any) {
      setBulkError(err?.message || "Network error while importing questions.");
    } finally {
      setBulkSubmitting(false);
    }
  };

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
        setSuccessMsg(
          result.message || "Question submitted for Admin moderation.",
        );
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
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;

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
      selectedSkillFilter === "all" ||
      String(q.skill_id) === selectedSkillFilter;
    const qText = q.question.toLowerCase();
    const sName = (q.skill_name || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !search || qText.includes(search) || sName.includes(search);
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
              Contribute high-quality, industry-validated questions to
              SkillBridge's shared skill bank. Submitted questions are moderated
              by Administrators before entering randomized student assessments.
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
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <PlusCircle size={16} />
              <span>Add Manually</span>
            </button>
            <button
              onClick={openBulkImport}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Upload size={15} />
              <span>Bulk Import</span>
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
          <div className="text-2xl font-bold text-white mt-2">
            {stats.total_questions}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Approved & Live</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {stats.approved}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pending Review</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {stats.pending}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Rejected</span>
            <XCircle size={16} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {stats.rejected}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Student Attempts</span>
            <Award size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2">
            {stats.total_student_attempts}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Student Accuracy</span>
            <BarChart3 size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">
            {stats.avg_student_accuracy}%
          </div>
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
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
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
              <option value="all" className="bg-slate-900 text-slate-200">
                All Skills
              </option>
              {skills.map((s) => (
                <option
                  key={s.id}
                  value={String(s.id)}
                  className="bg-slate-900 text-slate-200"
                >
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
          <h3 className="text-lg font-semibold text-slate-300">
            No Questions Found
          </h3>
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
                    <span className="font-semibold text-indigo-300">
                      Explanation:{" "}
                    </span>
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
                      Click "Edit" above to update the question based on
                      feedback and re-submit it for review.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk import stays entirely in local state until final submission. */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm overflow-y-auto p-4">
          <div className="max-w-5xl mx-auto my-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 md:p-7">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
                  Assessment questions
                </p>
                <h3 className="text-xl font-bold text-white">
                  {bulkStep === "input" ? "Bulk Import" : "Review & Import"}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Questions are not saved until you submit the final import.
                </p>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            {bulkError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm flex gap-2">
                <AlertCircle size={17} className="shrink-0" />
                {bulkError}
              </div>
            )}
            {bulkStep === "input" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      Paste structured text or upload a text file
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supported: .txt, .md, .markdown. Maximum 50,000 characters
                      and 100 questions.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadTemplate}
                      className="px-3 py-2 text-xs rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"
                    >
                      <Download size={14} />
                      Download Question Template
                    </button>
                    <button
                      onClick={() => uploadInputRef.current?.click()}
                      className="px-3 py-2 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center gap-1.5"
                    >
                      <Upload size={14} />
                      Upload TXT/MD
                    </button>
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept=".txt,.md,.markdown,text/plain,text/markdown"
                      className="hidden"
                      onChange={(event) => {
                        handleUpload(event.target.files?.[0]);
                        event.currentTarget.value = "";
                      }}
                    />
                  </div>
                </div>
                <textarea
                  value={bulkText}
                  onChange={(event) => {
                    setBulkText(event.target.value);
                    setBulkError(null);
                  }}
                  rows={18}
                  placeholder={QUESTION_TEMPLATE}
                  className="w-full resize-y p-4 text-sm font-mono bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>
                    Characters:{" "}
                    <b
                      className={
                        bulkText.length > 50_000
                          ? "text-rose-400"
                          : "text-slate-200"
                      }
                    >
                      {bulkText.length.toLocaleString()} / 50,000
                    </b>
                  </span>
                  <span>
                    Questions detected:{" "}
                    <b
                      className={
                        (bulkText.match(/^\s*QUESTION\s*:/gim) || []).length >
                        100
                          ? "text-rose-400"
                          : "text-slate-200"
                      }
                    >
                      {(bulkText.match(/^\s*QUESTION\s*:/gim) || []).length} /
                      100
                    </b>
                  </span>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={parseBulkText}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Parse Questions
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {(() => {
                  const valid = bulkQuestions.filter(
                    (q) => !q.errors.length,
                  ).length;
                  const summary = bulkQuestions.reduce<Record<string, number>>(
                    (acc, q) => {
                      const name = q.skill.trim() || "Unspecified skill";
                      acc[name] = (acc[name] || 0) + 1;
                      return acc;
                    },
                    {},
                  );
                  return (
                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-white">
                            Import Summary
                          </h4>
                          <p className="text-sm text-slate-300 mt-1">
                            Total Questions: {bulkQuestions.length} ·{" "}
                            <span className="text-emerald-400">
                              ✓ Valid: {valid}
                            </span>{" "}
                            ·{" "}
                            <span className="text-amber-400">
                              ⚠ Needs Correction: {bulkQuestions.length - valid}
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => setBulkStep("input")}
                          className="text-xs text-indigo-300 hover:text-white flex items-center gap-1"
                        >
                          <ArrowLeft size={14} />
                          Back to input
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(summary)
                          .sort((a, b) => b[1] - a[1])
                          .map(([skill, count]) => (
                            <span
                              key={skill}
                              className="px-2 py-1 rounded bg-slate-700 text-xs text-slate-200"
                            >
                              {skill}: {count}
                            </span>
                          ))}
                      </div>
                    </div>
                  );
                })()}
                {bulkQuestions.map((item, index) => (
                  <div
                    key={item.clientId}
                    className={`p-4 rounded-xl border ${item.errors.length ? "border-amber-500/50 bg-amber-950/10" : "border-emerald-500/25 bg-slate-800/40"}`}
                  >
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">
                          Question #{index + 1} ·{" "}
                          <span className="text-indigo-300">
                            {item.skill || "No skill"}
                          </span>{" "}
                          · {item.difficulty || "No difficulty"}
                        </p>
                        <p className="font-semibold text-slate-100 mt-1 whitespace-pre-wrap">
                          {item.question || "Missing question"}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => setBulkEditId(item.clientId)}
                          className="text-xs text-indigo-300 hover:text-white"
                        >
                          <Edit size={14} className="inline mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove Question #${index + 1} from this import batch?`,
                              )
                            )
                              setBulkQuestions((current) =>
                                current.filter(
                                  (q) => q.clientId !== item.clientId,
                                ),
                              );
                          }}
                          className="text-xs text-rose-300 hover:text-white"
                        >
                          <Trash2 size={14} className="inline mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 mt-3">
                      {[
                        ["A", item.option_a],
                        ["B", item.option_b],
                        ["C", item.option_c],
                        ["D", item.option_d],
                      ].map(([letter, value]) => (
                        <p
                          key={letter}
                          className={
                            item.correct_option === letter
                              ? "text-emerald-300"
                              : ""
                          }
                        >
                          <b>{letter}.</b> {value || "—"}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-3">
                      <b className="text-slate-300">Answer:</b>{" "}
                      {item.correct_option || "—"} ·{" "}
                      <b className="text-slate-300">Explanation:</b>{" "}
                      {item.explanation || "—"}
                    </p>
                    {item.errors.length ? (
                      <ul className="mt-3 text-xs text-amber-200 list-disc list-inside">
                        {item.errors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-xs text-emerald-300">✓ Valid</p>
                    )}
                  </div>
                ))}
                <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
                  <button
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-4 py-2 text-sm text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={
                      bulkSubmitting ||
                      bulkQuestions.length === 0 ||
                      bulkQuestions.some((q) => q.errors.length)
                    }
                    onClick={submitBulkImport}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-sm"
                  >
                    {bulkSubmitting
                      ? "Importing..."
                      : `Import ${bulkQuestions.length} Question${bulkQuestions.length === 1 ? "" : "s"}`}
                  </button>
                </div>
              </div>
            )}
          </div>
          {bulkEditId &&
            (() => {
              const item = bulkQuestions.find((q) => q.clientId === bulkEditId);
              if (!item) return null;
              return (
                <BulkEditModal
                  item={item}
                  skills={skills}
                  onCancel={() => setBulkEditId(null)}
                  onSave={saveBulkEdit}
                />
              );
            })()}
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
              {editingQuestion
                ? "Edit Assessment Question"
                : "Submit Assessment Question"}
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              {editingQuestion
                ? "Update Question Details"
                : "Add Question to Skill Bank"}
            </h3>

            <form onSubmit={handleQuestionSubmit} className="space-y-4 text-xs">
              {/* Skill & Difficulty Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Target Skill *
                  </label>
                  <select
                    value={formData.skill_id}
                    onChange={(e) =>
                      setFormData({ ...formData, skill_id: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none"
                    required
                  >
                    <option value="" disabled>
                      Select target skill
                    </option>
                    {skills.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name} ({s.category || "Technical"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Difficulty Level *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficulty: e.target.value as any,
                      })
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
                <label className="block text-slate-300 font-medium mb-1">
                  Question Text *
                </label>
                <textarea
                  rows={3}
                  value={formData.question}
                  onChange={(e) =>
                    setFormData({ ...formData, question: e.target.value })
                  }
                  placeholder="Enter clear, concise question prompt..."
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Options grid */}
              <div className="space-y-3">
                <label className="block text-slate-300 font-medium">
                  Multiple Choice Options *
                </label>
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
                        setFormData({
                          ...formData,
                          correct_option: opt.key as any,
                        })
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
                        setFormData({
                          ...formData,
                          [opt.keyName]: e.target.value,
                        })
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
                  Click on letter badge (A, B, C, or D) to select the correct
                  answer. Selected:{" "}
                  <strong className="text-emerald-400">
                    Option {formData.correct_option}
                  </strong>
                </p>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Answer Explanation *
                </label>
                <textarea
                  rows={2}
                  value={formData.explanation}
                  onChange={(e) =>
                    setFormData({ ...formData, explanation: e.target.value })
                  }
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
                  <span>
                    {submitting
                      ? "Saving..."
                      : editingQuestion
                        ? "Update & Resubmit"
                        : "Submit for Moderation"}
                  </span>
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
            <h3 className="text-lg font-bold text-white mb-3">
              Request New Skill
            </h3>

            <form
              onSubmit={handleSkillRequestSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Skill Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next.js, Rust, Kubernetes..."
                  value={skillReqData.skill_name}
                  onChange={(e) =>
                    setSkillReqData({
                      ...skillReqData,
                      skill_name: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Skill Category
                </label>
                <input
                  type="text"
                  placeholder="Technical / Soft Skills / Domain"
                  value={skillReqData.category}
                  onChange={(e) =>
                    setSkillReqData({
                      ...skillReqData,
                      category: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Reason / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Why is this skill needed for industry assessment?"
                  value={skillReqData.reason}
                  onChange={(e) =>
                    setSkillReqData({ ...skillReqData, reason: e.target.value })
                  }
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

const BulkEditModal: React.FC<{
  item: BulkQuestion;
  skills: SkillOption[];
  onCancel: () => void;
  onSave: (item: BulkQuestion) => void;
}> = ({ item, skills, onCancel, onSave }) => {
  const [draft, setDraft] = useState(item);
  const update = (key: keyof BulkQuestion, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-3"
      >
        <div className="flex justify-between">
          <h4 className="font-bold text-white">Edit Imported Question</h4>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <label className="block text-xs text-slate-300">
          Target Skill
          <select
            value={draft.skill}
            onChange={(event) => update("skill", event.target.value)}
            className="mt-1 w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
          >
            <option value="">Select a skill</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.name}>
                {skill.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-slate-300">
          Difficulty
          <select
            value={draft.difficulty}
            onChange={(event) => update("difficulty", event.target.value)}
            className="mt-1 w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
          >
            <option value="">Select difficulty</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </label>
        <label className="block text-xs text-slate-300">
          Question
          <textarea
            required
            value={draft.question}
            onChange={(event) => update("question", event.target.value)}
            rows={3}
            className="mt-1 w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
          />
        </label>
        {(["a", "b", "c", "d"] as const).map((letter) => (
          <label key={letter} className="block text-xs text-slate-300">
            Option {letter.toUpperCase()}
            <input
              required
              value={draft[`option_${letter}`]}
              onChange={(event) =>
                update(`option_${letter}`, event.target.value)
              }
              className="mt-1 w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
            />
          </label>
        ))}
        <label className="block text-xs text-slate-300">
          Correct Answer
          <select
            value={draft.correct_option}
            onChange={(event) => update("correct_option", event.target.value)}
            className="mt-1 w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
          >
            <option value="">Select answer</option>
            {["A", "B", "C", "D"].map((letter) => (
              <option key={letter}>{letter}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-slate-300">
          Explanation
          <textarea
            required
            value={draft.explanation}
            onChange={(event) => update("explanation", event.target.value)}
            rows={3}
            className="mt-1 w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-100"
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
          >
            Save & Revalidate
          </button>
        </div>
      </form>
    </div>
  );
};

export default IndustryQuestionManagement;
