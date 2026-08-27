import type { Request, Response } from "express";
import pool from "../config/db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import {
  createOpportunitySchema,
  updateOpportunitySchema,
} from "../schemas/opportunity.schema.js";

// Helper to get industry_id for authenticated user
const getIndustryIdByUserId = async (userId: number): Promise<number | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, verification_status FROM industry_profiles WHERE user_id = ?`,
    [userId]
  );
  if (!rows || rows.length === 0) return null;
  return rows[0].id;
};

// Helper to fetch required skills for an opportunity
const fetchOpportunitySkills = async (opportunityId: number) => {
  const [skills] = await pool.query<RowDataPacket[]>(
    `SELECT 
        os.id,
        os.opportunity_id,
        os.skill_id,
        os.required_proficiency,
        s.name AS skill_name,
        s.category
     FROM opportunity_skills os
     JOIN skills s ON os.skill_id = s.id
     WHERE os.opportunity_id = ?`,
    [opportunityId]
  );
  return skills;
};

// Helper to resolve or auto-create skill ID by name or ID
const resolveSkillId = async (
  connection: any,
  item: { skillId?: number; skillName?: string }
): Promise<number | null> => {
  if (item.skillId) {
    const [rows]: any = await connection.query(
      `SELECT id FROM skills WHERE id = ?`,
      [item.skillId]
    );
    if (rows && rows.length > 0) return rows[0].id;
  }
  if (item.skillName && item.skillName.trim()) {
    const name = item.skillName.trim();
    const [rows]: any = await connection.query(
      `SELECT id FROM skills WHERE LOWER(name) = LOWER(?)`,
      [name]
    );
    if (rows && rows.length > 0) return rows[0].id;

    // Create new master skill on the fly if it doesn't exist yet
    const [insert]: any = await connection.query(
      `INSERT INTO skills (name, category) VALUES (?, 'Technical')`,
      [name]
    );
    return insert.insertId;
  }
  return null;
};

// 1. Create Opportunity
export const createOpportunity = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const industryId = await getIndustryIdByUserId(req.user.id);
    if (!industryId) {
      res.status(403).json({
        success: false,
        message: "Industry profile not found. Please complete your profile first.",
      });
      return;
    }

    const validationResult = createOpportunitySchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0]?.message || "Invalid input data.",
        errors: validationResult.error.issues,
      });
      return;
    }

    const data = validationResult.data;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [oppResult] = await connection.query<ResultSetHeader>(
        `INSERT INTO opportunities 
          (industry_id, type, title, description, location, work_mode, stipend_min, stipend_max, duration, eligibility, application_deadline, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          industryId,
          data.type,
          data.title,
          data.description,
          data.location || null,
          data.workMode || "On-site",
          data.stipendMin ?? null,
          data.stipendMax ?? null,
          data.duration || null,
          data.eligibility || null,
          data.applicationDeadline || null,
          data.status || "draft",
        ]
      );

      const opportunityId = oppResult.insertId;

      // Insert required skills if any
      if (data.requiredSkills && data.requiredSkills.length > 0) {
        for (const reqSkill of data.requiredSkills) {
          const resolvedId = await resolveSkillId(connection, reqSkill);
          if (resolvedId) {
            await connection.query(
              `INSERT INTO opportunity_skills (opportunity_id, skill_id, required_proficiency) VALUES (?, ?, ?)`,
              [opportunityId, resolvedId, reqSkill.requiredProficiency]
            );
          }
        }
      }

      await connection.commit();

      const skills = await fetchOpportunitySkills(opportunityId);

      res.status(201).json({
        success: true,
        message: "Opportunity created successfully.",
        opportunity: {
          id: opportunityId,
          industryId,
          type: data.type,
          title: data.title,
          description: data.description,
          location: data.location || null,
          workMode: data.workMode || "On-site",
          stipendMin: data.stipendMin ?? null,
          stipendMax: data.stipendMax ?? null,
          duration: data.duration || null,
          eligibility: data.eligibility || null,
          applicationDeadline: data.applicationDeadline || null,
          status: data.status || "draft",
          requiredSkills: skills,
        },
      });
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("createOpportunity controller error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating opportunity: " + (error.message || "Database failed"),
    });
  }
};

