import type { Request, Response } from "express";
import pool from "../config/db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Ensures student experience tables exist in MySQL database
 */
const ensureExperiencesTablesExist = async (): Promise<void> => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_work_experiences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NULL,
        employment_type VARCHAR(100) DEFAULT 'Full-time',
        start_date VARCHAR(50) NULL,
        end_date VARCHAR(50) NULL,
        is_current TINYINT(1) DEFAULT 0,
        description TEXT NULL,
        skills_used JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        tech_stack JSON NULL,
        status VARCHAR(50) DEFAULT 'Completed',
        project_url VARCHAR(500) NULL,
        repo_url VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_certifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        issuer VARCHAR(255) NOT NULL,
        issue_year VARCHAR(50) NULL,
        credential_url VARCHAR(500) NULL,
        verification_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
      )
    `);

    // Safe additive column migrations
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN verification_status VARCHAR(50) DEFAULT 'pending'`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN credential_url VARCHAR(500) NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_certifications ADD COLUMN issue_year VARCHAR(50) NULL`); } catch (_e) {}

    try { await pool.query(`ALTER TABLE student_projects ADD COLUMN project_url VARCHAR(500) NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_projects ADD COLUMN repo_url VARCHAR(500) NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_projects ADD COLUMN tech_stack JSON NULL`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_projects ADD COLUMN status VARCHAR(50) DEFAULT 'Completed'`); } catch (_e) {}

    try { await pool.query(`ALTER TABLE student_work_experiences ADD COLUMN is_current TINYINT(1) DEFAULT 0`); } catch (_e) {}
    try { await pool.query(`ALTER TABLE student_work_experiences ADD COLUMN skills_used JSON NULL`); } catch (_e) {}
  } catch (err) {
    console.error("Error creating student experience tables:", err);
  }
};

/**
 * Helper to get or create student_profile id from authenticated user_id
 */
const getStudentProfileIdByUserId = async (userId: number): Promise<number | null> => {
  try {
    await ensureExperiencesTablesExist();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM student_profiles WHERE user_id = ?`,
      [userId]
    );
    if (rows && rows.length > 0) return rows[0].id;

    // Auto-create base student_profile for user if not yet initialized
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO student_profiles (user_id) VALUES (?)`,
      [userId]
    );
    return res.insertId;
  } catch (err) {
    console.error("Error in getStudentProfileIdByUserId:", err);
    return null;
  }
};

/**
 * GET /api/student/experiences
 * Retrieves real-time student work experiences, projects, certifications, and applied opportunities directly from DB.
 */
export const getStudentExperiences = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const studentId = await getStudentProfileIdByUserId(userId);
    if (!studentId) {
      res.status(200).json({
        success: true,
        data: {
          workExperiences: [],
          projects: [],
          certifications: [],
          opportunityExperiences: [],
        },
      });
      return;
    }

    // 1. Fetch Work / Internship Experiences
    const [workRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id,
        title,
        company_name AS companyName,
        location,
        employment_type AS employmentType,
        start_date AS startDate,
        end_date AS endDate,
        is_current AS isCurrent,
        description,
        skills_used AS skillsUsed,
        created_at AS createdAt
       FROM student_work_experiences
       WHERE student_id = ?
       ORDER BY is_current DESC, id DESC`,
      [studentId]
    );

    const workExperiences = workRows.map((r) => ({
      id: Number(r.id),
      title: String(r.title),
      companyName: String(r.companyName),
      location: r.location ? String(r.location) : "",
      employmentType: String(r.employmentType || "Full-time"),
      startDate: r.startDate ? String(r.startDate) : "",
      endDate: r.endDate ? String(r.endDate) : "",
      isCurrent: Boolean(r.isCurrent),
      description: r.description ? String(r.description) : "",
      skillsUsed: typeof r.skillsUsed === "string" ? JSON.parse(r.skillsUsed) : r.skillsUsed || [],
      createdAt: r.createdAt,
    }));

    // 2. Fetch Student Projects
    const [projectRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id,
        title,
        description,
        tech_stack AS techStack,
        status,
        project_url AS projectUrl,
        repo_url AS repoUrl
       FROM student_projects
       WHERE student_id = ?
       ORDER BY id DESC`,
      [studentId]
    );

    const projects = projectRows.map((p) => ({
      id: Number(p.id),
      title: String(p.title),
      description: p.description ? String(p.description) : "",
      techStack: typeof p.techStack === "string" ? JSON.parse(p.techStack) : p.techStack || [],
      status: String(p.status || "Completed"),
      projectUrl: p.projectUrl ? String(p.projectUrl) : "",
      repoUrl: p.repoUrl ? String(p.repoUrl) : "",
    }));

    // 3. Fetch Student Certifications
    const [certRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id,
        title,
        issuer,
        issue_year AS issueYear,
        credential_url AS credentialUrl,
        verification_status AS verificationStatus,
        created_at AS createdAt
       FROM student_certifications
       WHERE student_id = ?
       ORDER BY id DESC`,
      [studentId]
    );

    const certifications = certRows.map((c) => ({
      id: Number(c.id),
      title: String(c.title),
      issuer: String(c.issuer),
      issueYear: c.issueYear ? String(c.issueYear) : "",
      credentialUrl: c.credentialUrl ? String(c.credentialUrl) : "",
      verificationStatus: String(c.verificationStatus || "pending"),
      createdAt: c.createdAt,
    }));

    // 4. Fetch Applied & Matched Industry Opportunities
    const [appRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        a.id AS applicationId,
        a.status AS applicationStatus,
        a.applied_at AS appliedAt,
        o.id AS opportunityId,
        o.title AS opportunityTitle,
        o.type AS opportunityType,
        o.location,
        ip.company_name AS companyName
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       LEFT JOIN industry_profiles ip ON o.industry_id = ip.id
       WHERE a.student_id = ?
       ORDER BY a.applied_at DESC`,
      [studentId]
    );

    const opportunityExperiences = appRows.map((a) => ({
      applicationId: Number(a.applicationId),
      opportunityId: Number(a.opportunityId),
      title: String(a.opportunityTitle),
      companyName: a.companyName ? String(a.companyName) : "Industry Partner",
      type: String(a.opportunityType || "Internship"),
      location: a.location ? String(a.location) : "Remote",
      status: String(a.applicationStatus || "applied"),
      appliedAt: a.appliedAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        workExperiences,
        projects,
        certifications,
        opportunityExperiences,
      },
    });
  } catch (error: any) {
    console.error("getStudentExperiences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student experiences: " + (error.message || "Database error"),
    });
  }
};

