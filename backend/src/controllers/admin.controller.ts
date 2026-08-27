import type { Request, Response } from "express";
import pool from "../config/db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { rejectIndustrySchema } from "../schemas/industry.schema.js";

const formatAdminIndustryItem = (row: any) => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name || null,
  userEmail: row.user_email || null,
  companyName: row.company_name,
  companyType: row.company_type || null,
  industrySector: row.industry_sector || null,
  description: row.description || null,
  website: row.website || null,
  location: row.location || null,
  contactEmail: row.contact_email || null,
  phone: row.phone || null,
  logo: row.logo || null,
  verificationStatus: row.verification_status,
  rejectionReason: row.rejection_reason || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getIndustries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const statusParam = req.query.status ? String(req.query.status).trim().toLowerCase() : null;

    let sql = `
      SELECT 
        ip.id,
        ip.user_id,
        ip.company_name,
        ip.company_type,
        ip.industry_sector,
        ip.description,
        ip.website,
        ip.location,
        ip.contact_email,
        ip.phone,
        ip.logo,
        ip.verification_status,
        ip.rejection_reason,
        ip.created_at,
        ip.updated_at,
        u.name AS user_name,
        u.email AS user_email
      FROM industry_profiles ip
      JOIN users u ON ip.user_id = u.id
    `;

    const queryParams: any[] = [];

    if (statusParam && ["pending", "approved", "rejected"].includes(statusParam)) {
      sql += ` WHERE ip.verification_status = ?`;
      queryParams.push(statusParam);
    }

    sql += ` ORDER BY ip.created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(sql, queryParams);

    const industries = rows.map(formatAdminIndustryItem);

    res.status(200).json({
      success: true,
      count: industries.length,
      data: industries,
    });
  } catch (error: any) {
    console.error("getIndustries error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to retrieve industry list: ${error.message}`,
    });
  }
};

export const getIndustryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rawId = req.params.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : String(rawId);

  try {
    const industryId = parseInt(idStr, 10);
    if (isNaN(industryId)) {
      res.status(400).json({ success: false, message: "Invalid industry ID." });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ip.id,
        ip.user_id,
        ip.company_name,
        ip.company_type,
        ip.industry_sector,
        ip.description,
        ip.website,
        ip.location,
        ip.contact_email,
        ip.phone,
        ip.logo,
        ip.verification_status,
        ip.rejection_reason,
        ip.created_at,
        ip.updated_at,
        u.name AS user_name,
        u.email AS user_email
      FROM industry_profiles ip
      JOIN users u ON ip.user_id = u.id
      WHERE ip.id = ? OR ip.user_id = ?`,
      [industryId, industryId]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Industry profile not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatAdminIndustryItem(rows[0]),
    });
  } catch (error: any) {
    console.error("getIndustryById error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to retrieve industry profile: ${error.message}`,
    });
  }
};

export const approveIndustry = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rawId = req.params.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : String(rawId);

  try {
    const industryId = parseInt(idStr, 10);
    if (isNaN(industryId)) {
      res.status(400).json({ success: false, message: "Invalid industry ID." });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM industry_profiles WHERE id = ? OR user_id = ?`,
      [industryId, industryId]
    );

    if (!existing || existing.length === 0) {
      res.status(404).json({
        success: false,
        message: "Industry profile not found.",
      });
      return;
    }

    const actualId = existing[0].id;

    await pool.query<ResultSetHeader>(
      `UPDATE industry_profiles
       SET verification_status = 'approved', rejection_reason = NULL, updated_at = NOW()
       WHERE id = ?`,
      [actualId]
    );

    const [updatedRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ip.id,
        ip.user_id,
        ip.company_name,
        ip.company_type,
        ip.industry_sector,
        ip.description,
        ip.website,
        ip.location,
        ip.contact_email,
        ip.phone,
        ip.logo,
        ip.verification_status,
        ip.rejection_reason,
        ip.created_at,
        ip.updated_at,
        u.name AS user_name,
        u.email AS user_email
      FROM industry_profiles ip
      JOIN users u ON ip.user_id = u.id
      WHERE ip.id = ?`,
      [actualId]
    );

    res.status(200).json({
      success: true,
      message: "Industry approved successfully.",
      data: formatAdminIndustryItem(updatedRows[0]),
    });
  } catch (error: any) {
    console.error("approveIndustry error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to approve industry: ${error.message}`,
    });
  }
};

