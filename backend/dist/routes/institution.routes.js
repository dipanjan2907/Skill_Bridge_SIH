import { Router } from "express";
import { authenticateToken, requireInstitution } from "../middlewares/auth.middleware.js";
import { getInstitutionDashboard, getInstitutionAnalytics, getPublicInstitutions, getInstitutionStudentsList, getInstitutionStudentDetails, updateStudentVerificationByInstitution, viewInstitutionStudentDocument, } from "../controllers/institution.controller.js";
const router = Router();
// Public endpoint for account creation institution selection
router.get("/public", getPublicInstitutions);
// Protected endpoints for Institution users
router.get("/dashboard", authenticateToken, requireInstitution, getInstitutionDashboard);
router.get("/analytics", authenticateToken, requireInstitution, getInstitutionAnalytics);
router.get("/analytics/overview", authenticateToken, requireInstitution, getInstitutionAnalytics);
router.get("/students", authenticateToken, requireInstitution, getInstitutionStudentsList);
router.get("/students/document/view", authenticateToken, requireInstitution, viewInstitutionStudentDocument);
router.get("/students/:studentId/details", authenticateToken, requireInstitution, getInstitutionStudentDetails);
router.put("/students/:studentId/verification", authenticateToken, requireInstitution, updateStudentVerificationByInstitution);
export default router;
