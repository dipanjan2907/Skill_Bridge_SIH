import pool from "../config/db.js";
import { getDemandLevel } from "../constants/demand.constants.js";
export class SkillDemandService {
    /**
     * Calculates real-time skill demand across published and active opportunities in SkillBridge.
     * Retrieves ALL skills from the skills table.
     * Demand Percentage = (Distinct opportunities requiring skill / Total active published opportunities) * 100
     * Student Supply = Count of distinct students possessing the skill in student_skills
     */
    static async calculateSkillDemand() {
        // 1. Get total number of published, active/non-expired opportunities
        const [totalRows] = await pool.query(`SELECT COUNT(*) AS totalOpportunities
       FROM opportunities o
       WHERE o.status = 'published'
         AND (o.application_deadline IS NULL OR o.application_deadline >= CURDATE())`);
        const totalOpportunities = Number(totalRows[0]?.totalOpportunities || 0);
        // 2. Aggregate count of distinct opportunities requiring each skill AND student supply for ALL skills
        const [demandRows] = await pool.query(`SELECT 
        s.id AS skillId,
        s.name AS skillName,
        COALESCE(s.category, 'Technical') AS category,
        COUNT(DISTINCT os.opportunity_id) AS opportunityCount,
        COUNT(DISTINCT ss.student_id) AS studentCount
       FROM skills s
       LEFT JOIN opportunity_skills os ON s.id = os.skill_id
       LEFT JOIN opportunities o ON os.opportunity_id = o.id
         AND o.status = 'published'
         AND (o.application_deadline IS NULL OR o.application_deadline >= CURDATE())
       LEFT JOIN student_skills ss ON s.id = ss.skill_id
       GROUP BY s.id, s.name, s.category
       ORDER BY opportunityCount DESC, studentCount DESC, s.name ASC`);
        // 3. Map into SkillDemandItem structure with deterministic demand percentage and level
        const data = demandRows
            .filter((row) => Number(row.opportunityCount || 0) > 0)
            .map((row) => {
            const oppCount = Number(row.opportunityCount || 0);
            const studentCount = Number(row.studentCount || 0);
            const demandPercentage = totalOpportunities > 0
                ? Math.min(100, Math.round((oppCount / totalOpportunities) * 100))
                : 0;
            const demandLevel = getDemandLevel(demandPercentage);
            return {
                skillId: Number(row.skillId),
                skillName: String(row.skillName),
                category: String(row.category || "Technical"),
                opportunityCount: oppCount,
                demandPercentage,
                demandLevel,
                studentCount,
            };
        });
        // 4. Sort descending by demandPercentage, then opportunityCount, then studentCount
        data.sort((a, b) => {
            if (b.demandPercentage !== a.demandPercentage) {
                return b.demandPercentage - a.demandPercentage;
            }
            if (b.opportunityCount !== a.opportunityCount) {
                return b.opportunityCount - a.opportunityCount;
            }
            return b.studentCount - a.studentCount;
        });
        return {
            data,
            meta: { totalOpportunities },
        };
    }
}