export const rejectIndustry = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rawId = req.params.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : String(rawId);

  try {
    const industryId = parseInt(idStr, 10);

    if (isNaN(industryId)) {
      res.status(400).json({ success: false, message: "Invalid industry ID." });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM industry_profiles WHERE id = ? OR user_id = ?`,
      [industryId, industryId]
    );

    if (!existing || existing.length === 0) {
      res.status(404).json({
        success: false,
        message: "Industry profile not found.",
      });
      return;
    }

    const actualId = existing[0].id;

    const rejectionReason =
      req.body.rejectionReason || req.body.rejection_reason || "Requirements not met";

    await pool.query<ResultSetHeader>(
      `UPDATE industry_profiles
       SET verification_status = 'rejected', rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      [rejectionReason, actualId]
    );

    const [updatedRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        ip.id,
        ip.user_id,
        ip.company_name,
        ip.company_type,
        ip.industry_sector,
        ip.description,
        ip.website,
        ip.location,
        ip.contact_email,
        ip.phone,
        ip.logo,
        ip.verification_status,
        ip.rejection_reason,
        ip.created_at,
        ip.updated_at,
        u.name AS user_name,
        u.email AS user_email
      FROM industry_profiles ip
      JOIN users u ON ip.user_id = u.id
      WHERE ip.id = ?`,
      [actualId]
    );

    res.status(200).json({
      success: true,
      message: "Industry rejected successfully.",
      data: formatAdminIndustryItem(updatedRows[0]),
    });
  } catch (error: any) {
    console.error("rejectIndustry error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to reject industry: ${error.message}`,
    });
  }
};

export const getStudents = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const sql = `
      SELECT 
        u.id AS user_id,
        u.name,
        u.username,
        u.email,
        u.role,
        u.created_at AS user_created_at,
        sp.id AS student_profile_id,
        sp.degree,
        sp.department,
        sp.cgpa,
        sp.phone,
        sp.roll_number,
        sp.current_sem,
        sp.expected_grad,
        sp.counselor,
        sp.github,
        sp.linkedin,
        sp.portfolio,
        sp.dob,
        sp.gender,
        sp.bio,
        sp.work_mode_preference,
        COALESCE(sp.verification_status, 'pending') AS verification_status,
        COALESCE(sp.institution_id, u.institution_id) AS institution_id,
        i.name AS institution_name
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN institutions i ON COALESCE(sp.institution_id, u.institution_id) = i.id
      WHERE LOWER(u.role) = 'student'
      ORDER BY u.created_at DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error: any) {
    console.error("getStudents error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to retrieve students: ${error.message}`,
    });
  }
};

export const getFaculties = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const sql = `
      SELECT 
        u.id AS user_id,
        u.name,
        u.username,
        u.email,
        u.role,
        u.created_at AS user_created_at
      FROM users u
      WHERE LOWER(u.role) IN ('faculty', 'academician', 'teacher')
      ORDER BY u.created_at DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error: any) {
    console.error("getFaculties error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to retrieve faculty list: ${error.message}`,
    });
  }
};

