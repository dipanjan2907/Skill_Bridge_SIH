import pool from "../config/db.js";
import { SkillDemandService } from "../services/demand.service.js";
/**
 * Helper to resolve student_profile id from authenticated user_id
 */
const getStudentProfileIdByUserId = async (userId) => {
    const [rows] = await pool.query(`SELECT id FROM student_profiles WHERE user_id = ?`, [userId]);
    if (!rows || rows.length === 0)
        return null;
    return rows[0].id;
};
/**
 * GET /api/dashboard/industry-demand
 * Returns top 5 highest-demanded skills based on active/published opportunities on SkillBridge.
 */
export const getIndustryDemand = async (req, res) => {
    try {
        const result = await SkillDemandService.calculateSkillDemand();
        const limitParam = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
        const responseData = (limitParam && !isNaN(limitParam)) ? result.data.slice(0, limitParam) : result.data;
        res.status(200).json({
            success: true,
            data: responseData,
            meta: result.meta,
        });
    }
    catch (error) {
        console.error("getIndustryDemand error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to calculate industry demand: " + (error.message || "Database error"),
        });
    }
};
/**
 * GET /api/dashboard/skills-to-watch
 * Returns student-specific skills to watch by comparing the authenticated student's skills
 * against real industry demand from published opportunities in the database.
 */
export const getSkillsToWatch = async (req, res) => {
    try {
        let studentId = null;
        if (req.user?.id) {
            studentId = await getStudentProfileIdByUserId(req.user.id);
        }
        // 1. Get total number of published, active opportunities in DB
        const [totalRows] = await pool.query(`SELECT COUNT(*) AS totalOpportunities
       FROM opportunities o
       WHERE o.status = 'published'
         AND (o.application_deadline IS NULL OR o.application_deadline >= CURDATE())`);
        const totalOpportunities = Number(totalRows[0]?.totalOpportunities || 0);
        // 2. Aggregate industry demand skills from opportunity_skills or master skills table
        const [demandRows] = await pool.query(`SELECT 
        s.id AS skillId,
        s.name AS skillName,
        COALESCE(s.category, 'Technical') AS category,
        COUNT(DISTINCT os.opportunity_id) AS opportunityCount,
        COALESCE(ROUND(AVG(os.required_proficiency)), 75) AS avgRequiredProficiency
       FROM skills s
       LEFT JOIN opportunity_skills os ON s.id = os.skill_id
       LEFT JOIN opportunities o ON os.opportunity_id = o.id 
         AND o.status = 'published' 
         AND (o.application_deadline IS NULL OR o.application_deadline >= CURDATE())
       GROUP BY s.id, s.name, s.category
       HAVING opportunityCount > 0 OR s.id IN (
         SELECT skill_id FROM opportunity_skills
       )
       ORDER BY opportunityCount DESC, avgRequiredProficiency DESC`);
        let candidateSkills = demandRows;
        // Fallback if no opportunity_skills exist yet in database: query master skills table
        if (candidateSkills.length === 0) {
            const [masterRows] = await pool.query(`SELECT id AS skillId, name AS skillName, COALESCE(category, 'Technical') AS category, 0 AS opportunityCount, 75 AS avgRequiredProficiency FROM skills ORDER BY id ASC LIMIT 10`);
            candidateSkills = masterRows;
        }
        // 3. Query authenticated student's assessed skills if student profile exists
        const studentSkillMap = new Map();
        if (studentId) {
            const [studentSkillRows] = await pool.query(`SELECT ss.skill_id AS skillId, ss.proficiency_score AS proficiencyScore, ss.verification_source AS verificationSource
         FROM student_skills ss
         WHERE ss.student_id = ?`, [studentId]);
            studentSkillRows.forEach((r) => {
                studentSkillMap.set(Number(r.skillId), {
                    proficiency: r.proficiencyScore !== null && r.proficiencyScore !== undefined ? Number(r.proficiencyScore) : 0,
                    verified: Boolean(r.verificationSource),
                });
            });
        }
        // 4. Compute student-specific gap metrics for each candidate skill
        const skillsToWatch = candidateSkills.map((row) => {
            const skillId = Number(row.skillId);
            const skillName = String(row.skillName);
            const category = String(row.category || "Technical");
            const opportunityCount = Number(row.opportunityCount || 0);
            // Industry demand level percentage
            const demandPercentage = totalOpportunities > 0
                ? Math.min(100, Math.round((opportunityCount / totalOpportunities) * 100))
                : 0;
            const industryDemand = Number(row.avgRequiredProficiency || 75);
            const studentSkillInfo = studentSkillMap.get(skillId);
            const hasAssessed = Boolean(studentSkillInfo && studentSkillInfo.proficiency > 0);
            const userLevel = hasAssessed ? studentSkillInfo.proficiency : 0;
            const gap = Math.max(0, industryDemand - userLevel);
            let action;
            if (!hasAssessed) {
                action = "Take Assessment";
            }
            else if (userLevel < industryDemand) {
                action = "Improve Skill";
            }
            else {
                action = "Industry Ready";
            }
            return {
                skillId,
                skillName,
                category,
                opportunityCount,
                demandPercentage,
                industryDemand,
                userLevel,
                hasAssessed,
                gap,
                action,
            };
        });
        // 5. Prioritize skills: skills needing assessment or improvement first (sorted by gap / demand), then industry ready skills
        skillsToWatch.sort((a, b) => {
            const aPriority = a.action !== "Industry Ready" ? 1 : 0;
            const bPriority = b.action !== "Industry Ready" ? 1 : 0;
            if (bPriority !== aPriority) {
                return bPriority - aPriority;
            }
            if (b.gap !== a.gap) {
                return b.gap - a.gap;
            }
            return b.opportunityCount - a.opportunityCount;
        });
        res.status(200).json({
            success: true,
            data: skillsToWatch.slice(0, 10),
            meta: { totalOpportunities },
        });
    }
    catch (error) {
        console.error("getSkillsToWatch error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to calculate student skills to watch: " + (error.message || "Database error"),
        });
    }
};
