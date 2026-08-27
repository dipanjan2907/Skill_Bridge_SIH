import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  getAssessmentQuestions,
  getSingleAssessmentQuestion,
  submitAssessment,
} from "../controllers/assessment.controller.js";

const router = Router();

// Endpoint to fetch assessment questions for a skill (without correct options or explanations)
router.get("/assessments/questions", getAssessmentQuestions);
router.get("/assessments/questions/:skillId", getAssessmentQuestions);

// Endpoint to fetch a single question (without correct option or explanation)
router.get("/assessments/question/:id", getSingleAssessmentQuestion);

// Endpoint to submit and evaluate assessment answers server-side
router.post("/assessments/submit", authenticateToken, submitAssessment);

export default router;