// 2. Get Industry Opportunities
export const getIndustryOpportunities = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const industryId = await getIndustryIdByUserId(req.user.id);
    if (!industryId) {
      res.status(403).json({ success: false, message: "Industry profile not found." });
      return;
    }

    const { type, status } = req.query;

    let query = `SELECT * FROM opportunities WHERE industry_id = ?`;
    const queryParams: any[] = [industryId];

    if (type && typeof type === "string") {
      query += ` AND type = ?`;
      queryParams.push(type.toLowerCase());
    }

    if (status && typeof status === "string") {
      query += ` AND status = ?`;
      queryParams.push(status.toLowerCase());
    }

    query += ` ORDER BY created_at DESC`;

    const [oppRows] = await pool.query<RowDataPacket[]>(query, queryParams);

    // Attach required skills for each opportunity
    const opportunitiesWithSkills = await Promise.all(
      oppRows.map(async (opp) => {
        const skills = await fetchOpportunitySkills(opp.id);
        return {
          ...opp,
          requiredSkills: skills,
        };
      })
    );

    res.status(200).json({
      success: true,
      opportunities: opportunitiesWithSkills,
    });
  } catch (error: any) {
    console.error("getIndustryOpportunities error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching opportunities: " + (error.message || "Database query failed"),
    });
  }
};

// 3. Get Single Opportunity by ID for Industry
export const getIndustryOpportunityById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const industryId = await getIndustryIdByUserId(req.user.id);
    if (!industryId) {
      res.status(403).json({ success: false, message: "Industry profile not found." });
      return;
    }

    const oppId = parseInt(String(req.params.id), 10);
    if (isNaN(oppId)) {
      res.status(400).json({ success: false, message: "Invalid opportunity ID." });
      return;
    }

    const [oppRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM opportunities WHERE id = ? AND industry_id = ?`,
      [oppId, industryId]
    );

    if (!oppRows || oppRows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Opportunity not found or you do not have permission to view it.",
      });
      return;
    }

    const opportunity = oppRows[0];
    const skills = await fetchOpportunitySkills(opportunity.id);

    res.status(200).json({
      success: true,
      opportunity: {
        ...opportunity,
        requiredSkills: skills,
      },
    });
  } catch (error: any) {
    console.error("getIndustryOpportunityById error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching opportunity details.",
    });
  }
};

// 4. Update Opportunity
export const updateOpportunity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const industryId = await getIndustryIdByUserId(req.user.id);
    if (!industryId) {
      res.status(403).json({ success: false, message: "Industry profile not found." });
      return;
    }

    const oppId = parseInt(String(req.params.id), 10);
    if (isNaN(oppId)) {
      res.status(400).json({ success: false, message: "Invalid opportunity ID." });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM opportunities WHERE id = ? AND industry_id = ?`,
      [oppId, industryId]
    );

    if (!existing || existing.length === 0) {
      res.status(404).json({
        success: false,
        message: "Opportunity not found or access denied.",
      });
      return;
    }

    const validationResult = updateOpportunitySchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: validationResult.error.issues[0]?.message || "Invalid update data.",
      });
      return;
    }

    const data = validationResult.data;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE opportunities SET
          type = COALESCE(?, type),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          location = COALESCE(?, location),
          work_mode = COALESCE(?, work_mode),
          stipend_min = COALESCE(?, stipend_min),
          stipend_max = COALESCE(?, stipend_max),
          duration = COALESCE(?, duration),
          eligibility = COALESCE(?, eligibility),
          application_deadline = COALESCE(?, application_deadline),
          status = COALESCE(?, status)
        WHERE id = ? AND industry_id = ?`,
        [
          data.type,
          data.title,
          data.description,
          data.location,
          data.workMode,
          data.stipendMin,
          data.stipendMax,
          data.duration,
          data.eligibility,
          data.applicationDeadline,
          data.status,
          oppId,
          industryId,
        ]
      );

      // If requiredSkills explicitly passed, refresh them
      if (data.requiredSkills !== undefined) {
        await connection.query(
          `DELETE FROM opportunity_skills WHERE opportunity_id = ?`,
          [oppId]
        );

        if (data.requiredSkills.length > 0) {
          for (const reqSkill of data.requiredSkills) {
            const resolvedId = await resolveSkillId(connection, reqSkill);
            if (resolvedId) {
              await connection.query(
                `INSERT INTO opportunity_skills (opportunity_id, skill_id, required_proficiency) VALUES (?, ?, ?)`,
                [oppId, resolvedId, reqSkill.requiredProficiency]
              );
            }
          }
        }
      }

      await connection.commit();

      const [updatedRows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM opportunities WHERE id = ?`,
        [oppId]
      );
      const skills = await fetchOpportunitySkills(oppId);

      res.status(200).json({
        success: true,
        message: "Opportunity updated successfully.",
        opportunity: {
          ...updatedRows[0],
          requiredSkills: skills,
        },
      });
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("updateOpportunity error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating opportunity.",
    });
  }
};

