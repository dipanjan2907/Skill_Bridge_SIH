import type { Request, Response } from "express";
import pool from "../config/db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { uploadFileToStorage, deleteFileFromStorage } from "../services/storage.service.js";
import path from "path";
import fs from "fs";

/**
 * Helper to retrieve student profile ID for logged-in user
 */
const getStudentProfileId = async (userId: number): Promise<number> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM student_profiles WHERE user_id = ?`,
    [userId]
  );
  if (rows.length === 0) {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO student_profiles (user_id) VALUES (?)`,
      [userId]
    );
    return result.insertId;
  }
  return rows[0].id;
};

// ==========================================
// RESUME CONTROLLERS
// ==========================================

/**
 * GET /api/student/resume
 * Retrieve active resume metadata for authenticated student
 */
export const getResume = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    const studentId = await getStudentProfileId(userId);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, student_id, file_url, file_name, file_type, file_size, uploaded_at 
       FROM student_resumes 
       WHERE student_id = ?`,
      [studentId]
    );

    if (rows.length === 0) {
      res.status(200).json({ resume: null });
      return;
    }

    res.status(200).json({ resume: rows[0] });
  } catch (error: any) {
    console.error("getResume error:", error);
    res.status(500).json({ error: `Database error: ${error.message}` });
  }
};

/**
 * POST /api/student/resume & PUT /api/student/resume
 * Upload or replace active resume for authenticated student
 */
export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "Please select a resume file to upload" });
    return;
  }

  try {
    const studentId = await getStudentProfileId(userId);

    // Fetch existing resume to clean up old storage file
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT file_url FROM student_resumes WHERE student_id = ?`,
      [studentId]
    );

    // Upload new file to Cloudinary / Local Storage
    const uploaded = await uploadFileToStorage(req.file, "resumes");

    // Upsert into student_resumes table
    await pool.query(
      `INSERT INTO student_resumes (student_id, file_url, file_name, file_type, file_size)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         file_url = VALUES(file_url),
         file_name = VALUES(file_name),
         file_type = VALUES(file_type),
         file_size = VALUES(file_size),
         uploaded_at = CURRENT_TIMESTAMP`,
      [studentId, uploaded.file_url, uploaded.file_name, uploaded.file_type, uploaded.file_size]
    );

    // Clean up old file from storage asynchronously if replacement
    if (existing.length > 0 && existing[0].file_url) {
      deleteFileFromStorage(existing[0].file_url);
    }

    // Return full resume record
    const [updatedRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, student_id, file_url, file_name, file_type, file_size, uploaded_at 
       FROM student_resumes 
       WHERE student_id = ?`,
      [studentId]
    );

    res.status(200).json({
      message: "Resume uploaded successfully!",
      resume: updatedRows[0],
    });
  } catch (error: any) {
    console.error("uploadResume error:", error);
    res.status(500).json({ error: `Upload failed: ${error.message}` });
  }
};

/**
 * DELETE /api/student/resume
 * Delete active resume for authenticated student
 */
export const deleteResume = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    const studentId = await getStudentProfileId(userId);

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT file_url FROM student_resumes WHERE student_id = ?`,
      [studentId]
    );

    if (existing.length === 0) {
      res.status(404).json({ error: "No active resume found to delete" });
      return;
    }

    // Delete record from DB
    await pool.query(`DELETE FROM student_resumes WHERE student_id = ?`, [studentId]);

    // Clean up storage file
    if (existing[0].file_url) {
      deleteFileFromStorage(existing[0].file_url);
    }

    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error: any) {
    console.error("deleteResume error:", error);
    res.status(500).json({ error: `Delete failed: ${error.message}` });
  }
};

// ==========================================
// CERTIFICATE CONTROLLERS
// ==========================================

/**
 * GET /api/student/certificates
 * Get all certificates for authenticated student
 */
export const getCertificates = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    const studentId = await getStudentProfileId(userId);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, student_id, title, issuer, issue_date, issue_year, credential_id, credential_url, 
              file_name, file_type, file_size, verification_status, created_at, updated_at
       FROM student_certifications 
       WHERE student_id = ? 
       ORDER BY id DESC`,
      [studentId]
    );

    res.status(200).json({ certificates: rows });
  } catch (error: any) {
    console.error("getCertificates error:", error);
    res.status(500).json({ error: `Database error: ${error.message}` });
  }
};

/**
 * GET /api/student/certificates/:id
 * Get single certificate details by ID
 */
export const getCertificateById = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    const { id } = req.params;
    const studentId = await getStudentProfileId(userId);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, student_id, title, issuer, issue_date, issue_year, credential_id, credential_url, 
              file_name, file_type, file_size, verification_status, created_at, updated_at
       FROM student_certifications 
       WHERE id = ? AND student_id = ?`,
      [id, studentId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Certificate not found or unauthorized" });
      return;
    }

    res.status(200).json({ certificate: rows[0] });
  } catch (error: any) {
    console.error("getCertificateById error:", error);
    res.status(500).json({ error: `Database error: ${error.message}` });
  }
};

/**
 * POST /api/student/certificates
 * Add new certificate with optional uploaded file
 */
