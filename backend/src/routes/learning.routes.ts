import { Router } from "express";
import {
  getLearningPaths,
  updateLearningProgress,
  getRecentStudentActivities,
} from "../controllers/learning.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Student Learning Hub Endpoints (Authenticated)
router.get("/student/learning/paths", authenticateToken, getLearningPaths);
router.post("/student/learning/progress", authenticateToken, updateLearningProgress);
router.get("/student/learning/activities", authenticateToken, getRecentStudentActivities);

export default router;
