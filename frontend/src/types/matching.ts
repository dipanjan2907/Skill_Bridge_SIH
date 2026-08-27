export interface SkillMatchBreakdown {
  skillId: number;
  skillName: string;
  requiredProficiency: number;
  studentProficiency: number | null;
  matchPercentage: number;
  status: "matched" | "partial" | "missing";
}

export interface SkillToImprove {
  skillId: number;
  skillName: string;
  requiredProficiency: number;
  studentProficiency: number | null;
  status: "partial" | "missing";
}

export interface OpportunityMatchData {
  success: boolean;
  opportunityId: number;
  opportunityTitle: string;
  companyName: string;
  companyLogo?: string;
  hasApplied: boolean;
  applicationStatus: string | null;
  matchScore: number | null;
  matchCategory: string;
  hasStudentSkills: boolean;
  hasRequiredSkills: boolean;
  requiredSkills: SkillMatchBreakdown[];
  summary: {
    matchedSkills: number;
    partialSkills: number;
    missingSkills: number;
    totalRequiredSkills: number;
  };
  skillsToImprove: SkillToImprove[];
}

export interface RecommendedOpportunity {
  opportunityId: number;
  title: string;
  description?: string;
  type: "internship" | "job";
  companyName: string;
  companyLogo?: string;
  location?: string;
  workMode: string;
  stipendMin?: number;
  stipendMax?: number;
  applicationDeadline?: string;
  createdAt: string;
  hasApplied: boolean;
  applicationStatus: string | null;
  matchScore: number | null;
  matchCategory: string;
  hasStudentSkills: boolean;
  hasRequiredSkills: boolean;
  matchedSkillsCount: number;
  partialSkillsCount: number;
  missingSkillsCount: number;
  totalRequiredSkills: number;
  requiredSkills: SkillMatchBreakdown[];
  skillsToImprove: SkillToImprove[];
}
