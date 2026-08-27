import pool from "../config/db.js";
import { MatchingService } from "../services/matching.service.js";
// Helper to resolve student_profile id from authenticated user_id
const getStudentProfileIdByUserId = async (userId) => {
    const [rows] = await pool.query(`SELECT id FROM student_profiles WHERE user_id = ?`, [userId]);
    if (!rows || rows.length === 0)
        return null;
    return rows[0].id;
};
/**
 * GET /api/student/opportunities/:opportunityId/match
 * Calculates match breakdown for a specific opportunity for the authenticated student.
 */
export const getOpportunityMatch = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const studentId = await getStudentProfileIdByUserId(req.user.id);
        if (!studentId) {
            res.status(403).json({
                success: false,
                message: "Student profile not found. Please complete student onboarding.",
            });
            return;
        }
        const oppId = parseInt(String(req.params.opportunityId), 10);
        if (isNaN(oppId)) {
            res.status(400).json({ success: false, message: "Invalid opportunity ID." });
            return;
        }
        // 1. Fetch Opportunity Details
        const [oppRows] = await pool.query(`SELECT 
        o.*,
        ip.company_name,
        ip.logo AS company_logo
       FROM opportunities o
       JOIN industry_profiles ip ON o.industry_id = ip.id
       WHERE o.id = ?`, [oppId]);
        if (!oppRows || oppRows.length === 0) {
            res.status(404).json({ success: false, message: "Opportunity not found." });
            return;
        }
        const opp = oppRows[0];
        // 2. Fetch Opportunity Required Skills
        const [reqSkillRows] = await pool.query(`SELECT 
        os.skill_id AS skillId,
        s.name AS skillName,
        os.required_proficiency AS requiredProficiency
       FROM opportunity_skills os
       JOIN skills s ON os.skill_id = s.id
       WHERE os.opportunity_id = ?`, [oppId]);
        // 3. Fetch Student Assessed Skills
        const [studentSkillRows] = await pool.query(`SELECT 
        ss.skill_id AS skillId,
        s.name AS skillName,
        ss.proficiency_score AS proficiencyScore
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE ss.student_id = ?`, [studentId]);
        // 4. Fetch Student Application Status for this Opportunity
        const [appRows] = await pool.query(`SELECT id, status FROM applications WHERE student_id = ? AND opportunity_id = ?`, [studentId, oppId]);
        const hasApplied = appRows.length > 0;
        const applicationStatus = hasApplied ? appRows[0].status : null;
        // 5. Calculate Match Score & Breakdown
        const matchResult = MatchingService.calculateMatch(studentSkillRows, reqSkillRows);
        res.status(200).json({
            success: true,
            opportunityId: oppId,
            opportunityTitle: opp.title,
            companyName: opp.company_name,
            companyLogo: opp.company_logo,
            hasApplied,
            applicationStatus,
            ...matchResult,
        });
    }
    catch (error) {
        console.error("getOpportunityMatch error:", error);
        res.status(500).json({
            success: false,
            message: "Server error calculating opportunity match: " + (error.message || "Database error"),
        });
    }
};
/**
 * GET /api/student/opportunities/recommended?limit=10
 * Returns published opportunities ranked by student match score.
 */