// 5. Delete Opportunity
export const deleteOpportunity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const industryId = await getIndustryIdByUserId(req.user.id);
    if (!industryId) {
      res.status(403).json({ success: false, message: "Industry profile not found." });
      return;
    }

    const oppId = parseInt(String(req.params.id), 10);
    if (isNaN(oppId)) {
      res.status(400).json({ success: false, message: "Invalid opportunity ID." });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM opportunities WHERE id = ? AND industry_id = ?`,
      [oppId, industryId]
    );

    if (!existing || existing.length === 0) {
      res.status(404).json({
        success: false,
        message: "Opportunity not found or access denied.",
      });
      return;
    }

    await pool.query(`DELETE FROM opportunities WHERE id = ?`, [oppId]);

    res.status(200).json({
      success: true,
      message: "Opportunity deleted successfully.",
    });
  } catch (error: any) {
    console.error("deleteOpportunity error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting opportunity.",
    });
  }
};

// 6. Publish Opportunity
export const publishOpportunity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const industryId = await getIndustryIdByUserId(req.user.id);
    if (!industryId) {
      res.status(403).json({ success: false, message: "Industry profile not found." });
      return;
    }

    const oppId = parseInt(String(req.params.id), 10);
    if (isNaN(oppId)) {
      res.status(400).json({ success: false, message: "Invalid opportunity ID." });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM opportunities WHERE id = ? AND industry_id = ?`,
      [oppId, industryId]
    );

    if (!existing || existing.length === 0) {
      res.status(404).json({
        success: false,
        message: "Opportunity not found or access denied.",
      });
      return;
    }

    const opp = existing[0];
    if (!opp.title || !opp.description || !opp.type) {
      res.status(400).json({
        success: false,
        message: "Cannot publish: Title, description, and type are required.",
      });
      return;
    }

    await pool.query(
      `UPDATE opportunities SET status = 'published', updated_at = NOW() WHERE id = ?`,
      [oppId]
    );

    const [updatedRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM opportunities WHERE id = ?`,
      [oppId]
    );
    const skills = await fetchOpportunitySkills(oppId);

    res.status(200).json({
      success: true,
      message: "Opportunity published successfully.",
      opportunity: {
        ...updatedRows[0],
        requiredSkills: skills,
      },
    });
  } catch (error: any) {
    console.error("publishOpportunity error:", error);
    res.status(500).json({
      success: false,
      message: "Server error publishing opportunity.",
    });
  }
};

// 7. Close Opportunity
export const closeOpportunity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const industryId = await getIndustryIdByUserId(req.user.id);
    if (!industryId) {
      res.status(403).json({ success: false, message: "Industry profile not found." });
      return;
    }

    const oppId = parseInt(String(req.params.id), 10);
    if (isNaN(oppId)) {
      res.status(400).json({ success: false, message: "Invalid opportunity ID." });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM opportunities WHERE id = ? AND industry_id = ?`,
      [oppId, industryId]
    );

    if (!existing || existing.length === 0) {
      res.status(404).json({
        success: false,
        message: "Opportunity not found or access denied.",
      });
      return;
    }

    await pool.query(
      `UPDATE opportunities SET status = 'closed', updated_at = NOW() WHERE id = ?`,
      [oppId]
    );

    const [updatedRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM opportunities WHERE id = ?`,
      [oppId]
    );
    const skills = await fetchOpportunitySkills(oppId);

    res.status(200).json({
      success: true,
      message: "Opportunity closed successfully.",
      opportunity: {
        ...updatedRows[0],
        requiredSkills: skills,
      },
    });
  } catch (error: any) {
    console.error("closeOpportunity error:", error);
    res.status(500).json({
      success: false,
      message: "Server error closing opportunity.",
    });
  }
};

// 8. Get Public Published Opportunities (For Students)
export const getPublicPublishedOpportunities = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { type, search } = req.query;

    let query = `
      SELECT 
        o.*,
        ip.company_name,
        ip.logo AS company_logo,
        ip.industry_sector,
        ip.location AS company_location
      FROM opportunities o
      JOIN industry_profiles ip ON o.industry_id = ip.id
      WHERE o.status = 'published'
    `;
    const queryParams: any[] = [];

    if (type && typeof type === "string" && (type === "internship" || type === "job")) {
      query += ` AND o.type = ?`;
      queryParams.push(type);
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      query += ` AND (o.title LIKE ? OR o.description LIKE ? OR ip.company_name LIKE ?)`;
      const term = `%${search.trim()}%`;
      queryParams.push(term, term, term);
    }

    query += ` ORDER BY o.created_at DESC`;

    const [oppRows] = await pool.query<RowDataPacket[]>(query, queryParams);

    const opportunitiesWithSkills = await Promise.all(
      oppRows.map(async (opp) => {
        const skills = await fetchOpportunitySkills(opp.id);
        return {
          ...opp,
          requiredSkills: skills,
        };
      })
    );

    res.status(200).json({
      success: true,
      opportunities: opportunitiesWithSkills,
    });
  } catch (error: any) {
    console.error("getPublicPublishedOpportunities error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching public opportunities.",
    });
  }
};

// 9. Get Public Companies List with active opportunity counts
export const getAllPublicCompanies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { search, sector } = req.query;

    let query = `
      SELECT 
        ip.id,
        ip.company_name AS companyName,
        ip.company_type AS companyType,
        ip.industry_sector AS industrySector,
        ip.description,
        ip.website,
        ip.location,
        ip.contact_email AS contactEmail,
        ip.phone,
        ip.logo,
        ip.verification_status AS verificationStatus,
        (SELECT COUNT(*) FROM opportunities o WHERE o.industry_id = ip.id AND o.status = 'published') AS activeOpportunitiesCount
      FROM industry_profiles ip
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (search && typeof search === "string" && search.trim() !== "") {
      query += ` AND (ip.company_name LIKE ? OR ip.description LIKE ? OR ip.location LIKE ?)`;
      const term = `%${search.trim()}%`;
      queryParams.push(term, term, term);
    }

    if (sector && typeof sector === "string" && sector.trim() !== "") {
      query += ` AND ip.industry_sector = ?`;
      queryParams.push(sector.trim());
    }

    query += ` ORDER BY activeOpportunitiesCount DESC, ip.company_name ASC`;

    const [companies] = await pool.query<RowDataPacket[]>(query, queryParams);

    // Attach published opportunities to each company for quick view
    const companiesWithDetails = await Promise.all(
      companies.map(async (comp) => {
        const [opps] = await pool.query<RowDataPacket[]>(
          `SELECT id, title, type, location, work_mode, stipend_min, stipend_max, created_at
           FROM opportunities
           WHERE industry_id = ? AND status = 'published'
           ORDER BY created_at DESC
           LIMIT 5`,
          [comp.id]
        );
        return {
          ...comp,
          opportunities: opps,
        };
      })
    );

    res.status(200).json({
      success: true,
      companies: companiesWithDetails,
    });
  } catch (error: any) {
    console.error("getAllPublicCompanies error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching companies: " + error.message,
    });
  }
};