/**
 * POST /api/student/experiences/work
 * Adds a new work or internship experience to student_work_experiences
 */
export const addWorkExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const studentId = await getStudentProfileIdByUserId(userId);
    if (!studentId) {
      res.status(404).json({ success: false, message: "Student profile not found" });
      return;
    }

    const { title, companyName, location, employmentType, startDate, endDate, isCurrent, description, skillsUsed } = req.body;

    if (!title || !companyName) {
      res.status(400).json({ success: false, message: "Title and Company Name are required" });
      return;
    }

    const skillsJson = JSON.stringify(Array.isArray(skillsUsed) ? skillsUsed : []);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO student_work_experiences 
        (student_id, title, company_name, location, employment_type, start_date, end_date, is_current, description, skills_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        title,
        companyName,
        location || null,
        employmentType || "Full-time",
        startDate || null,
        endDate || null,
        isCurrent ? 1 : 0,
        description || null,
        skillsJson,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Work experience added successfully",
      experienceId: result.insertId,
    });
  } catch (error: any) {
    console.error("addWorkExperience error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add work experience: " + (error.message || "Database error"),
    });
  }
};

/**
 * DELETE /api/student/experiences/work/:id
 * Deletes a work experience
 */
export const deleteWorkExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const studentId = await getStudentProfileIdByUserId(userId);
    if (!studentId) {
      res.status(404).json({ success: false, message: "Student profile not found" });
      return;
    }

    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid experience ID" });
      return;
    }

    await pool.query(
      `DELETE FROM student_work_experiences WHERE id = ? AND student_id = ?`,
      [id, studentId]
    );

    res.status(200).json({
      success: true,
      message: "Work experience deleted successfully",
    });
  } catch (error: any) {
    console.error("deleteWorkExperience error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete work experience: " + (error.message || "Database error"),
    });
  }
};

/**
 * POST /api/student/experiences/projects
 */
export const addProjectExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const studentId = await getStudentProfileIdByUserId(userId);
    if (!studentId) {
      res.status(404).json({ success: false, message: "Student profile not found" });
      return;
    }

    const { title, description, techStack, projectUrl, repoUrl } = req.body;
    if (!title) {
      res.status(400).json({ success: false, message: "Project title is required" });
      return;
    }

    const techJson = JSON.stringify(Array.isArray(techStack) ? techStack : []);

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO student_projects (student_id, title, description, tech_stack, status, project_url, repo_url)
       VALUES (?, ?, ?, ?, 'Completed', ?, ?)`,
      [studentId, title, description || null, techJson, projectUrl || null, repoUrl || null]
    );

    res.status(201).json({
      success: true,
      message: "Project added successfully",
      projectId: result.insertId,
    });
  } catch (error: any) {
    console.error("addProjectExperience error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add project: " + (error.message || "Database error"),
    });
  }
};

/**
 * DELETE /api/student/experiences/projects/:id
 */
export const deleteProjectExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const studentId = await getStudentProfileIdByUserId(userId);
    if (!studentId) {
      res.status(404).json({ success: false, message: "Student profile not found" });
      return;
    }

    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid project ID" });
      return;
    }

    await pool.query(`DELETE FROM student_projects WHERE id = ? AND student_id = ?`, [id, studentId]);

    res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("deleteProjectExperience error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete project: " + (error.message || "Database error"),
    });
  }
};

/**
 * POST /api/student/experiences/certifications
 */
export const addCertificationExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const studentId = await getStudentProfileIdByUserId(userId);
    if (!studentId) {
      res.status(404).json({ success: false, message: "Student profile not found" });
      return;
    }

    const { title, issuer, issueYear, credentialUrl } = req.body;
    if (!title || !issuer) {
      res.status(400).json({ success: false, message: "Title and Issuer are required" });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO student_certifications (student_id, title, issuer, issue_year, credential_url, verification_status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [studentId, title, issuer, issueYear || null, credentialUrl || null]
    );

    res.status(201).json({
      success: true,
      message: "Certification added successfully",
      certificationId: result.insertId,
    });
  } catch (error: any) {
    console.error("addCertificationExperience error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add certification: " + (error.message || "Database error"),
    });
  }
};

/**
 * DELETE /api/student/experiences/certifications/:id
 */
export const deleteCertificationExperience = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized access" });
      return;
    }

    const studentId = await getStudentProfileIdByUserId(userId);
    if (!studentId) {
      res.status(404).json({ success: false, message: "Student profile not found" });
      return;
    }

    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: "Invalid certification ID" });
      return;
    }

    await pool.query(`DELETE FROM student_certifications WHERE id = ? AND student_id = ?`, [id, studentId]);

    res.status(200).json({ success: true, message: "Certification deleted successfully" });
  } catch (error: any) {
    console.error("deleteCertificationExperience error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete certification: " + (error.message || "Database error"),
    });
  }
};
