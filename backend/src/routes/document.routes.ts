import { Router } from "express";
import { authenticateToken, requireStudent } from "../middlewares/auth.middleware.js";
import { handleResumeUpload, handleCertificateUpload } from "../middlewares/upload.middleware.js";
import {
  getResume,
  uploadResume,
  deleteResume,
  viewResume,
  downloadResume,
  getCertificates,
  getCertificateById,
  addCertificate,
  updateCertificate,
  deleteCertificate,
  viewCertificate,
  downloadCertificate,
} from "../controllers/document.controller.js";

const router = Router();

// ==========================================
// RESUME ROUTES
// ==========================================
router.get("/student/resume", authenticateToken, requireStudent, getResume);
router.get("/student/resume/view", authenticateToken, requireStudent, viewResume);
router.get("/student/resume/download", authenticateToken, requireStudent, downloadResume);
router.post("/student/resume", authenticateToken, requireStudent, handleResumeUpload, uploadResume);
router.put("/student/resume", authenticateToken, requireStudent, handleResumeUpload, uploadResume);
router.delete("/student/resume", authenticateToken, requireStudent, deleteResume);

// ==========================================
// CERTIFICATE ROUTES
// ==========================================
router.get("/student/certificates", authenticateToken, requireStudent, getCertificates);
router.get("/student/certificates/:id/view", authenticateToken, requireStudent, viewCertificate);
router.get("/student/certificates/:id/download", authenticateToken, requireStudent, downloadCertificate);
router.get("/student/certificates/:id", authenticateToken, requireStudent, getCertificateById);
router.post("/student/certificates", authenticateToken, requireStudent, handleCertificateUpload, addCertificate);
router.put("/student/certificates/:id", authenticateToken, requireStudent, handleCertificateUpload, updateCertificate);
router.delete("/student/certificates/:id", authenticateToken, requireStudent, deleteCertificate);

export default router;