export const getRecommendedOpportunities = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const studentId = await getStudentProfileIdByUserId(req.user.id);
        if (!studentId) {
            res.status(403).json({
                success: false,
                message: "Student profile not found.",
            });
            return;
        }
        // Limit calculation
        const limitParam = parseInt(String(req.query.limit || "10"), 10);
        const limit = isNaN(limitParam) ? 10 : Math.min(Math.max(limitParam, 1), 50);
        // 1. Fetch Student Skills in 1 single query
        const [studentSkillRows] = await pool.query(`SELECT 
        ss.skill_id AS skillId,
        s.name AS skillName,
        ss.proficiency_score AS proficiencyScore
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE ss.student_id = ?`, [studentId]);
        const studentSkills = studentSkillRows;
        // 2. Fetch Student Applications in 1 single query
        const [appRows] = await pool.query(`SELECT opportunity_id, status FROM applications WHERE student_id = ?`, [studentId]);
        const applicationMap = new Map();
        appRows.forEach((app) => {
            applicationMap.set(app.opportunity_id, app.status);
        });
        // 3. Fetch Published & Non-Expired Opportunities
        const [oppRows] = await pool.query(`SELECT 
        o.id,
        o.industry_id,
        o.type,
        o.title,
        o.description,
        o.location,
        o.work_mode,
        o.stipend_min,
        o.stipend_max,
        o.duration,
        o.eligibility,
        o.application_deadline,
        o.status,
        o.created_at,
        ip.company_name,
        ip.logo AS company_logo
       FROM opportunities o
       JOIN industry_profiles ip ON o.industry_id = ip.id
       WHERE o.status = 'published'
         AND (o.application_deadline IS NULL OR o.application_deadline >= CURDATE())
       ORDER BY o.created_at DESC`);
        if (!oppRows || oppRows.length === 0) {
            res.status(200).json({
                success: true,
                count: 0,
                recommendations: [],
            });
            return;
        }
        const oppIds = oppRows.map((o) => o.id);
        // 4. Batch Fetch Required Skills for all published opportunities (Avoid N+1)
        const [oppSkillRows] = await pool.query(`SELECT 
        os.opportunity_id,
        os.skill_id AS skillId,
        s.name AS skillName,
        os.required_proficiency AS requiredProficiency
       FROM opportunity_skills os
       JOIN skills s ON os.skill_id = s.id
       WHERE os.opportunity_id IN (?)`, [oppIds]);
        // Group required skills by opportunity_id
        const oppSkillsMap = new Map();
        oppSkillRows.forEach((row) => {
            const oppId = row.opportunity_id;
            if (!oppSkillsMap.has(oppId)) {
                oppSkillsMap.set(oppId, []);
            }
            oppSkillsMap.get(oppId).push({
                skillId: row.skillId,
                skillName: row.skillName,
                requiredProficiency: row.requiredProficiency,
            });
        });
        // 5. Calculate Match Score for each opportunity
        const recommendations = oppRows.map((opp) => {
            const requiredSkills = oppSkillsMap.get(opp.id) || [];
            const matchResult = MatchingService.calculateMatch(studentSkills, requiredSkills);
            const appStatus = applicationMap.get(opp.id) || null;
            return {
                opportunityId: opp.id,
                title: opp.title,
                description: opp.description,
                type: opp.type,
                companyName: opp.company_name,
                companyLogo: opp.company_logo,
                location: opp.location,
                workMode: opp.work_mode,
                stipendMin: opp.stipend_min,
                stipendMax: opp.stipend_max,
                applicationDeadline: opp.application_deadline,
                createdAt: opp.created_at,
                hasApplied: Boolean(appStatus),
                applicationStatus: appStatus,
                matchScore: matchResult.matchScore,
                matchCategory: matchResult.matchCategory,
                hasStudentSkills: matchResult.hasStudentSkills,
                hasRequiredSkills: matchResult.hasRequiredSkills,
                matchedSkillsCount: matchResult.summary.matchedSkills,
                partialSkillsCount: matchResult.summary.partialSkills,
                missingSkillsCount: matchResult.summary.missingSkills,
                totalRequiredSkills: matchResult.summary.totalRequiredSkills,
                requiredSkills: matchResult.requiredSkills,
                skillsToImprove: matchResult.skillsToImprove,
            };
        });
        // 6. Sort Recommendations by Match Score DESC, then created_at DESC
        recommendations.sort((a, b) => {
            if (a.matchScore !== null && b.matchScore !== null) {
                if (b.matchScore !== a.matchScore) {
                    return b.matchScore - a.matchScore;
                }
            }
            else if (a.matchScore !== null) {
                return -1; // a has match score, b does not -> a comes first
            }
            else if (b.matchScore !== null) {
                return 1;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        // 7. Apply limit
        const slicedRecommendations = recommendations.slice(0, limit);
        res.status(200).json({
            success: true,
            count: slicedRecommendations.length,
            totalCount: recommendations.length,
            recommendations: slicedRecommendations,
        });
    }
    catch (error) {
        console.error("getRecommendedOpportunities error:", error);
        res.status(500).json({
            success: false,
            message: "Server error fetching recommended opportunities: " + (error.message || "Database error"),
        });
    }
};
