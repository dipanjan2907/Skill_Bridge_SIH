import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import {
  getAssessmentQuestions,
  getSingleAssessmentQuestion,
  submitAssessment,
  getMyQuestions,
  createContributorQuestion,
  updateContributorQuestion,
  deleteContributorQuestion,
  requestNewSkill,
  getIndustryQuestionAnalytics,
  getAdminAssessmentQuestions,
  getQuestionBankSkillSummary,
  updateSkillTargetQuestions,
  approveQuestion,
  rejectQuestion,
  getSkillRequests,
  approveSkillRequest,
  rejectSkillRequest,
} from "../controllers/assessment.controller.js";

const router = Router();

// ==========================================
// STUDENT ASSESSMENT ENDPOINTS
// ==========================================
router.get("/assessments/questions", getAssessmentQuestions);
router.get("/assessments/questions/:skillId", getAssessmentQuestions);
router.get("/assessments/question/:id", getSingleAssessmentQuestion);
router.post("/assessments/submit", authenticateToken, submitAssessment);

// ==========================================
// CONTRIBUTOR (INDUSTRY / FACULTY) ENDPOINTS
// ==========================================
router.get("/assessment/questions/my", authenticateToken, getMyQuestions);
router.post("/assessment/questions", authenticateToken, createContributorQuestion);
router.put("/assessment/questions/:id", authenticateToken, updateContributorQuestion);
router.delete("/assessment/questions/:id", authenticateToken, deleteContributorQuestion);

router.post("/assessment/skills/request", authenticateToken, requestNewSkill);
router.get("/assessment/stats/industry", authenticateToken, getIndustryQuestionAnalytics);

// ==========================================
// ADMIN MODERATION ENDPOINTS
// ==========================================
router.get("/admin/assessment/questions/skill-summary", authenticateToken, requireAdmin, getQuestionBankSkillSummary);
router.put("/admin/assessment/skills/:id/target-questions", authenticateToken, requireAdmin, updateSkillTargetQuestions);
router.get("/admin/assessment/questions", authenticateToken, requireAdmin, getAdminAssessmentQuestions);
router.put("/admin/assessment/questions/:id/approve", authenticateToken, requireAdmin, approveQuestion);
router.put("/admin/assessment/questions/:id/reject", authenticateToken, requireAdmin, rejectQuestion);
router.put("/admin/assessment/questions/:id", authenticateToken, requireAdmin, updateContributorQuestion);
router.delete("/admin/assessment/questions/:id", authenticateToken, requireAdmin, deleteContributorQuestion);

router.get("/admin/skill-requests", authenticateToken, requireAdmin, getSkillRequests);
router.put("/admin/skill-requests/:id/approve", authenticateToken, requireAdmin, approveSkillRequest);
router.put("/admin/skill-requests/:id/reject", authenticateToken, requireAdmin, rejectSkillRequest);

export default router;
