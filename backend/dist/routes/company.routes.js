import { Router } from "express";
import { getMyCompanyProfile, updateCompanyProfile, getAllCompanies, getCompanyById, } from "../controllers/company.controller";
import { authenticateToken, authorizeRoles } from "../middleware/auth.middleware";
const router = Router();
router.get("/", getAllCompanies);
router.get("/profile", authenticateToken, authorizeRoles("Industry", "Admin"), getMyCompanyProfile);
router.put("/profile", authenticateToken, authorizeRoles("Industry", "Admin"), updateCompanyProfile);
router.get("/:id", getCompanyById);
export default router;
