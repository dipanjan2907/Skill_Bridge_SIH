import pool from "../config/db.js";
import { SkillDemandService } from "../services/demand.service.js";
import { getDemandLevel } from "../constants/demand.constants.js";
/**
 * GET /api/dashboard/industry-demand
 * Returns top 5 highest-demanded skills based on active/published opportunities on SkillBridge.
 */
export const getIndustryDemand = async (req, res) => {
    try {
        const result = await SkillDemandService.calculateSkillDemand();
        const isAll = req.query.all === "true";
        const limitParam = req.query.limit ? parseInt(String(req.query.limit), 10) : 5;
        const limit = isNaN(limitParam) ? 5 : limitParam;
        const responseData = isAll ? result.data : result.data.slice(0, limit);
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
 * Returns top industry-relevant skills ranked by real platform demand.
 * If total active opportunities are low, includes master skills as fallback.
 */
export const getSkillsToWatch = async (_req, res) => {
    try {
        const result = await SkillDemandService.calculateSkillDemand();
        let skillsToWatch = [...result.data];
        // If fewer than 6 skills have active demand, complement with master skills list
        if (skillsToWatch.length < 6) {
            const existingIds = new Set(skillsToWatch.map((s) => s.skillId));
            const [masterRows] = await pool.query(`SELECT id, name, COALESCE(category, 'Technical') AS category FROM skills ORDER BY id ASC LIMIT 10`);
            masterRows.forEach((row) => {
                const id = Number(row.id);
                if (!existingIds.has(id) && skillsToWatch.length < 6) {
                    skillsToWatch.push({
                        skillId: id,
                        skillName: String(row.name),
                        category: String(row.category || "Technical"),
                        opportunityCount: 0,
                        demandPercentage: 0,
                        demandLevel: getDemandLevel(0),
                    });
                    existingIds.add(id);
                }
            });
        }
        res.status(200).json({
            success: true,
            data: skillsToWatch.slice(0, 6),
            meta: result.meta,
        });
    }
    catch (error) {
        console.error("getSkillsToWatch error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch skills to watch: " + (error.message || "Database error"),
        });
    }
};
