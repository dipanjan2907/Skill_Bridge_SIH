import { Router } from "express";
import { authenticateToken, requireStudent } from "../middlewares/auth.middleware.js";
import { getOpportunityMatch, getRecommendedOpportunities, } from "../controllers/matching.controller.js";
const router = Router();
// Student-only protected routes for skill matching & recommendations
router.get("/student/opportunities/recommended", authenticateToken, requireStudent, getRecommendedOpportunities);
router.get("/student/opportunities/:opportunityId/match", authenticateToken, requireStudent, getOpportunityMatch);
export default router;