export const toggleUserBan = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rawId = req.params.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : String(rawId);

  try {
    const userId = parseInt(idStr, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: "Invalid user ID." });
      return;
    }

    // Try adding column is_banned if it does not exist yet
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE`);
    } catch (_e) {
      // column already exists, ignore
    }

    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, is_banned FROM users WHERE id = ?`,
      [userId]
    );

    if (!userRows || userRows.length === 0) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    const currentBan = Boolean(userRows[0].is_banned);
    const newBanStatus = !currentBan;

    await pool.query(
      `UPDATE users SET is_banned = ? WHERE id = ?`,
      [newBanStatus, userId]
    );

    res.status(200).json({
      success: true,
      message: `User "${userRows[0].name}" has been ${newBanStatus ? "banned" : "unbanned"} successfully.`,
      is_banned: newBanStatus,
    });
  } catch (error: any) {
    console.error("toggleUserBan error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to update user ban status: ${error.message}`,
    });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rawId = req.params.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : String(rawId);

  try {
    const userId = parseInt(idStr, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: "Invalid user ID." });
      return;
    }

    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, role FROM users WHERE id = ?`,
      [userId]
    );

    if (!userRows || userRows.length === 0) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    if (String(userRows[0].role).toLowerCase() === "admin") {
      res.status(403).json({ success: false, message: "Cannot delete an Administrator account." });
      return;
    }

    await pool.query(`DELETE FROM users WHERE id = ?`, [userId]);

    res.status(200).json({
      success: true,
      message: `User "${userRows[0].name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error("deleteUser error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to delete user: ${error.message}`,
    });
  }
};

export const getInstitutions = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const sql = `
      SELECT 
        i.id,
        i.name,
        i.code,
        i.location,
        i.website,
        COALESCE(i.verification_status, 'approved') AS verification_status,
        i.created_at,
        COUNT(sp.id) AS total_students
      FROM institutions i
      LEFT JOIN student_profiles sp ON i.id = sp.institution_id
      GROUP BY i.id
      ORDER BY i.name ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(sql);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error: any) {
    console.error("getInstitutions error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to retrieve institutions list: ${error.message}`,
    });
  }
};

export const updateInstitutionVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rawId = req.params.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : String(rawId);

  try {
    const instId = parseInt(idStr, 10);
    if (isNaN(instId)) {
      res.status(400).json({ success: false, message: "Invalid institution ID." });
      return;
    }

    const { status } = req.body; // 'approved' | 'rejected' | 'pending'
    if (!["approved", "rejected", "pending"].includes(status)) {
      res.status(400).json({ success: false, message: "Status must be 'approved', 'rejected', or 'pending'." });
      return;
    }

    await pool.query(
      `UPDATE institutions SET verification_status = ? WHERE id = ?`,
      [status, instId]
    );

    res.status(200).json({
      success: true,
      message: `Institution verification status updated to ${status.toUpperCase()}.`,
      status,
    });
  } catch (error: any) {
    console.error("updateInstitutionVerification error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to update institution status: ${error.message}`,
    });
  }
};


export const updateStudentVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  const rawId = req.params.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : String(rawId);

  try {
    const userId = parseInt(idStr, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: "Invalid student ID." });
      return;
    }

    const { status } = req.body; // 'verified' | 'unverified' | 'fake'
    if (!["verified", "unverified", "fake"].includes(status)) {
      res.status(400).json({ success: false, message: "Status must be 'verified', 'unverified', or 'fake'." });
      return;
    }

    // Try adding verification_status column to student_profiles if missing
    try {
      await pool.query(`ALTER TABLE student_profiles ADD COLUMN verification_status VARCHAR(50) DEFAULT 'unverified'`);
    } catch (_e) {
      // column already exists
    }

    await pool.query(
      `UPDATE student_profiles SET verification_status = ? WHERE user_id = ? OR id = ?`,
      [status, userId, userId]
    );

    res.status(200).json({
      success: true,
      message: `Student profile marked as ${status.toUpperCase()} successfully.`,
      status,
    });
  } catch (error: any) {
    console.error("updateStudentVerification error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to update student verification status: ${error.message}`,
    });
  }
};




