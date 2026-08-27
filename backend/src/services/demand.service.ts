import pool from "../config/db.js";
import type { RowDataPacket } from "mysql2";
import { getDemandLevel } from "../constants/demand.constants.js";

export interface SkillDemandItem {
  skillId: number;
  skillName: string;
  category: string;
  opportunityCount: number;
  demandPercentage: number;
  demandLevel: string;
}

export interface SkillDemandResult {
  data: SkillDemandItem[];
  meta: {
    totalOpportunities: number;
  };
}

export class SkillDemandService {
  /**
   * Calculates real-time skill demand across published and active opportunities in SkillBridge.
   * Demand Percentage = (Distinct opportunities requiring skill / Total active published opportunities) * 100
   */
  public static async calculateSkillDemand(): Promise<SkillDemandResult> {
    // 1. Get total number of published, active/non-expired opportunities
    const [totalRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS totalOpportunities
       FROM opportunities o
       WHERE o.status = 'published'
         AND (o.application_deadline IS NULL OR o.application_deadline >= CURDATE())`
    );

    const totalOpportunities = Number(totalRows[0]?.totalOpportunities || 0);

    // If no published active opportunities exist in DB
    if (totalOpportunities === 0) {
      return {
        data: [],
        meta: { totalOpportunities: 0 },
      };
    }

    // 2. Aggregate count of distinct opportunities requiring each skill
    const [demandRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        s.id AS skillId,
        s.name AS skillName,
        COALESCE(s.category, 'Technical') AS category,
        COUNT(DISTINCT os.opportunity_id) AS opportunityCount
       FROM skills s
       JOIN opportunity_skills os ON s.id = os.skill_id
       JOIN opportunities o ON os.opportunity_id = o.id
       WHERE o.status = 'published'
         AND (o.application_deadline IS NULL OR o.application_deadline >= CURDATE())
       GROUP BY s.id, s.name, s.category
       ORDER BY opportunityCount DESC, s.name ASC`
    );

    // 3. Map into SkillDemandItem structure with deterministic demand percentage and level
    const data: SkillDemandItem[] = demandRows.map((row) => {
      const oppCount = Number(row.opportunityCount || 0);
      const demandPercentage = Math.min(
        100,
        Math.round((oppCount / totalOpportunities) * 100)
      );
      const demandLevel = getDemandLevel(demandPercentage);

      return {
        skillId: Number(row.skillId),
        skillName: String(row.skillName),
        category: String(row.category || "Technical"),
        opportunityCount: oppCount,
        demandPercentage,
        demandLevel,
      };
    });

    // 4. Sort descending by demandPercentage, then opportunityCount
    data.sort((a, b) => {
      if (b.demandPercentage !== a.demandPercentage) {
        return b.demandPercentage - a.demandPercentage;
      }
      return b.opportunityCount - a.opportunityCount;
    });

    return {
      data,
      meta: { totalOpportunities },
    };
  }
}
