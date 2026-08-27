import { Router } from "express";
import {
  getStudentProfile,
  updateStudentProfile,
  getInstitutions,
  fetchGitHubRepos,
  importGitHubProjects,
  addStudentProject,
  deleteStudentProject,
} from "../controllers/profile.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/profile", authenticateToken, getStudentProfile);
router.put("/profile", authenticateToken, updateStudentProfile);
router.get("/institutions", getInstitutions);

// Developer Accounts & GitHub Projects Integration
router.post("/profile/github-repos", authenticateToken, fetchGitHubRepos);
router.post("/profile/import-github-projects", authenticateToken, importGitHubProjects);
router.post("/profile/projects", authenticateToken, addStudentProject);
router.delete("/profile/projects/:id", authenticateToken, deleteStudentProject);

export default router;