export const addCertificate = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    const { title, issuer, issueDate, issue_date, credentialId, credential_id } = req.body;

    if (!title || title.trim() === "") {
      res.status(400).json({ error: "Certificate title is required" });
      return;
    }
    if (!issuer || issuer.trim() === "") {
      res.status(400).json({ error: "Issuing organization is required" });
      return;
    }

    const studentId = await getStudentProfileId(userId);
    const cleanIssueDate = (issueDate || issue_date || null) ? (issueDate || issue_date).split("T")[0] : null;
    const cleanIssueYear = cleanIssueDate ? cleanIssueDate.split("-")[0] : null;
    const cleanCredentialId = credentialId || credential_id || null;

    let fileUrl: string | null = null;
    let fileName: string | null = null;
    let fileType: string | null = null;
    let fileSize: number | null = null;

    if (req.file) {
      const uploaded = await uploadFileToStorage(req.file, "certificates");
      fileUrl = uploaded.file_url;
      fileName = uploaded.file_name;
      fileType = uploaded.file_type;
      fileSize = uploaded.file_size;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO student_certifications 
       (student_id, title, issuer, issue_date, issue_year, credential_id, credential_url, file_name, file_type, file_size, verification_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        studentId,
        title.trim(),
        issuer.trim(),
        cleanIssueDate,
        cleanIssueYear,
        cleanCredentialId,
        fileUrl,
        fileName,
        fileType,
        fileSize,
      ]
    );

    const [newCert] = await pool.query<RowDataPacket[]>(
      `SELECT id, student_id, title, issuer, issue_date, issue_year, credential_id, credential_url, 
              file_name, file_type, file_size, verification_status, created_at, updated_at
       FROM student_certifications 
       WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Certificate added successfully!",
      certificate: newCert[0],
    });
  } catch (error: any) {
    console.error("addCertificate error:", error);
    res.status(500).json({ error: `Failed to add certificate: ${error.message}` });
  }
};

/**
 * PUT /api/student/certificates/:id
 * Update existing certificate & replace file if provided
 */
export const updateCertificate = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    const { id } = req.params;
    const studentId = await getStudentProfileId(userId);

    // Verify ownership
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM student_certifications WHERE id = ? AND student_id = ?`,
      [id, studentId]
    );

    if (existing.length === 0) {
      res.status(404).json({ error: "Certificate not found or unauthorized" });
      return;
    }

    const currentCert = existing[0];
    const { title, issuer, issueDate, issue_date, credentialId, credential_id } = req.body;

    const newTitle = title !== undefined ? title.trim() : currentCert.title;
    const newIssuer = issuer !== undefined ? issuer.trim() : currentCert.issuer;
    const cleanIssueDate = (issueDate || issue_date || currentCert.issue_date || null)
      ? (issueDate || issue_date || currentCert.issue_date).toString().split("T")[0]
      : null;
    const cleanIssueYear = cleanIssueDate ? cleanIssueDate.split("-")[0] : currentCert.issue_year;
    const cleanCredentialId = credentialId !== undefined ? credentialId : currentCert.credential_id;

    let fileUrl = currentCert.credential_url;
    let fileName = currentCert.file_name;
    let fileType = currentCert.file_type;
    let fileSize = currentCert.file_size;

    if (req.file) {
      const uploaded = await uploadFileToStorage(req.file, "certificates");
      fileUrl = uploaded.file_url;
      fileName = uploaded.file_name;
      fileType = uploaded.file_type;
      fileSize = uploaded.file_size;

      // Delete old file if present
      if (currentCert.credential_url && currentCert.credential_url !== fileUrl) {
        deleteFileFromStorage(currentCert.credential_url);
      }
    }

    await pool.query(
      `UPDATE student_certifications 
       SET title = ?, issuer = ?, issue_date = ?, issue_year = ?, credential_id = ?, 
           credential_url = ?, file_name = ?, file_type = ?, file_size = ?
       WHERE id = ? AND student_id = ?`,
      [
        newTitle,
        newIssuer,
        cleanIssueDate,
        cleanIssueYear,
        cleanCredentialId,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        id,
        studentId,
      ]
    );

    const [updatedRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, student_id, title, issuer, issue_date, issue_year, credential_id, credential_url, 
              file_name, file_type, file_size, verification_status, created_at, updated_at
       FROM student_certifications 
       WHERE id = ?`,
      [id]
    );

    res.status(200).json({
      message: "Certificate updated successfully!",
      certificate: updatedRows[0],
    });
  } catch (error: any) {
    console.error("updateCertificate error:", error);
    res.status(500).json({ error: `Update failed: ${error.message}` });
  }
};

/**
 * DELETE /api/student/certificates/:id
 * Delete certificate entry and associated storage file
 */
export const deleteCertificate = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    const { id } = req.params;
    const studentId = await getStudentProfileId(userId);

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT credential_url FROM student_certifications WHERE id = ? AND student_id = ?`,
      [id, studentId]
    );

    if (existing.length === 0) {
      res.status(404).json({ error: "Certificate not found or unauthorized" });
      return;
    }

    // Delete DB record first to maintain data integrity
    await pool.query(`DELETE FROM student_certifications WHERE id = ? AND student_id = ?`, [id, studentId]);

    // Clean up file in storage
    if (existing[0].credential_url) {
      deleteFileFromStorage(existing[0].credential_url);
    }

    res.status(200).json({ message: "Certificate deleted successfully" });
  } catch (error: any) {
    console.error("deleteCertificate error:", error);
    res.status(500).json({ error: `Delete failed: ${error.message}` });
  }
};

