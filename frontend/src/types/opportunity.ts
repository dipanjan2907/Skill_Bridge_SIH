export type OpportunityType = "internship" | "job";
export type OpportunityStatus = "draft" | "published" | "closed";

export interface OpportunitySkill {
  id?: number;
  opportunity_id?: number;
  skill_id: number;
  skill_name?: string;
  category?: string;
  required_proficiency: number;
}

export interface Opportunity {
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
  updated_at?: string;
  company_name?: string;
  company_logo?: string;
  industry_sector?: string;
  company_location?: string;
  requiredSkills: OpportunitySkill[];
}

export interface CreateOpportunityPayload {
  type: OpportunityType;
  title: string;
  description: string;
  location?: string;
  workMode?: string;
  stipendMin?: number | null;
  stipendMax?: number | null;
  duration?: string;
  eligibility?: string;
  applicationDeadline?: string;
  status?: OpportunityStatus;
  requiredSkills: {
    skillId?: number;
    skillName?: string;
    requiredProficiency: number;
  }[];
}

export interface MasterSkill {
  id: number;
  name: string;
  category?: string;
}
