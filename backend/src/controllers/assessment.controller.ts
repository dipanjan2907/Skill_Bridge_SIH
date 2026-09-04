import type { Request, Response } from "express";
import pool from "../config/db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import {
  createQuestionSchema,
  updateQuestionSchema,
  rejectQuestionSchema,
  createSkillRequestSchema,
} from "../schemas/assessment.schema.js";

/**
 * Helper to safely parse route parameters to integer
 */
const parseParamId = (idParam: string | string[] | undefined): number => {
  if (!idParam) return NaN;
  const idStr = Array.isArray(idParam) ? idParam[0] : String(idParam);
  return parseInt(idStr, 10);
};

/**
 * Helper to normalize question text for duplicate detection
 */
const normalizeText = (text: string): string => {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

/**
 * Helper to get industry profile ID for a user ID
 */
const getIndustryProfileForUser = async (
  userId: number,
): Promise<{
  id: number;
  company_name: string;
  verification_status: string;
} | null> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, company_name, verification_status FROM industry_profiles WHERE user_id = ?`,
    [userId],
  );
  if (rows.length === 0) return null;
  return {
    id: rows[0].id,
    company_name: rows[0].company_name,
    verification_status: rows[0].verification_status,
  };
};

/**
 * Smart Question Selection Engine for Student Assessments
 * 1. Only selects APPROVED questions.
 * 2. Target 15 questions (distribution: 4 Easy, 8 Medium, 3 Hard).
 * 3. Excludes/minimizes questions previously attempted by the student for this skill.
 * 4. Fallback to skill family if exact skill has fewer than target questions.
 * 5. Randomizes order and balances contributor diversity.
 */
const fetchSmartAssessmentQuestions = async (
  skillId: number,
  userId?: number,
  includeAnswers: boolean = false,
) => {
  // 1. Get requested skill
  const [skillRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, category FROM skills WHERE id = ?`,
    [skillId],
  );

  if (skillRows.length === 0) {
    return { skill: null, questions: [], attemptId: null };
  }

  const requestedSkill = skillRows[0];
  const selectFields = includeAnswers
    ? `aq.id, aq.skill_id, aq.question, aq.option_a, aq.option_b, aq.option_c, aq.option_d, aq.correct_option, aq.difficulty, aq.explanation, aq.source_type`
    : `aq.id, aq.skill_id, aq.question, aq.option_a, aq.option_b, aq.option_c, aq.option_d, aq.difficulty`;

  // 2. Identify student profile ID if student user
  let studentProfileId: number | null = null;
  if (userId) {
    const [stRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM student_profiles WHERE user_id = ?`,
      [userId],
    );
    if (stRows.length > 0) {
      studentProfileId = stRows[0].id;
    }
  }

  // 3. Find previously attempted question IDs for this student on this skill
  let attemptedQuestionIds: Set<number> = new Set();
  if (studentProfileId) {
    const [attRows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT aq.question_id 
       FROM assessment_attempt_questions aq
       JOIN assessment_attempts a ON aq.attempt_id = a.id
       WHERE a.student_id = ? AND a.skill_id = ?`,
      [studentProfileId, skillId],
    );
    attRows.forEach((r) => attemptedQuestionIds.add(r.question_id));
  }

  // 4. Fetch all approved questions for exact skill_id
  let [allApprovedQuestions] = await pool.query<RowDataPacket[]>(
    `SELECT ${selectFields} 
     FROM assessment_questions aq 
     WHERE aq.skill_id = ? AND aq.status = 'approved'
     ORDER BY RAND()`,
    [skillId],
  );

  // If exact skill has no approved questions, use strict skill family fallback
  if (allApprovedQuestions.length === 0) {
    const sName = (requestedSkill.name || "").toLowerCase();
    let whereClause = "";
    const params: any[] = [];

    if (
      sName.includes("sql") ||
      sName.includes("mysql") ||
      sName.includes("relational") ||
      sName.includes("database")
    ) {
      whereClause =
        "(s.name LIKE ? OR s.name LIKE ? OR s.name LIKE ? OR s.name LIKE ?)";
      params.push("%SQL%", "%MySQL%", "%Relational%", "%Database%");
    } else if (sName.includes("react")) {
      whereClause = "s.name LIKE ?";
      params.push("%React%");
    } else if (sName.includes("node")) {
      whereClause = "s.name LIKE ?";
      params.push("%Node%");
    } else if (sName.includes("python")) {
      whereClause = "s.name LIKE ?";
      params.push("%Python%");
    } else if (
      sName.includes("typescript") ||
      sName.includes("ts") ||
      sName.includes("javascript") ||
      sName.includes("js")
    ) {
      whereClause = "(s.name LIKE ? OR s.name LIKE ? OR s.name LIKE ?)";
      params.push("%TypeScript%", "%JavaScript%", "%JS%");
    }

    if (whereClause) {
      const [familySkillRows] = await pool.query<RowDataPacket[]>(
        `SELECT s.id 
         FROM skills s 
         JOIN assessment_questions aq ON s.id = aq.skill_id 
         WHERE ${whereClause} AND aq.status = 'approved'
         GROUP BY s.id 
         ORDER BY COUNT(aq.id) DESC 
         LIMIT 1`,
        params,
      );

      if (familySkillRows.length > 0) {
        const fallbackSkillId = familySkillRows[0].id;
        [allApprovedQuestions] = await pool.query<RowDataPacket[]>(
          `SELECT ${selectFields} 
           FROM assessment_questions aq 
           WHERE aq.skill_id = ? AND aq.status = 'approved'
           ORDER BY RAND()`,
          [fallbackSkillId],
        );
      }
    }
  }

  if (allApprovedQuestions.length === 0) {
    return { skill: requestedSkill, questions: [], attemptId: null };
  }

  // 5. Partition questions by difficulty and repeat status
  const easyUnattempted: RowDataPacket[] = [];
  const easyAttempted: RowDataPacket[] = [];
  const mediumUnattempted: RowDataPacket[] = [];
  const mediumAttempted: RowDataPacket[] = [];
  const hardUnattempted: RowDataPacket[] = [];
  const hardAttempted: RowDataPacket[] = [];
  const otherUnattempted: RowDataPacket[] = [];
  const otherAttempted: RowDataPacket[] = [];

  for (const q of allApprovedQuestions) {
    const diff = (q.difficulty || "Medium").trim().toLowerCase();
    const isAttempted = attemptedQuestionIds.has(q.id);

    if (diff === "easy") {
      if (isAttempted) easyAttempted.push(q);
      else easyUnattempted.push(q);
    } else if (diff === "hard") {
      if (isAttempted) hardAttempted.push(q);
      else hardUnattempted.push(q);
    } else if (diff === "medium") {
      if (isAttempted) mediumAttempted.push(q);
      else mediumUnattempted.push(q);
    } else {
      if (isAttempted) otherAttempted.push(q);
      else otherUnattempted.push(q);
    }
  }

  // Target distribution for 15 questions: Easy 4, Medium 8, Hard 3
  const targetTotal = Math.min(15, allApprovedQuestions.length);
  let targetEasy = 4;
  let targetMedium = 8;
  let targetHard = 3;

  if (targetTotal < 15) {
    targetEasy = Math.round(targetTotal * 0.25);
    targetHard = Math.round(targetTotal * 0.2);
    targetMedium = targetTotal - targetEasy - targetHard;
  }

  const selectFromBucket = (
    unattempted: RowDataPacket[],
    attempted: RowDataPacket[],
    count: number,
  ): RowDataPacket[] => {
    const selected: RowDataPacket[] = [];
    const poolUnattempted = [...unattempted];
    const poolAttempted = [...attempted];

    while (selected.length < count && poolUnattempted.length > 0) {
      selected.push(poolUnattempted.shift()!);
    }
    while (selected.length < count && poolAttempted.length > 0) {
      selected.push(poolAttempted.shift()!);
    }
    return selected;
  };

  const selectedEasy = selectFromBucket(
    easyUnattempted,
    easyAttempted,
    targetEasy,
  );
  const selectedMedium = selectFromBucket(
    mediumUnattempted,
    mediumAttempted,
    targetMedium,
  );
  const selectedHard = selectFromBucket(
    hardUnattempted,
    hardAttempted,
    targetHard,
  );

  let selectedQuestions = [...selectedEasy, ...selectedMedium, ...selectedHard];

  // If still need more questions to reach targetTotal, pick remaining available
  if (selectedQuestions.length < targetTotal) {
    const selectedIds = new Set(selectedQuestions.map((q) => q.id));
    const remaining = allApprovedQuestions.filter(
      (q) => !selectedIds.has(q.id),
    );
    while (selectedQuestions.length < targetTotal && remaining.length > 0) {
      selectedQuestions.push(remaining.shift()!);
    }
  }

  // Shuffle selected questions final order
  selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

  // 6. Record attempt in assessment_attempts if student
  let attemptId: number | null = null;
  if (studentProfileId) {
    try {
      const [attemptResult] = await pool.query<ResultSetHeader>(
        `INSERT INTO assessment_attempts (student_id, skill_id, total_questions) VALUES (?, ?, ?)`,
        [studentProfileId, skillId, selectedQuestions.length],
      );
      attemptId = attemptResult.insertId;

      // Seed attempt questions
      for (const q of selectedQuestions) {
        await pool.query(
          `INSERT INTO assessment_attempt_questions (attempt_id, question_id) VALUES (?, ?)`,
          [attemptId, q.id],
        );
      }
    } catch (attErr) {
      console.error("Failed to record assessment attempt:", attErr);
    }
  }

  return { skill: requestedSkill, questions: selectedQuestions, attemptId };
};

