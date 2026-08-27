import { Router } from "express";
import { authenticateToken, requireStudent } from "../middlewares/auth.middleware.js";
import { requireVerifiedIndustry } from "../middlewares/industry.middleware.js";
import {
  applyForOpportunity,
  getStudentApplications,
  getStudentApplicationById,
  getIndustryOpportunityApplications,
  updateApplicationStatus,
} from "../controllers/application.controller.js";

const router = Router();

// Student Application Routes
router.post(
  "/student/applications",
  authenticateToken,
  requireStudent,
  applyForOpportunity
);

router.get(
  "/student/applications",
  authenticateToken,
  requireStudent,
  getStudentApplications
);

router.get(
  "/student/applications/:id",
  authenticateToken,
  requireStudent,
  getStudentApplicationById
);

// Industry Applicant Management Routes
router.get(
  "/industry/opportunities/:opportunityId/applications",
  authenticateToken,
  requireVerifiedIndustry,
  getIndustryOpportunityApplications
);

router.put(
  "/industry/applications/:applicationId/status",
  authenticateToken,
  requireVerifiedIndustry,
  updateApplicationStatus
);

export default router;
