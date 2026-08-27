import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { getAllMasterSkills, getStudentSkills, addStudentSkill, updateStudentSkill, deleteStudentSkill, } from "../controllers/skills.controller.js";
const router = Router();
// Master Skills endpoint
router.get("/skills", getAllMasterSkills);
// Student Skills endpoints
router.get("/student/skills", authenticateToken, getStudentSkills);
router.post("/student/skills", authenticateToken, addStudentSkill);
router.put("/student/skills/:id", authenticateToken, updateStudentSkill);
router.delete("/student/skills/:id", authenticateToken, deleteStudentSkill);
export default router;
