import pool from "../config/db.js";
import { createOpportunitySchema, updateOpportunitySchema, } from "../schemas/opportunity.schema.js";
// Helper to get industry_id for authenticated user
const getIndustryIdByUserId = async (userId) => {
    const [rows] = await pool.query(`SELECT id, verification_status FROM industry_profiles WHERE user_id = ?`, [userId]);
    if (!rows || rows.length === 0)
        return null;
    return rows[0].id;
};
// Helper to fetch required skills for an opportunity
const fetchOpportunitySkills = async (opportunityId) => {
    const [skills] = await pool.query(`SELECT 
        os.id,
        os.opportunity_id,
        os.skill_id,
        os.required_proficiency,
        s.name AS skill_name,
        s.category
     FROM opportunity_skills os
     JOIN skills s ON os.skill_id = s.id
     WHERE os.opportunity_id = ?`, [opportunityId]);
    return skills;
};
// 1. Create Opportunity
export const createOpportunity = async (req, res) => {
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
        // Validate that all referenced skillIds exist
        if (data.requiredSkills && data.requiredSkills.length > 0) {
            const skillIds = data.requiredSkills.map((s) => s.skillId);
            const [existingSkills] = await pool.query(`SELECT id FROM skills WHERE id IN (?)`, [skillIds]);
            if (existingSkills.length !== skillIds.length) {
                res.status(400).json({
                    success: false,
                    message: "One or more specified skills do not exist in the database.",
                });
                return;
            }
        }
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            const [oppResult] = await connection.query(`INSERT INTO opportunities 
          (industry_id, type, title, description, location, work_mode, stipend_min, stipend_max, duration, eligibility, application_deadline, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
            ]);
            const opportunityId = oppResult.insertId;
            // Insert required skills if any
            if (data.requiredSkills && data.requiredSkills.length > 0) {
                const skillValues = data.requiredSkills.map((s) => [
                    opportunityId,
                    s.skillId,
                    s.requiredProficiency,
                ]);
                await connection.query(`INSERT INTO opportunity_skills (opportunity_id, skill_id, required_proficiency) VALUES ?`, [skillValues]);
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
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error("createOpportunity controller error:", error);
        res.status(500).json({
            success: false,
            message: "Server error creating opportunity: " + (error.message || "Database failed"),
        });
    }
};
// 2. Get Industry Opportunities
export const getIndustryOpportunities = async (req, res) => {
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
        const queryParams = [industryId];
        if (type && typeof type === "string") {
            query += ` AND type = ?`;
            queryParams.push(type.toLowerCase());
        }
        if (status && typeof status === "string") {
            query += ` AND status = ?`;
            queryParams.push(status.toLowerCase());
        }
        query += ` ORDER BY created_at DESC`;
        const [oppRows] = await pool.query(query, queryParams);
        // Attach required skills for each opportunity
        const opportunitiesWithSkills = await Promise.all(oppRows.map(async (opp) => {
            const skills = await fetchOpportunitySkills(opp.id);
            return {
                ...opp,
                requiredSkills: skills,
            };
        }));
        res.status(200).json({
            success: true,
            opportunities: opportunitiesWithSkills,
        });
    }
    catch (error) {
        console.error("getIndustryOpportunities error:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching opportunities: " + (error.message || "Database query failed"),
        });
    }
};
// 3. Get Single Opportunity by ID for Industry
export const getIndustryOpportunityById = async (req, res) => {
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
        const [oppRows] = await pool.query(`SELECT * FROM opportunities WHERE id = ? AND industry_id = ?`, [oppId, industryId]);
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
    }
    catch (error) {
        console.error("getIndustryOpportunityById error:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching opportunity details.",
        });
    }
};
// 4. Update Opportunity
export const updateOpportunity = async (req, res) => {
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
        const [existing] = await pool.query(`SELECT id FROM opportunities WHERE id = ? AND industry_id = ?`, [oppId, industryId]);
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
        if (data.requiredSkills && data.requiredSkills.length > 0) {
            const skillIds = data.requiredSkills.map((s) => s.skillId);
            const [existingSkills] = await pool.query(`SELECT id FROM skills WHERE id IN (?)`, [skillIds]);
            if (existingSkills.length !== skillIds.length) {
                res.status(400).json({
                    success: false,
                    message: "One or more specified skills do not exist in the database.",
                });
                return;
            }
        }
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.query(`UPDATE opportunities SET
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
        WHERE id = ? AND industry_id = ?`, [
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
            ]);
            // If requiredSkills explicitly passed, refresh them
            if (data.requiredSkills !== undefined) {
                await connection.query(`DELETE FROM opportunity_skills WHERE opportunity_id = ?`, [oppId]);
                if (data.requiredSkills.length > 0) {
                    const skillValues = data.requiredSkills.map((s) => [
                        oppId,
                        s.skillId,
                        s.requiredProficiency,
                    ]);
                    await connection.query(`INSERT INTO opportunity_skills (opportunity_id, skill_id, required_proficiency) VALUES ?`, [skillValues]);
                }
            }
            await connection.commit();
            const [updatedRows] = await pool.query(`SELECT * FROM opportunities WHERE id = ?`, [oppId]);
            const skills = await fetchOpportunitySkills(oppId);
            res.status(200).json({
                success: true,
                message: "Opportunity updated successfully.",
                opportunity: {
                    ...updatedRows[0],
                    requiredSkills: skills,
                },
            });
        }
        catch (err) {
            await connection.rollback();
            throw err;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error("updateOpportunity error:", error);
        res.status(500).json({
            success: false,
            message: "Server error updating opportunity.",
        });
    }
};
// 5. Delete Opportunity
export const deleteOpportunity = async (req, res) => {
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
        const [existing] = await pool.query(`SELECT id FROM opportunities WHERE id = ? AND industry_id = ?`, [oppId, industryId]);
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
    }
    catch (error) {
        console.error("deleteOpportunity error:", error);
        res.status(500).json({
            success: false,
            message: "Server error deleting opportunity.",
        });
    }
};
// 6. Publish Opportunity
export const publishOpportunity = async (req, res) => {
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
        const [existing] = await pool.query(`SELECT * FROM opportunities WHERE id = ? AND industry_id = ?`, [oppId, industryId]);
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
        await pool.query(`UPDATE opportunities SET status = 'published', updated_at = NOW() WHERE id = ?`, [oppId]);
        const [updatedRows] = await pool.query(`SELECT * FROM opportunities WHERE id = ?`, [oppId]);
        const skills = await fetchOpportunitySkills(oppId);
        res.status(200).json({
            success: true,
            message: "Opportunity published successfully.",
            opportunity: {
                ...updatedRows[0],
                requiredSkills: skills,
            },
        });
    }
    catch (error) {
        console.error("publishOpportunity error:", error);
        res.status(500).json({
            success: false,
            message: "Server error publishing opportunity.",
        });
    }
};
// 7. Close Opportunity
export const closeOpportunity = async (req, res) => {
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
        const [existing] = await pool.query(`SELECT id FROM opportunities WHERE id = ? AND industry_id = ?`, [oppId, industryId]);
        if (!existing || existing.length === 0) {
            res.status(404).json({
                success: false,
                message: "Opportunity not found or access denied.",
            });
            return;
        }
        await pool.query(`UPDATE opportunities SET status = 'closed', updated_at = NOW() WHERE id = ?`, [oppId]);
        const [updatedRows] = await pool.query(`SELECT * FROM opportunities WHERE id = ?`, [oppId]);
        const skills = await fetchOpportunitySkills(oppId);
        res.status(200).json({
            success: true,
            message: "Opportunity closed successfully.",
            opportunity: {
                ...updatedRows[0],
                requiredSkills: skills,
            },
        });
    }
    catch (error) {
        console.error("closeOpportunity error:", error);
        res.status(500).json({
            success: false,
            message: "Server error closing opportunity.",
        });
    }
};
// 8. Get Public Published Opportunities (For Students)
export const getPublicPublishedOpportunities = async (req, res) => {
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
        const queryParams = [];
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
        const [oppRows] = await pool.query(query, queryParams);
        const opportunitiesWithSkills = await Promise.all(oppRows.map(async (opp) => {
            const skills = await fetchOpportunitySkills(opp.id);
            return {
                ...opp,
                requiredSkills: skills,
            };
        }));
        res.status(200).json({
            success: true,
            opportunities: opportunitiesWithSkills,
        });
    }
    catch (error) {
        console.error("getPublicPublishedOpportunities error:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching public opportunities.",
        });
    }
};
