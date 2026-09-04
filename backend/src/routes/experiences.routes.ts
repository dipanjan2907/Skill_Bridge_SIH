import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  getStudentExperiences,
  addWorkExperience,
  deleteWorkExperience,
  addProjectExperience,
  deleteProjectExperience,
  addCertificationExperience,
  deleteCertificationExperience,
} from "../controllers/experiences.controller.js";

const router = Router();

router.use(authenticateToken);

router.get("/experiences", getStudentExperiences);
router.post("/experiences/work", addWorkExperience);
router.delete("/experiences/work/:id", deleteWorkExperience);
router.post("/experiences/projects", addProjectExperience);
router.delete("/experiences/projects/:id", deleteProjectExperience);
router.post("/experiences/certifications", addCertificationExperience);
router.delete("/experiences/certifications/:id", deleteCertificationExperience);

export default router;
