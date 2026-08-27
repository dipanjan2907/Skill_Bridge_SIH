import type { RowDataPacket } from "mysql2";

export type OpportunityType = "internship" | "job";
export type OpportunityStatus = "draft" | "published" | "closed";

export interface RequiredSkillInput {
  skillId: number;
  requiredProficiency: number;
}

export interface OpportunitySkill {
  id?: number;
  opportunity_id?: number;
  skill_id: number;
  skill_name?: string;
  category?: string;
  required_proficiency: number;
}

export interface OpportunityRow extends RowDataPacket {
  id: number;
  industry_id: number;
  type: OpportunityType;
  title: string;
  description: string;
  location: string | null;
  work_mode: string;
  stipend_min: number | null;
  stipend_max: number | null;
  duration: string | null;
  eligibility: string | null;
  application_deadline: string | null;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
  company_name?: string;
  company_logo?: string;
}
