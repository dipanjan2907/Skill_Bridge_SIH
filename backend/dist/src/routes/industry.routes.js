import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireIndustry, requireVerifiedIndustry, } from "../middlewares/industry.middleware.js";
import { getProfile, createProfile, updateProfile, } from "../controllers/industry.controller.js";
import { createOpportunity, getIndustryOpportunities, getIndustryOpportunityById, updateOpportunity, deleteOpportunity, publishOpportunity, closeOpportunity, } from "../controllers/opportunity.controller.js";
const router = Router();
// Industry Profile Routes
router.get("/profile", authenticateToken, requireIndustry, getProfile);
router.post("/profile", authenticateToken, requireIndustry, createProfile);
router.put("/profile", authenticateToken, requireIndustry, updateProfile);
// Industry Opportunity Routes
router.get("/opportunities", authenticateToken, requireIndustry, getIndustryOpportunities);
router.get("/opportunities/:id", authenticateToken, requireIndustry, getIndustryOpportunityById);
router.post("/opportunities", authenticateToken, requireVerifiedIndustry, createOpportunity);
router.put("/opportunities/:id", authenticateToken, requireVerifiedIndustry, updateOpportunity);
router.delete("/opportunities/:id", authenticateToken, requireVerifiedIndustry, deleteOpportunity);
router.put("/opportunities/:id/publish", authenticateToken, requireVerifiedIndustry, publishOpportunity);
router.put("/opportunities/:id/close", authenticateToken, requireVerifiedIndustry, closeOpportunity);
export default router;
