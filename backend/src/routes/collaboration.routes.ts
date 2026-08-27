import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  getCollaborations,
  getCollaborationById,
  createCollaboration,
  updateCollaboration,
  deleteCollaboration,
  applyCollaboration,
  cancelApplication,
  getMyCollaborations,
  getCollaborationParticipants,
  updateParticipantStatus,
} from "../controllers/collaboration.controller.js";

const router = Router();

// Public / Auth Discovery
router.get("/collaborations", authenticateToken, getCollaborations);
router.get("/collaborations/my", authenticateToken, getMyCollaborations);
router.get("/collaborations/:id", authenticateToken, getCollaborationById);

// Creation & Management (RBAC handled inside controller)
router.post("/collaborations", authenticateToken, createCollaboration);
router.put("/collaborations/:id", authenticateToken, updateCollaboration);
router.delete("/collaborations/:id", authenticateToken, deleteCollaboration);

// Application & Participation
router.post("/collaborations/:id/apply", authenticateToken, applyCollaboration);
router.delete("/collaborations/:id/apply", authenticateToken, cancelApplication);

// Participants Management
router.get("/collaborations/:id/participants", authenticateToken, getCollaborationParticipants);
router.patch("/collaborations/:id/participants/:participantId", authenticateToken, updateParticipantStatus);

export default router;
