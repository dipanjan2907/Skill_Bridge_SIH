import pool from "../config/db.js";
/**
 * Helper to fetch questions for a skill ID with strict skill-family fallback.
 * CRITICAL REQUIREMENT:
 * Questions for React MUST ONLY be React questions.
 * Questions for TypeScript MUST ONLY be TypeScript questions.
 * Questions for SQL/MySQL MUST ONLY be SQL questions.
 */
const fetchQuestionsWithFallback = async (skillId, includeAnswers = false) => {
    // 1. Fetch requested skill details
    const [skillRows] = await pool.query(`SELECT id, name, category FROM skills WHERE id = ?`, [skillId]);
    if (skillRows.length === 0) {
        return { skill: null, questions: [] };
    }
    const requestedSkill = skillRows[0];
    const selectFields = includeAnswers
        ? `id, skill_id, question, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation`
        : `id, skill_id, question, option_a, option_b, option_c, option_d, difficulty`;
    // 2. Direct query by exact skill_id
    let [questions] = await pool.query(`SELECT ${selectFields} FROM assessment_questions WHERE skill_id = ? ORDER BY id ASC`, [skillId]);
    if (questions.length > 0) {
        return { skill: requestedSkill, questions };
    }
    // 3. Strict skill family fallback (ONLY if exact skill_id has no questions yet)
    const name = (requestedSkill.name || "").toLowerCase();
    let whereClause = "";
    const params = [];
    if (name.includes("sql") || name.includes("mysql") || name.includes("relational") || name.includes("database")) {
        whereClause = "(s.name LIKE ? OR s.name LIKE ? OR s.name LIKE ? OR s.name LIKE ?)";
        params.push("%SQL%", "%MySQL%", "%Relational%", "%Database%");
    }
    else if (name.includes("react")) {
        whereClause = "s.name LIKE ?";
        params.push("%React%");
    }
    else if (name.includes("node")) {
        whereClause = "s.name LIKE ?";
        params.push("%Node%");
    }
    else if (name.includes("python")) {
        whereClause = "s.name LIKE ?";
        params.push("%Python%");
    }
    else if (name.includes("typescript") || name.includes("ts") || name.includes("javascript") || name.includes("js")) {
        whereClause = "(s.name LIKE ? OR s.name LIKE ? OR s.name LIKE ?)";
        params.push("%TypeScript%", "%JavaScript%", "%JS%");
    }
    if (whereClause) {
        const [matchingSkillRows] = await pool.query(`SELECT s.id 
       FROM skills s 
       JOIN assessment_questions aq ON s.id = aq.skill_id 
       WHERE ${whereClause}
       GROUP BY s.id 
       ORDER BY COUNT(aq.id) DESC 
       LIMIT 1`, params);
        if (matchingSkillRows.length > 0) {
            const fallbackSkillId = matchingSkillRows[0].id;
            [questions] = await pool.query(`SELECT ${selectFields} FROM assessment_questions WHERE skill_id = ? ORDER BY id ASC`, [fallbackSkillId]);
        }
    }
    return { skill: requestedSkill, questions };
};
/**
 * 1. GET /api/assessments/questions?skill_id=:skill_id
 *    OR /api/assessments/questions/:skillId
 *
 * Serves assessment questions for a specific skill.
 * CRITICAL SECURITY REQUIREMENT:
 * `correct_option` and `explanation` ARE OMITTED from the SELECT response
 * to ensure answers remain strictly server-side.
 */
export const getAssessmentQuestions = async (req, res) => {
    try {
        const skillIdParam = req.params.skillId || req.query.skill_id;
        if (!skillIdParam) {
            res.status(400).json({ error: "skill_id parameter is required" });
            return;
        }
        const skillId = parseInt(String(skillIdParam));
        if (isNaN(skillId)) {
            res.status(400).json({ error: "Invalid skill_id provided" });
            return;
        }
        const { skill, questions } = await fetchQuestionsWithFallback(skillId, false);
        if (!skill) {
            res.status(404).json({ error: "Skill not found in master skills registry" });
            return;
        }
        res.status(200).json({
            success: true,
            skill,
            total_questions: questions.length,
            questions,
        });
    }
    catch (error) {
        console.error("getAssessmentQuestions error:", error);
        res.status(500).json({ error: `Database query failure: ${error.message}` });
    }
};
/**
 * 2. GET /api/assessments/question/:id
 * Serves a single assessment question by ID without correct_option or explanation.
 */
