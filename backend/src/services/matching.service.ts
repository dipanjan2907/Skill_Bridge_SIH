import { getMatchCategory } from "../constants/matching.constants.js";

export interface StudentSkillItem {
  skillId: number;
  skillName: string;
  proficiencyScore: number | null;
}

export interface OpportunitySkillItem {
  skillId: number;
  skillName: string;
  requiredProficiency: number;
}

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

export interface MatchResult {
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

export class MatchingService {
  /**
   * Deterministically calculates match score and breakdown between a student's skills
   * and an opportunity's required skills.
   */
  public static calculateMatch(
    studentSkills: StudentSkillItem[],
    requiredSkills: OpportunitySkillItem[]
  ): MatchResult {
    const hasStudentSkills = studentSkills.length > 0;
    const hasRequiredSkills = requiredSkills.length > 0;

    // Edge Case: Opportunity has no required skills
    if (!hasRequiredSkills) {
      return {
        matchScore: null,
        matchCategory: "Match Unavailable",
        hasStudentSkills,
        hasRequiredSkills: false,
        requiredSkills: [],
        summary: {
          matchedSkills: 0,
          partialSkills: 0,
          missingSkills: 0,
          totalRequiredSkills: 0,
        },
        skillsToImprove: [],
      };
    }

    // Map student skills by skillId for O(1) lookup
    const studentSkillMap = new Map<number, number | null>();
    studentSkills.forEach((s) => {
      studentSkillMap.set(s.skillId, s.proficiencyScore);
    });

    let matchedSkills = 0;
    let partialSkills = 0;
    let missingSkills = 0;
    let totalMatchPercentageSum = 0;

    const breakdownList: SkillMatchBreakdown[] = [];
    const skillsToImprove: SkillToImprove[] = [];

    for (const reqSkill of requiredSkills) {
      const studentProficiency = studentSkillMap.get(reqSkill.skillId);
      const isAssessed = studentProficiency !== undefined && studentProficiency !== null;

      let matchPercentage = 0;
      let status: "matched" | "partial" | "missing";

      if (!isAssessed) {
        // Missing skill
        matchPercentage = 0;
        status = "missing";
        missingSkills++;
      } else {
        const studentScore = Number(studentProficiency);
        const reqScore = Number(reqSkill.requiredProficiency);

        if (studentScore >= reqScore) {
          // Fully matched
          matchPercentage = 100;
          status = "matched";
          matchedSkills++;
        } else {
          // Partial skill match
          const safeReq = reqScore > 0 ? reqScore : 1;
          matchPercentage = Math.min(100, Math.round((studentScore / safeReq) * 100));
          status = "partial";
          partialSkills++;
        }
      }

      totalMatchPercentageSum += matchPercentage;

      const breakdownItem: SkillMatchBreakdown = {
        skillId: reqSkill.skillId,
        skillName: reqSkill.skillName,
        requiredProficiency: reqSkill.requiredProficiency,
        studentProficiency: isAssessed ? studentProficiency : null,
        matchPercentage,
        status,
      };

      breakdownList.push(breakdownItem);

      if (status === "partial" || status === "missing") {
        skillsToImprove.push({
          skillId: reqSkill.skillId,
          skillName: reqSkill.skillName,
          requiredProficiency: reqSkill.requiredProficiency,
          studentProficiency: isAssessed ? studentProficiency : null,
          status,
        });
      }
    }

    // Edge Case: Student has no assessed skills at all
    if (!hasStudentSkills) {
      return {
        matchScore: null,
        matchCategory: "Incomplete Profile",
        hasStudentSkills: false,
        hasRequiredSkills: true,
        requiredSkills: breakdownList,
        summary: {
          matchedSkills: 0,
          partialSkills: 0,
          missingSkills: requiredSkills.length,
          totalRequiredSkills: requiredSkills.length,
        },
        skillsToImprove,
      };
    }

    // Calculate equal-weight average across all required skills
    const rawAverage = totalMatchPercentageSum / requiredSkills.length;
    const finalScore = Math.min(100, Math.round(rawAverage));
    const matchCategory = getMatchCategory(finalScore);

    return {
      matchScore: finalScore,
      matchCategory,
      hasStudentSkills: true,
      hasRequiredSkills: true,
      requiredSkills: breakdownList,
      summary: {
        matchedSkills,
        partialSkills,
        missingSkills,
        totalRequiredSkills: requiredSkills.length,
      },
      skillsToImprove,
    };
  }
}
