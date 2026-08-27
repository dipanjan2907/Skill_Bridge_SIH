import type { Request, Response } from "express";
import pool from "../config/db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { industryProfileSchema } from "../schemas/industry.schema.js";

const formatIndustryProfile = (row: any) => ({
  id: row.id,
  userId: row.user_id,
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

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, message: "Unauthorized access" });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM industry_profiles WHERE user_id = ?`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      // Auto-create default profile for this industry user if missing
      const [userRows] = await pool.query<RowDataPacket[]>(
        `SELECT name, email FROM users WHERE id = ?`,
        [userId]
      );

      const defaultCompanyName = userRows.length > 0 ? userRows[0].name : "My Company";
      const defaultEmail = userRows.length > 0 ? userRows[0].email : null;

      await pool.query(
        `INSERT INTO industry_profiles (user_id, company_name, contact_email, verification_status)
         VALUES (?, ?, ?, 'pending')
         ON DUPLICATE KEY UPDATE user_id=user_id`,
        [userId, defaultCompanyName, defaultEmail]
      );

      const [reQueried] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM industry_profiles WHERE user_id = ?`,
        [userId]
      );

      if (reQueried.length > 0) {
        res.status(200).json({
          success: true,
          data: formatIndustryProfile(reQueried[0]),
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: formatIndustryProfile(rows[0]),
    });
  } catch (error: any) {
    console.error("getProfile error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch profile: ${error.message}`,
    });
  }
};

export const createProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, message: "Unauthorized access" });
    return;
  }

  try {
    const parseResult = industryProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || "Invalid input data",
      });
      return;
    }


    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM industry_profiles WHERE user_id = ?`,
      [userId]
    );

    if (existing && existing.length > 0) {
      res.status(409).json({
        success: false,
        message: "Industry profile already exists. Use PUT /api/industry/profile to update.",
      });
      return;
    }

    const companyName = req.body.companyName || req.body.company_name || req.user?.username || "Company Name";
    const companyType = req.body.companyType || req.body.company_type || null;
    const industrySector = req.body.industrySector || req.body.industry_sector || null;
    const description = req.body.description || null;
    const website = req.body.website || null;
    const location = req.body.location || null;
    const contactEmail = req.body.contactEmail || req.body.contact_email || req.user?.email || null;
    const phone = req.body.phone || null;
    const logo = req.body.logo || null;

    await pool.query<ResultSetHeader>(
      `INSERT INTO industry_profiles 
        (user_id, company_name, company_type, industry_sector, description, website, location, contact_email, phone, logo, verification_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        companyName,
        companyType,
        industrySector,
        description,
        website,
        location,
        contactEmail,
        phone,
        logo,
      ]
    );

    const [createdRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM industry_profiles WHERE user_id = ?`,
      [userId]
    );

    res.status(201).json({
      success: true,
      message: "Industry profile created successfully",
      data: formatIndustryProfile(createdRows[0]),
    });
  } catch (error: any) {
    console.error("createProfile error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to create profile: ${error.message}`,
    });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, message: "Unauthorized access" });
    return;
  }

  try {
    const parseResult = industryProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || "Invalid input data",
      });
      return;
    }


    // Fetch existing profile if available
    const [existingRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM industry_profiles WHERE user_id = ?`,
      [userId]
    );

    const existing = existingRows[0] || {};

    const companyName =
      req.body.companyName ?? req.body.company_name ?? existing.company_name ?? req.user?.username ?? "Company Name";
    const companyType =
      req.body.companyType ?? req.body.company_type ?? existing.company_type ?? null;
    const industrySector =
      req.body.industrySector ?? req.body.industry_sector ?? existing.industry_sector ?? null;
    const description =
      req.body.description ?? existing.description ?? null;
    const website =
      req.body.website ?? existing.website ?? null;
    const location =
      req.body.location ?? existing.location ?? null;
    const contactEmail =
      req.body.contactEmail ?? req.body.contact_email ?? existing.contact_email ?? req.user?.email ?? null;
    const phone =
      req.body.phone ?? existing.phone ?? null;
    const logo =
      req.body.logo ?? existing.logo ?? null;

    // INSERT or UPDATE without touching verification_status or rejection_reason
    await pool.query<ResultSetHeader>(
      `INSERT INTO industry_profiles (
        user_id, company_name, company_type, industry_sector, description, website, location, contact_email, phone, logo, verification_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        company_type = VALUES(company_type),
        industry_sector = VALUES(industry_sector),
        description = VALUES(description),
        website = VALUES(website),
        location = VALUES(location),
        contact_email = VALUES(contact_email),
        phone = VALUES(phone),
        logo = VALUES(logo)`,
      [
        userId,
        companyName,
        companyType,
        industrySector,
        description,
        website,
        location,
        contactEmail,
        phone,
        logo,
      ]
    );

    const [updatedRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM industry_profiles WHERE user_id = ?`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: "Industry profile updated successfully",
      data: formatIndustryProfile(updatedRows[0]),
    });
  } catch (error: any) {
    console.error("updateProfile error:", error);
    res.status(500).json({
      success: false,
      message: `Failed to update profile: ${error.message}`,
    });
  }
};