/**
 * GET /api/student/resume/view
 * View active resume inline in browser (e.g. PDF/Image viewer)
 */
export const viewResume = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    const studentId = await getStudentProfileId(userId);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT file_url, file_name, file_type FROM student_resumes WHERE student_id = ?`,
      [studentId]
    );

    if (rows.length === 0 || !rows[0].file_url) {
      res.status(404).send("Active resume not found");
      return;
    }

    const resume = rows[0];

    if (resume.file_url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), resume.file_url);
      if (!fs.existsSync(filePath)) {
        res.status(404).send("Resume file not found on disk");
        return;
      }
      res.setHeader("Content-Type", resume.file_type || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(resume.file_name)}"`);
      res.sendFile(filePath);
    } else {
      const response = await fetch(resume.file_url);
      if (!response.ok) {
        res.status(500).send("Failed to fetch document from cloud storage");
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      res.setHeader("Content-Type", resume.file_type || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(resume.file_name)}"`);
      res.send(Buffer.from(arrayBuffer));
    }
  } catch (error: any) {
    console.error("viewResume error:", error);
    res.status(500).send(`Error viewing resume: ${error.message}`);
  }
};

/**
 * GET /api/student/resume/download
 * Download active resume in its original uploaded format
 */
export const downloadResume = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    const studentId = await getStudentProfileId(userId);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT file_url, file_name, file_type FROM student_resumes WHERE student_id = ?`,
      [studentId]
    );

    if (rows.length === 0 || !rows[0].file_url) {
      res.status(404).json({ error: "Active resume not found" });
      return;
    }

    const resume = rows[0];

    if (resume.file_url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), resume.file_url);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "Resume file not found on disk" });
        return;
      }
      res.download(filePath, resume.file_name);
    } else {
      const response = await fetch(resume.file_url);
      if (!response.ok) {
        res.status(500).json({ error: "Failed to download document from cloud storage" });
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      res.setHeader("Content-Type", resume.file_type || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(resume.file_name)}"`);
      res.send(Buffer.from(arrayBuffer));
    }
  } catch (error: any) {
    console.error("downloadResume error:", error);
    res.status(500).json({ error: `Error downloading resume: ${error.message}` });
  }
};

/**
 * GET /api/student/certificates/:id/view
 * View certificate file inline in browser
 */
export const viewCertificate = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    const { id } = req.params;
    const studentId = await getStudentProfileId(userId);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT credential_url, file_name, file_type FROM student_certifications WHERE id = ? AND student_id = ?`,
      [id, studentId]
    );

    if (rows.length === 0 || !rows[0].credential_url) {
      res.status(404).send("Certificate file not found or unauthorized");
      return;
    }

    const cert = rows[0];

    if (cert.credential_url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), cert.credential_url);
      if (!fs.existsSync(filePath)) {
        res.status(404).send("Certificate file not found on disk");
        return;
      }
      res.setHeader("Content-Type", cert.file_type || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(cert.file_name || 'certificate')}"`);
      res.sendFile(filePath);
    } else {
      const response = await fetch(cert.credential_url);
      if (!response.ok) {
        res.status(500).send("Failed to fetch certificate from cloud storage");
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      res.setHeader("Content-Type", cert.file_type || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(cert.file_name || 'certificate')}"`);
      res.send(Buffer.from(arrayBuffer));
    }
  } catch (error: any) {
    console.error("viewCertificate error:", error);
    res.status(500).send(`Error viewing certificate: ${error.message}`);
  }
};

/**
 * GET /api/student/certificates/:id/download
 * Download certificate file in its original uploaded format
 */
export const downloadCertificate = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    const { id } = req.params;
    const studentId = await getStudentProfileId(userId);

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT credential_url, file_name, file_type FROM student_certifications WHERE id = ? AND student_id = ?`,
      [id, studentId]
    );

    if (rows.length === 0 || !rows[0].credential_url) {
      res.status(404).json({ error: "Certificate file not found or unauthorized" });
      return;
    }

    const cert = rows[0];

    if (cert.credential_url.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), cert.credential_url);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "Certificate file not found on disk" });
        return;
      }
      res.download(filePath, cert.file_name || "certificate");
    } else {
      const response = await fetch(cert.credential_url);
      if (!response.ok) {
        res.status(500).json({ error: "Failed to download certificate from cloud storage" });
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      res.setHeader("Content-Type", cert.file_type || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(cert.file_name || 'certificate')}"`);
      res.send(Buffer.from(arrayBuffer));
    }
  } catch (error: any) {
    console.error("downloadCertificate error:", error);
    res.status(500).json({ error: `Error downloading certificate: ${error.message}` });
  }
};
