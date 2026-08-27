import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import {
  getIndustries,
  getIndustryById,
  approveIndustry,
  rejectIndustry,
  getStudents,
  getFaculties,
  toggleUserBan,
  deleteUser,
  getInstitutions,
  updateStudentVerification,
  updateInstitutionVerification,
} from "../controllers/admin.controller.js";

const router = Router();

router.get("/industries", authenticateToken, requireAdmin, getIndustries);
router.get("/industries/:id", authenticateToken, requireAdmin, getIndustryById);
router.put("/industries/:id/approve", authenticateToken, requireAdmin, approveIndustry);
router.put("/industries/:id/reject", authenticateToken, requireAdmin, rejectIndustry);
router.get("/students", authenticateToken, requireAdmin, getStudents);
router.put("/students/:id/verification", authenticateToken, requireAdmin, updateStudentVerification);
router.get("/faculties", authenticateToken, requireAdmin, getFaculties);
router.get("/institutions", authenticateToken, requireAdmin, getInstitutions);
router.put("/institutions/:id/verification", authenticateToken, requireAdmin, updateInstitutionVerification);
router.put("/users/:id/toggle-ban", authenticateToken, requireAdmin, toggleUserBan);
router.delete("/users/:id", authenticateToken, requireAdmin, deleteUser);

export default router;