// ==========================================
// STUDENT ASSESSMENT CONTROLLERS
// ==========================================

/**
 * GET /api/assessments/questions?skill_id=:skill_id
 * OR GET /api/assessments/questions/:skillId
 * Serves approved questions for a skill using smart selection.
 * SECURITY: Omits `correct_option` and `explanation`.
 */
export const getAssessmentQuestions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const skillIdParam = req.params.skillId || req.query.skill_id;

    if (!skillIdParam) {
      res.status(400).json({ error: "skill_id parameter is required" });
      return;
    }

    const skillId = parseInt(String(skillIdParam), 10);
    if (isNaN(skillId)) {
      res.status(400).json({ error: "Invalid skill_id provided" });
      return;
    }

    const userId = req.user?.id;
    const { skill, questions, attemptId } = await fetchSmartAssessmentQuestions(
      skillId,
      userId,
      false,
    );

    if (!skill) {
      res
        .status(404)
        .json({ error: "Skill not found in master skills registry" });
      return;
    }

    res.status(200).json({
      success: true,
      skill,
      attempt_id: attemptId,
      total_questions: questions.length,
      questions,
    });
  } catch (error: any) {
    console.error("getAssessmentQuestions error:", error);
    res.status(500).json({ error: `Database query failure: ${error.message}` });
  }
};

