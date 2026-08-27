import { Router } from "express";
import { getSkills, createSkill } from "../controllers/skill.controller";
import { authenticateToken } from "../middleware/auth.middleware";
const router = Router();
router.get("/", getSkills);
router.post("/", authenticateToken, createSkill);
export default router;