export const getSingleAssessmentQuestion = async (req, res) => {
    try {
        const rawId = req.params.id;
        const idStr = Array.isArray(rawId) ? rawId[0] : String(rawId);
        const questionId = parseInt(idStr, 10);
        if (isNaN(questionId)) {
            res.status(400).json({ error: "Invalid question id provided" });
            return;
        }
        // Exclude correct_option and explanation
        const [questions] = await pool.query(`SELECT 
        id, 
        skill_id, 
        question, 
        option_a, 
        option_b, 
        option_c, 
        option_d, 
        difficulty 
       FROM assessment_questions 
       WHERE id = ?`, [questionId]);
        if (questions.length === 0) {
            res.status(404).json({ error: "Question not found" });
            return;
        }
        res.status(200).json({
            success: true,
            question: questions[0],
        });
    }
    catch (error) {
        console.error("getSingleAssessmentQuestion error:", error);
        res.status(500).json({ error: `Database query failure: ${error.message}` });
    }
};
/**
 * 3. POST /api/assessments/submit
 * Evaluates student responses on the server side against correct answers stored in DB.
 * Returns score calculation and detailed breakdown with explanations ONLY after submission.
 */
export const submitAssessment = async (req, res) => {
    try {
        const { skill_id, answers } = req.body;
        if (!skill_id || !Array.isArray(answers)) {
            res.status(400).json({
                error: "skill_id and answers array are required for assessment evaluation",
            });
            return;
        }
        const skillId = parseInt(String(skill_id));
        // Fetch full questions with options, correct_option and explanation for server-side verification using fallback
        const { questions: dbQuestions } = await fetchQuestionsWithFallback(skillId, true);
        if (dbQuestions.length === 0) {
            res.status(404).json({ error: "No assessment questions found for the given skill_id" });
            return;
        }
        const questionMap = new Map();
        dbQuestions.forEach((q) => questionMap.set(q.id, q));
        let correctCount = 0;
        const evaluationResults = answers.map((ans) => {
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
            // Normalize selected option to 'A', 'B', 'C', 'D'
            let normalizedUserOption = (ans.selected_option || "").trim().toUpperCase();
            if (normalizedUserOption.startsWith("OPTION_")) {
                normalizedUserOption = normalizedUserOption.replace("OPTION_", "");
            }
            else if (normalizedUserOption.length > 1) {
                const raw = (ans.selected_option || "").trim();
                if (raw === q.option_a)
                    normalizedUserOption = "A";
                else if (raw === q.option_b)
                    normalizedUserOption = "B";
                else if (raw === q.option_c)
                    normalizedUserOption = "C";
                else if (raw === q.option_d)
                    normalizedUserOption = "D";
            }
            const correctOptionKey = (q.correct_option || "").trim().toUpperCase();
            let correctOptionText = q.option_a;
            if (correctOptionKey === "B")
                correctOptionText = q.option_b;
            else if (correctOptionKey === "C")
                correctOptionText = q.option_c;
            else if (correctOptionKey === "D")
                correctOptionText = q.option_d;
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
        });
        const totalQuestions = dbQuestions.length;
        const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
        const passed = scorePercentage >= 70;
        // Update or insert proficiency score in student_skills table if user is authenticated
        const userId = req.user?.id;
        if (userId) {
            const [profileRows] = await pool.query(`SELECT id FROM student_profiles WHERE user_id = ?`, [userId]);
            if (profileRows.length > 0) {
                const studentProfileId = profileRows[0].id;
                const [existingSkill] = await pool.query(`SELECT id FROM student_skills WHERE student_id = ? AND skill_id = ?`, [studentProfileId, skillId]);
                if (existingSkill.length > 0) {
                    await pool.query(`UPDATE student_skills 
             SET proficiency_score = ?, 
                 verification_source = 'Verified Assessment',
                 is_badge_earned = ?
             WHERE student_id = ? AND skill_id = ?`, [scorePercentage, passed, studentProfileId, skillId]);
                }
                else {
                    await pool.query(`INSERT INTO student_skills (student_id, skill_id, proficiency_score, verification_source, is_badge_earned)
             VALUES (?, ?, ?, 'Verified Assessment', ?)`, [studentProfileId, skillId, scorePercentage, passed]);
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
    }
    catch (error) {
        console.error("submitAssessment error:", error);
        res.status(500).json({ error: `Assessment evaluation failed: ${error.message}` });
    }
};
