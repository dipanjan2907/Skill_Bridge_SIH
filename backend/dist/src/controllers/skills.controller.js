import pool from "../config/db.js";
// 1. GET /api/skills - Get master skills list
export const getAllMasterSkills = async (_req, res) => {
    try {
        const [rows] = await pool.query(`SELECT id, name, category FROM skills ORDER BY category ASC, name ASC`);
        res.status(200).json(rows);
    }
    catch (error) {
        console.error("getAllMasterSkills error:", error);
        res.status(500).json({ error: `Database failure: ${error.message}` });
    }
};
// Helper function to get or create student profile ID
const getOrCreateStudentProfileId = async (userId) => {
    const [profileRows] = await pool.query(`SELECT id FROM student_profiles WHERE user_id = ?`, [userId]);
    if (profileRows.length > 0) {
        return profileRows[0].id;
    }
    const [insertResult] = await pool.query(`INSERT INTO student_profiles (user_id, institution_id, degree, department, cgpa, location, bio)
     VALUES (?, 1, 'Bachelor of Technology (B.Tech)', 'Computer Science & Engineering', 8.75, 'Kolkata, West Bengal', 'Passionate CS student proficient in Python, SQL, and Web Tech.')`, [userId]);
    return insertResult.insertId;
};
// 2. GET /api/student/skills - Get student's assigned skills
export const getStudentSkills = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized access" });
        return;
    }
    try {
        const studentProfileId = await getOrCreateStudentProfileId(userId);
        const [skills] = await pool.query(`SELECT 
        ss.id, 
        ss.student_id,
        ss.skill_id, 
        s.name, 
        s.category, 
        ss.proficiency_score, 
        ss.verification_source, 
        ss.is_badge_earned 
       FROM student_skills ss 
       JOIN skills s ON ss.skill_id = s.id 
       WHERE ss.student_id = ?
       ORDER BY ss.id DESC`, [studentProfileId]);
        res.status(200).json(skills);
    }
    catch (error) {
        console.error("getStudentSkills error:", error);
        res.status(500).json({ error: `Database error: ${error.message}` });
    }
};
// 3. POST /api/student/skills - Add a skill to student profile
export const addStudentSkill = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized access" });
        return;
    }
    const { skill_id, proficiency_score } = req.body;
    if (!skill_id) {
        res.status(400).json({ error: "skill_id is required" });
        return;
    }
    const score = proficiency_score ? parseInt(String(proficiency_score)) : null;
    try {
        const studentProfileId = await getOrCreateStudentProfileId(userId);
        // Verify master skill exists
        const [masterSkill] = await pool.query(`SELECT id, name, category FROM skills WHERE id = ?`, [skill_id]);
        if (masterSkill.length === 0) {
            res.status(404).json({
                error: "Selected skill does not exist in master skills table",
            });
            return;
        }
        // Check if duplicate skill for this student
        const [existing] = await pool.query(`SELECT id FROM student_skills WHERE student_id = ? AND skill_id = ?`, [studentProfileId, skill_id]);
        if (existing.length > 0) {
            res.status(400).json({ error: "Skill already added to your profile" });
            return;
        }
        // Insert skill
        const [insertResult] = await pool.query(`INSERT INTO student_skills (student_id, skill_id, proficiency_score, verification_source)
       VALUES (?, ?, ?, 'Self Reported')`, [studentProfileId, skill_id, score]);
        const [newSkillRows] = await pool.query(`SELECT 
        ss.id, 
        ss.student_id,
        ss.skill_id, 
        s.name, 
        s.category, 
        ss.proficiency_score, 
        ss.verification_source, 
        ss.is_badge_earned 
       FROM student_skills ss 
       JOIN skills s ON ss.skill_id = s.id 
       WHERE ss.id = ?`, [insertResult.insertId]);
        res.status(201).json({
            message: "Skill added successfully",
            skill: newSkillRows[0],
        });
    }
    catch (error) {
        console.error("addStudentSkill error:", error);
        res.status(500).json({ error: `Failed to add skill: ${error.message}` });
    }
};
// 4. PUT /api/student/skills/:id - Update skill proficiency
export const updateStudentSkill = async (req, res) => {
    const userId = req.user?.id;
    const skillRecordId = req.params.id;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized access" });
        return;
    }
    const { proficiency_score } = req.body;
    if (proficiency_score === undefined || proficiency_score === null) {
        res.status(400).json({ error: "proficiency_score is required" });
        return;
    }
    const score = parseInt(String(proficiency_score));
    try {
        const studentProfileId = await getOrCreateStudentProfileId(userId);
        const [updateResult] = await pool.query(`UPDATE student_skills 
       SET proficiency_score = ? 
       WHERE id = ? AND student_id = ?`, [score, skillRecordId, studentProfileId]);
        if (updateResult.affectedRows === 0) {
            res
                .status(404)
                .json({ error: "Skill record not found or unauthorized to edit" });
            return;
        }
        res.status(200).json({ message: "Skill proficiency updated successfully" });
    }
    catch (error) {
        console.error("updateStudentSkill error:", error);
        res.status(500).json({ error: `Failed to update skill: ${error.message}` });
    }
};
// 5. DELETE /api/student/skills/:id - Remove skill from profile
export const deleteStudentSkill = async (req, res) => {
    const userId = req.user?.id;
    const skillRecordId = req.params.id;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized access" });
        return;
    }
    try {
        const studentProfileId = await getOrCreateStudentProfileId(userId);
        const [deleteResult] = await pool.query(`DELETE FROM student_skills 
       WHERE id = ? AND student_id = ?`, [skillRecordId, studentProfileId]);
        if (deleteResult.affectedRows === 0) {
            res
                .status(404)
                .json({ error: "Skill record not found or unauthorized to delete" });
            return;
        }
        res.status(200).json({ message: "Skill removed successfully" });
    }
    catch (error) {
        console.error("deleteStudentSkill error:", error);
        res.status(500).json({ error: `Failed to delete skill: ${error.message}` });
    }
};
