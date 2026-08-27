import { Router } from "express";
import { getStudentProfile, updateStudentProfile, getInstitutions, } from "../controllers/profile.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
const router = Router();
router.get("/profile", authenticateToken, getStudentProfile);
router.put("/profile", authenticateToken, updateStudentProfile);
router.get("/institutions", getInstitutions);
export default router;
