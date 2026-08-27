import { Router } from "express";
import { getIndustryDemand, getSkillsToWatch } from "../controllers/dashboard.controller.js";
const router = Router();
// GET /api/dashboard/industry-demand
router.get("/industry-demand", getIndustryDemand);
// GET /api/dashboard/skills-to-watch
router.get("/skills-to-watch", getSkillsToWatch);
export default router;