/**
 * GET /api/assessments/question/:id
 * Serves a single assessment question by ID without correct_option or explanation.
 */
export const getSingleAssessmentQuestion = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const questionId = parseParamId(req.params.id);
    if (isNaN(questionId)) {
      res.status(400).json({ error: "Invalid question id provided" });
      return;
    }

    const [questions] = await pool.query<RowDataPacket[]>(
      `SELECT id, skill_id, question, option_a, option_b, option_c, option_d, difficulty 
       FROM assessment_questions 
       WHERE id = ? AND status = 'approved'`,
      [questionId],
    );

    if (questions.length === 0) {
      res.status(404).json({ error: "Question not found or not approved" });
      return;
    }

    res.status(200).json({
      success: true,
      question: questions[0],
    });
  } catch (error: any) {
    console.error("getSingleAssessmentQuestion error:", error);
    res.status(500).json({ error: `Database query failure: ${error.message}` });
  }
};

/**
 * POST /api/assessments/submit
 * Evaluates student responses server-side against correct options in DB.
 * Calculates score, updates attempts table, updates student_skills proficiency score,
 * and returns explanations ONLY after submission.
 */
export const submitAssessment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { skill_id, attempt_id, answers } = req.body;

    if (!skill_id || !Array.isArray(answers)) {
      res.status(400).json({
        error:
          "skill_id and answers array are required for assessment evaluation",
      });
      return;
    }

    const skillId = parseInt(String(skill_id), 10);

    // Fetch full question records with correct_option and explanation for server evaluation
    const questionIds = answers
      .map((a: any) => parseInt(String(a.question_id), 10))
      .filter((id: number) => !isNaN(id));
    if (questionIds.length === 0) {
      res
        .status(400)
        .json({ error: "No valid question IDs provided in answers" });
      return;
    }

    const [dbQuestions] = await pool.query<RowDataPacket[]>(
      `SELECT id, skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation 
       FROM assessment_questions 
       WHERE id IN (?)`,
      [questionIds],
    );

    const questionMap = new Map<number, RowDataPacket>();
    dbQuestions.forEach((q) => questionMap.set(q.id, q));

    let correctCount = 0;
    const evaluationResults = answers.map(
      (ans: { question_id: number; selected_option: string }) => {
        const q = questionMap.get(ans.question_id);
        if (!q) {
          return {
            question_id: ans.question_id,
            is_correct: false,
            user_option: ans.selected_option,
            correct_option: null,
            correct_option_text: null,
            explanation: "Question record not found in system",
          };
        }

        let normalizedUserOption = (ans.selected_option || "")
          .trim()
          .toUpperCase();
        if (normalizedUserOption.startsWith("OPTION_")) {
          normalizedUserOption = normalizedUserOption.replace("OPTION_", "");
        } else if (normalizedUserOption.length > 1) {
          const raw = (ans.selected_option || "").trim();
          if (raw === q.option_a) normalizedUserOption = "A";
          else if (raw === q.option_b) normalizedUserOption = "B";
          else if (raw === q.option_c) normalizedUserOption = "C";
          else if (raw === q.option_d) normalizedUserOption = "D";
        }

        const correctOptionKey = (q.correct_option || "").trim().toUpperCase();
        let correctOptionText = q.option_a;
        if (correctOptionKey === "B") correctOptionText = q.option_b;
        else if (correctOptionKey === "C") correctOptionText = q.option_c;
        else if (correctOptionKey === "D") correctOptionText = q.option_d;

        const isCorrect = normalizedUserOption === correctOptionKey;
        if (isCorrect) {
          correctCount++;
        }

        return {
          question_id: ans.question_id,
          is_correct: isCorrect,
          user_option: normalizedUserOption,
          correct_option: correctOptionKey,
          correct_option_text: correctOptionText,
          explanation: q.explanation,
        };
      },
    );

    const totalQuestions = answers.length;
    const scorePercentage =
      totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;
    const passed = scorePercentage >= 70;

    // Update attempt tracking in DB if attempt_id exists or if student is logged in
    const userId = req.user?.id;
    let studentProfileId: number | undefined;

    if (userId) {
      const [profileRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM student_profiles WHERE user_id = ?`,
        [userId],
      );
      if (profileRows.length > 0) {
        studentProfileId = profileRows[0].id;
      }
    }

    if (attempt_id) {
      await pool.query(
        `UPDATE assessment_attempts 
         SET score = ?, proficiency_score = ?, correct_count = ?, completed_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [scorePercentage, scorePercentage, correctCount, attempt_id],
      );

      for (const evalItem of evaluationResults) {
        await pool.query(
          `UPDATE assessment_attempt_questions 
           SET selected_option = ?, is_correct = ? 
           WHERE attempt_id = ? AND question_id = ?`,
          [
            evalItem.user_option,
            evalItem.is_correct,
            attempt_id,
            evalItem.question_id,
          ],
        );
      }
    } else if (studentProfileId) {
      const [attRes] = await pool.query<ResultSetHeader>(
        `INSERT INTO assessment_attempts 
         (student_id, skill_id, score, proficiency_score, total_questions, correct_count, completed_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          studentProfileId,
          skillId,
          scorePercentage,
          scorePercentage,
          totalQuestions,
          correctCount,
        ],
      );
      const newAttId = attRes.insertId;

      for (const evalItem of evaluationResults) {
        await pool.query(
          `INSERT INTO assessment_attempt_questions (attempt_id, question_id, selected_option, is_correct)
           VALUES (?, ?, ?, ?)`,
          [
            newAttId,
            evalItem.question_id,
            evalItem.user_option,
            evalItem.is_correct,
          ],
        );
      }
    }

    // Update student_skills table with new proficiency score
    if (studentProfileId) {
      const [existingSkill] = await pool.query<RowDataPacket[]>(
        `SELECT id, proficiency_score, is_badge_earned FROM student_skills WHERE student_id = ? AND skill_id = ?`,
        [studentProfileId, skillId],
      );

      const currentScore =
        existingSkill.length > 0
          ? Number(existingSkill[0].proficiency_score || 0)
          : 0;
      const newScore = Math.max(currentScore, scorePercentage);
      const newBadge = passed || Boolean(existingSkill[0]?.is_badge_earned);

      if (existingSkill.length > 0) {
        await pool.query(
          `UPDATE student_skills 
           SET proficiency_score = ?, 
               verification_source = 'Verified Assessment',
               is_badge_earned = ?
           WHERE student_id = ? AND skill_id = ?`,
          [newScore, newBadge, studentProfileId, skillId],
        );
      } else {
        await pool.query(
          `INSERT INTO student_skills (student_id, skill_id, proficiency_score, verification_source, is_badge_earned)
           VALUES (?, ?, ?, 'Verified Assessment', ?)`,
          [studentProfileId, skillId, newScore, newBadge],
        );
      }

      // Sync score to skill family variations
      const [masterSkill] = await pool.query<RowDataPacket[]>(
        `SELECT name FROM skills WHERE id = ?`,
        [skillId],
      );

      if (masterSkill.length > 0 && masterSkill[0].name) {
        const sName = masterSkill[0].name.toLowerCase();
        let namePattern = "";
        if (sName.includes("react")) namePattern = "%react%";
        else if (sName.includes("typescript") || sName.includes("js"))
          namePattern = "%typescript%";
        else if (sName.includes("node")) namePattern = "%node%";
        else if (sName.includes("sql") || sName.includes("mysql"))
          namePattern = "%sql%";

        if (namePattern) {
          const [familySkills] = await pool.query<RowDataPacket[]>(
            `SELECT id FROM skills WHERE LOWER(name) LIKE ?`,
            [namePattern],
          );

          for (const fSkill of familySkills) {
            if (fSkill.id !== skillId) {
              await pool.query(
                `INSERT INTO student_skills (student_id, skill_id, proficiency_score, verification_source, is_badge_earned)
                 VALUES (?, ?, ?, 'Verified Assessment', ?)
                 ON DUPLICATE KEY UPDATE 
                   proficiency_score = GREATEST(proficiency_score, VALUES(proficiency_score)),
                   verification_source = 'Verified Assessment',
                   is_badge_earned = (is_badge_earned OR VALUES(is_badge_earned))`,
                [studentProfileId, fSkill.id, newScore, newBadge],
              );
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      skill_id: skillId,
      total_questions: totalQuestions,
      correct_answers: correctCount,
      score_percentage: scorePercentage,
      passed,
      results: evaluationResults,
    });
  } catch (error: any) {
    console.error("submitAssessment error:", error);
    res
      .status(500)
      .json({ error: `Assessment evaluation failed: ${error.message}` });
  }
};

// ==========================================
// CONTRIBUTOR (INDUSTRY / FACULTY) CONTROLLERS
// ==========================================

/**
 * GET /api/assessment/questions/my
 * Returns questions submitted by the currently logged-in contributor (industry/faculty).
 */
export const getMyQuestions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const userId = req.user.id;
    const role = (req.user.role || "").toString().toLowerCase();

    let whereClause = "aq.created_by_user_id = ?";
    const params: any[] = [userId];

    if (role === "industry") {
      const indProfile = await getIndustryProfileForUser(userId);
      if (indProfile) {
        whereClause = "(aq.created_by_user_id = ? OR aq.source_company_id = ?)";
        params.push(indProfile.id);
      }
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        aq.id, 
        aq.skill_id, 
        s.name as skill_name, 
        s.category as skill_category,
        aq.question, 
        aq.option_a, 
        aq.option_b, 
        aq.option_c, 
        aq.option_d, 
        aq.correct_option, 
        aq.difficulty, 
        aq.explanation, 
        aq.source_type, 
        aq.status, 
        aq.rejection_reason, 
        aq.created_at,
        aq.updated_at
       FROM assessment_questions aq
       JOIN skills s ON aq.skill_id = s.id
       WHERE ${whereClause}
       ORDER BY aq.created_at DESC`,
      params,
    );

    res.status(200).json({
      success: true,
      total: rows.length,
      questions: rows,
    });
  } catch (error: any) {
    console.error("getMyQuestions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/assessment/questions
 * Contributor submits a new assessment question for an existing skill.
 */
export const createContributorQuestion = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const parsed = createQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      });
      return;
    }

    const {
      skill_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      difficulty,
      explanation,
    } = parsed.data;

    const [skillRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name FROM skills WHERE id = ?`,
      [skill_id],
    );

    if (skillRows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Skill ID does not exist in master skills registry.",
      });
      return;
    }

    const normNewQuestion = normalizeText(question);
    const [existingQuestions] = await pool.query<RowDataPacket[]>(
      `SELECT question FROM assessment_questions WHERE skill_id = ?`,
      [skill_id],
    );

    const isDuplicate = existingQuestions.some(
      (q) => normalizeText(q.question) === normNewQuestion,
    );

    if (isDuplicate) {
      res.status(400).json({
        success: false,
        message:
          "A duplicate or highly similar question already exists for this skill.",
      });
      return;
    }

    const role = (req.user.role || "").toString().toLowerCase();
    let sourceType: "industry" | "faculty" | "admin" = "faculty";
    let sourceCompanyId: number | null = null;
    let initialStatus: "pending" | "approved" = "pending";

    if (role === "admin") {
      sourceType = "admin";
      initialStatus = "approved";
    } else if (role === "industry") {
      sourceType = "industry";
      const indProfile = await getIndustryProfileForUser(req.user.id);
      if (!indProfile) {
        res.status(403).json({
          success: false,
          message: "Industry profile required before submitting questions.",
        });
        return;
      }
      if (indProfile.verification_status !== "approved") {
        res.status(403).json({
          success: false,
          message: "Only verified industry accounts can contribute questions.",
        });
        return;
      }
      sourceCompanyId = indProfile.id;
      initialStatus = "pending";
    } else {
      sourceType = "faculty";
      initialStatus = "pending";
    }

    const [insertResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO assessment_questions 
       (skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation, source_type, source_company_id, created_by_user_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        skill_id,
        question.trim(),
        option_a.trim(),
        option_b.trim(),
        option_c.trim(),
        option_d.trim(),
        correct_option,
        difficulty,
        explanation.trim(),
        sourceType,
        sourceCompanyId,
        req.user.id,
        initialStatus,
      ],
    );

    res.status(201).json({
      success: true,
      message:
        initialStatus === "approved"
          ? "Question created and approved successfully."
          : "Question submitted successfully for Admin review.",
      question_id: insertResult.insertId,
      status: initialStatus,
    });
  } catch (error: any) {
    console.error("createContributorQuestion error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/assessment/questions/:id
 * Edit a question submitted by contributor.
 */
export const updateContributorQuestion = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const questionId = parseParamId(req.params.id);
    if (isNaN(questionId)) {
      res.status(400).json({ success: false, message: "Invalid question ID" });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM assessment_questions WHERE id = ?`,
      [questionId],
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    const q = existing[0];
    const role = (req.user.role || "").toString().toLowerCase();

    if (role !== "admin" && q.created_by_user_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to edit this question.",
      });
      return;
    }

    const parsed = updateQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      });
      return;
    }

    const updates = parsed.data;
    const skill_id = updates.skill_id || q.skill_id;
    const questionText = updates.question || q.question;
    const option_a = updates.option_a || q.option_a;
    const option_b = updates.option_b || q.option_b;
    const option_c = updates.option_c || q.option_c;
    const option_d = updates.option_d || q.option_d;
    const correct_option = updates.correct_option || q.correct_option;
    const difficulty = updates.difficulty || q.difficulty;
    const explanation = updates.explanation || q.explanation;

    const newStatus = role === "admin" ? q.status : "pending";

    await pool.query(
      `UPDATE assessment_questions 
       SET skill_id = ?, question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ?, difficulty = ?, explanation = ?, status = ?, rejection_reason = NULL
       WHERE id = ?`,
      [
        skill_id,
        questionText.trim(),
        option_a.trim(),
        option_b.trim(),
        option_c.trim(),
        option_d.trim(),
        correct_option,
        difficulty,
        explanation.trim(),
        newStatus,
        questionId,
      ],
    );

    res.status(200).json({
      success: true,
      message:
        newStatus === "pending"
          ? "Question updated and resubmitted for Admin review."
          : "Question updated successfully.",
      status: newStatus,
    });
  } catch (error: any) {
    console.error("updateContributorQuestion error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/assessment/questions/:id
 * Delete a question created by contributor.
 */
export const deleteContributorQuestion = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const questionId = parseParamId(req.params.id);
    if (isNaN(questionId)) {
      res.status(400).json({ success: false, message: "Invalid question ID" });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM assessment_questions WHERE id = ?`,
      [questionId],
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    const q = existing[0];
    const role = (req.user.role || "").toString().toLowerCase();

    if (role !== "admin" && q.created_by_user_id !== req.user.id) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to delete this question.",
      });
      return;
    }

    await pool.query(`DELETE FROM assessment_questions WHERE id = ?`, [
      questionId,
    ]);

    res.status(200).json({
      success: true,
      message: "Question deleted successfully.",
    });
  } catch (error: any) {
    console.error("deleteContributorQuestion error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/assessment/skills/request
 * Request addition of a new skill.
 */
export const requestNewSkill = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const parsed = createSkillRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      });
      return;
    }

    const { skill_name, category, reason } = parsed.data;

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id, name FROM skills WHERE LOWER(name) = LOWER(?)`,
      [skill_name.trim()],
    );

    if (existing.length > 0) {
      res.status(400).json({
        success: false,
        message: `Skill "${existing[0].name}" already exists in the master skills table.`,
      });
      return;
    }

    const [insertResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO skill_requests (requested_by, skill_name, category, reason, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [req.user.id, skill_name.trim(), category || "Technical", reason || null],
    );

    res.status(201).json({
      success: true,
      message: "Skill request submitted for Admin approval.",
      request_id: insertResult.insertId,
    });
  } catch (error: any) {
    console.error("requestNewSkill error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/assessment/stats/industry
 * Returns aggregate performance & contribution analytics for industry contributor.
 */
export const getIndustryQuestionAnalytics = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const userId = req.user.id;
    const indProfile = await getIndustryProfileForUser(userId);
    const companyId = indProfile?.id || 0;

    const [counts] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM assessment_questions
       WHERE created_by_user_id = ? OR source_company_id = ?`,
      [userId, companyId],
    );

    const [attemptStats] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(aq.id) as total_attempts,
        SUM(CASE WHEN aq.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts
       FROM assessment_attempt_questions aq
       JOIN assessment_questions q ON aq.question_id = q.id
       WHERE q.created_by_user_id = ? OR q.source_company_id = ?`,
      [userId, companyId],
    );

    const totalAttempts = attemptStats[0]?.total_attempts || 0;
    const correctAttempts = attemptStats[0]?.correct_attempts || 0;
    const avgAccuracy =
      totalAttempts > 0
        ? Math.round((correctAttempts / totalAttempts) * 100)
        : 0;

    res.status(200).json({
      success: true,
      stats: {
        total_questions: counts[0]?.total || 0,
        approved: counts[0]?.approved || 0,
        pending: counts[0]?.pending || 0,
        rejected: counts[0]?.rejected || 0,
        total_student_attempts: totalAttempts,
        avg_student_accuracy: avgAccuracy,
      },
    });
  } catch (error: any) {
    console.error("getIndustryQuestionAnalytics error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ADMIN MODERATION CONTROLLERS
// ==========================================

/**
 * GET /api/admin/assessment/questions
 * Returns all submitted questions with status & contributor filters.
 */
export const getAdminAssessmentQuestions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { status, skill_id, source_type, difficulty, search, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = ["1=1"];
    const params: any[] = [];

    if (status && status !== "all") {
      whereConditions.push("aq.status = ?");
      params.push(status);
    }

    if (skill_id && skill_id !== "all") {
      whereConditions.push("aq.skill_id = ?");
      params.push(skill_id);
    }

    if (difficulty && difficulty !== "all") {
      whereConditions.push("aq.difficulty = ?");
      params.push(difficulty);
    }

    if (source_type && source_type !== "all") {
      whereConditions.push("aq.source_type = ?");
      params.push(source_type);
    }

    if (search) {
      whereConditions.push("(aq.question LIKE ? OR s.name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.join(" AND ");

    // Count filtered questions
    const [filteredCountRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count
       FROM assessment_questions aq
       JOIN skills s ON aq.skill_id = s.id
       WHERE ${whereClause}`,
      params,
    );
    const totalFiltered = filteredCountRows[0]?.count || 0;
    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;

    // Fetch paginated rows
    const queryParams = [...params, limitNum, offset];
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        aq.id, 
        aq.skill_id, 
        s.name as skill_name, 
        s.category as skill_category,
        aq.question, 
        aq.option_a, 
        aq.option_b, 
        aq.option_c, 
        aq.option_d, 
        aq.correct_option, 
        aq.difficulty, 
        aq.explanation, 
        aq.source_type, 
        aq.source_company_id,
        ip.company_name as contributor_company,
        u.name as contributor_name,
        u.role as contributor_role,
        aq.status, 
        aq.rejection_reason, 
        aq.created_at,
        aq.updated_at
       FROM assessment_questions aq
       JOIN skills s ON aq.skill_id = s.id
       LEFT JOIN users u ON aq.created_by_user_id = u.id
       LEFT JOIN industry_profiles ip ON aq.source_company_id = ip.id
       WHERE ${whereClause}
       ORDER BY FIELD(aq.status, 'pending', 'approved', 'rejected'), aq.created_at DESC
       LIMIT ? OFFSET ?`,
      queryParams,
    );

    const [counts] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
       FROM assessment_questions`,
    );

    res.status(200).json({
      success: true,
      counts: counts[0],
      questions: rows,
      pagination: {
        total: totalFiltered,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("getAdminAssessmentQuestions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/assessment/questions/:id/approve
 * Admin approves a question.
 */
export const approveQuestion = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const questionId = parseParamId(req.params.id);
    if (isNaN(questionId)) {
      res.status(400).json({ success: false, message: "Invalid question ID" });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id, question, status FROM assessment_questions WHERE id = ?`,
      [questionId],
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    await pool.query(
      `UPDATE assessment_questions 
       SET status = 'approved', rejection_reason = NULL 
       WHERE id = ?`,
      [questionId],
    );

    res.status(200).json({
      success: true,
      message:
        "Question approved successfully and added to the skill assessment pool.",
    });
  } catch (error: any) {
    console.error("approveQuestion error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/assessment/questions/:id/reject
 * Admin rejects a question.
 */
export const rejectQuestion = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const questionId = parseParamId(req.params.id);
    if (isNaN(questionId)) {
      res.status(400).json({ success: false, message: "Invalid question ID" });
      return;
    }

    const parsed = rejectQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Rejection reason is required",
        errors: parsed.error.format(),
      });
      return;
    }

    const { rejection_reason } = parsed.data;

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM assessment_questions WHERE id = ?`,
      [questionId],
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    await pool.query(
      `UPDATE assessment_questions 
       SET status = 'rejected', rejection_reason = ? 
       WHERE id = ?`,
      [rejection_reason.trim(), questionId],
    );

    res.status(200).json({
      success: true,
      message: "Question rejected successfully.",
    });
  } catch (error: any) {
    console.error("rejectQuestion error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/skill-requests
 * Admin views all submitted skill requests.
 */
export const getSkillRequests = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        sr.id, 
        sr.requested_by, 
        u.name as requester_name, 
        u.role as requester_role,
        sr.skill_name, 
        sr.category, 
        sr.reason, 
        sr.status, 
        sr.rejection_reason, 
        sr.created_at
       FROM skill_requests sr
       JOIN users u ON sr.requested_by = u.id
       ORDER BY FIELD(sr.status, 'pending', 'approved', 'rejected'), sr.created_at DESC`,
    );

    res.status(200).json({
      success: true,
      skill_requests: rows,
    });
  } catch (error: any) {
    console.error("getSkillRequests error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/skill-requests/:id/approve
 * Admin approves a requested skill.
 */
export const approveSkillRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const requestId = parseParamId(req.params.id);
    if (isNaN(requestId)) {
      res.status(400).json({ success: false, message: "Invalid request ID" });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM skill_requests WHERE id = ?`,
      [requestId],
    );

    if (rows.length === 0) {
      res
        .status(404)
        .json({ success: false, message: "Skill request not found" });
      return;
    }

    const sr = rows[0];

    await pool.query(
      `INSERT INTO skills (name, category) VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE category = VALUES(category)`,
      [sr.skill_name, sr.category || "Technical"],
    );

    await pool.query(
      `UPDATE skill_requests SET status = 'approved', rejection_reason = NULL WHERE id = ?`,
      [requestId],
    );

    res.status(200).json({
      success: true,
      message: `Skill "${sr.skill_name}" has been approved and added to the master skills registry.`,
    });
  } catch (error: any) {
    console.error("approveSkillRequest error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/skill-requests/:id/reject
 * Admin rejects a skill request.
 */
export const rejectSkillRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const requestId = parseParamId(req.params.id);
    if (isNaN(requestId)) {
      res.status(400).json({ success: false, message: "Invalid request ID" });
      return;
    }

    const { rejection_reason } = req.body;

    await pool.query(
      `UPDATE skill_requests SET status = 'rejected', rejection_reason = ? WHERE id = ?`,
      [rejection_reason || "Declined by Administrator", requestId],
    );

    res.status(200).json({
      success: true,
      message: "Skill request rejected.",
    });
  } catch (error: any) {
    console.error("rejectSkillRequest error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/admin/assessment/questions/skill-summary
 * Returns aggregated question counts and admin target counts for every skill in the database.
 */
export const getQuestionBankSkillSummary = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Ensure column target_questions exists
    try {
      await pool.query(`ALTER TABLE skills ADD COLUMN target_questions INT NOT NULL DEFAULT 10`);
    } catch (e) {}

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        s.id as skillId,
        s.name as skillName,
        s.category as skillCategory,
        COALESCE(s.target_questions, 10) as targetQuestions,
        COUNT(aq.id) as totalQuestions,
        SUM(CASE WHEN aq.status = 'approved' THEN 1 ELSE 0 END) as approvedQuestions,
        SUM(CASE WHEN aq.status = 'pending' THEN 1 ELSE 0 END) as pendingQuestions,
        SUM(CASE WHEN aq.status = 'rejected' THEN 1 ELSE 0 END) as rejectedQuestions
       FROM skills s
       LEFT JOIN assessment_questions aq ON aq.skill_id = s.id
       GROUP BY s.id, s.name, s.category, s.target_questions
       ORDER BY s.name ASC`,
    );

    const summary = rows.map((r) => ({
      skillId: r.skillId,
      skillName: r.skillName,
      skillCategory: r.skillCategory,
      targetQuestions: Number(r.targetQuestions) || 10,
      totalQuestions: Number(r.totalQuestions) || 0,
      approvedQuestions: Number(r.approvedQuestions) || 0,
      pendingQuestions: Number(r.pendingQuestions) || 0,
      rejectedQuestions: Number(r.rejectedQuestions) || 0,
    }));

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error("getQuestionBankSkillSummary error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/assessment/skills/:id/target-questions
 * Admin defines/updates the required number of assessment questions for a skill.
 */
export const updateSkillTargetQuestions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const skillId = parseParamId(req.params.id);
    const { target_questions } = req.body;

    if (isNaN(skillId)) {
      res.status(400).json({ success: false, message: "Invalid skill ID" });
      return;
    }

    const countNum = Math.max(1, parseInt(String(target_questions), 10) || 10);

    // Ensure column target_questions exists
    try {
      await pool.query(`ALTER TABLE skills ADD COLUMN target_questions INT NOT NULL DEFAULT 10`);
    } catch (e) {}

    await pool.query(
      `UPDATE skills SET target_questions = ? WHERE id = ?`,
      [countNum, skillId],
    );

    res.status(200).json({
      success: true,
      message: `Updated target assessment questions for skill to ${countNum}.`,
      target_questions: countNum,
    });
  } catch (error: any) {
    console.error("updateSkillTargetQuestions error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
