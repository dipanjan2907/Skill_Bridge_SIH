import { Router } from "express";
import { authenticateToken, requireInstitution } from "../middlewares/auth.middleware.js";
import { getInstitutionDashboard, getPublicInstitutions, getInstitutionStudentsList, updateStudentVerificationByInstitution, } from "../controllers/institution.controller.js";
const router = Router();
// Public endpoint for account creation institution selection
router.get("/public", getPublicInstitutions);
// Protected endpoints for Institution users
router.get("/dashboard", authenticateToken, requireInstitution, getInstitutionDashboard);
router.get("/students", authenticateToken, requireInstitution, getInstitutionStudentsList);
router.put("/students/:studentId/verification", authenticateToken, requireInstitution, updateStudentVerificationByInstitution);
export default router;
