import { Router } from "express";
import { getIndustryDemand, getSkillsToWatch } from "../controllers/dashboard.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /api/dashboard/industry-demand
router.get("/industry-demand", getIndustryDemand);

// GET /api/dashboard/skills-to-watch
router.get("/skills-to-watch", authenticateToken, getSkillsToWatch);

export default router;
