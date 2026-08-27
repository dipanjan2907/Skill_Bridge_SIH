import db from "../config/db";
// Helper to get or ensure student_profile ID for logged in user
const getStudentProfileId = (userId) => {
    return new Promise((resolve, reject) => {
        db.query(`SELECT id FROM student_profiles WHERE user_id = ?`, [userId], (err, results) => {
            if (err)
                return reject(err);
            if (results.length > 0) {
                return resolve(results[0].id);
            }
            // If profile row missing, create one
            db.query(`INSERT INTO student_profiles (user_id) VALUES (?)`, [userId], (cErr, cResult) => {
                if (cErr)
                    return reject(cErr);
                resolve(cResult.insertId);
            });
        });
    });
};
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        db.query(`SELECT sp.*, u.name, u.email, u.username, u.is_verified 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       WHERE sp.id = ?`, [profileId], (err, results) => {
            if (err || results.length === 0) {
                res.status(500).json({ success: false, message: "Failed to load student profile" });
                return;
            }
            res.status(200).json({ success: true, data: results[0] });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        const { roll_number, institution_name, department, degree, graduation_year, cgpa, phone, bio, resume_url, } = req.body;
        const sql = `
      UPDATE student_profiles
      SET roll_number = ?, institution_name = ?, department = ?, degree = ?, graduation_year = ?, cgpa = ?, phone = ?, bio = ?, resume_url = ?
      WHERE id = ?
    `;
        db.query(sql, [
            roll_number || null,
            institution_name || null,
            department || null,
            degree || null,
            graduation_year || null,
            cgpa || null,
            phone || null,
            bio || null,
            resume_url || null,
            profileId,
        ], (err) => {
            if (err) {
                console.error("Error updating student profile:", err);
                res.status(500).json({ success: false, message: "Failed to update profile" });
                return;
            }
            res.status(200).json({ success: true, message: "Profile updated successfully" });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const getPortfolio = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        // Fetch profile, skills, certifications, projects, internships in parallel
        const profileSql = `SELECT sp.*, u.name, u.email, u.username FROM student_profiles sp JOIN users u ON sp.user_id = u.id WHERE sp.id = ?`;
        const skillsSql = `
      SELECT ss.id as student_skill_id, s.id as skill_id, s.name, s.category, ss.proficiency_level, ss.is_verified, ss.created_at
      FROM student_skills ss
      JOIN skills s ON ss.skill_id = s.id
      WHERE ss.student_id = ?
    `;
        const certsSql = `SELECT * FROM certifications WHERE student_id = ? ORDER BY created_at DESC`;
        const projectsSql = `SELECT * FROM projects WHERE student_id = ? ORDER BY created_at DESC`;
        const internshipsSql = `SELECT * FROM internships WHERE student_id = ? ORDER BY created_at DESC`;
        db.query(profileSql, [profileId], (err, profileRes) => {
            if (err || profileRes.length === 0) {
                res.status(500).json({ success: false, message: "Failed to load portfolio profile" });
                return;
            }
            db.query(skillsSql, [profileId], (err2, skillsRes) => {
                db.query(certsSql, [profileId], (err3, certsRes) => {
                    db.query(projectsSql, [profileId], (err4, projectsRes) => {
                        db.query(internshipsSql, [profileId], (err5, internshipsRes) => {
                            res.status(200).json({
                                success: true,
                                portfolio: {
                                    profile: profileRes[0],
                                    skills: skillsRes || [],
                                    certifications: certsRes || [],
                                    projects: projectsRes || [],
                                    internships: internshipsRes || [],
                                },
                            });
                        });
                    });
                });
            });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const addOrUpdateSkill = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        const { skill_id, proficiency_level } = req.body;
        if (!skill_id) {
            res.status(400).json({ success: false, message: "skill_id is required" });
            return;
        }
        const sql = `
      INSERT INTO student_skills (student_id, skill_id, proficiency_level)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE proficiency_level = VALUES(proficiency_level)
    `;
        db.query(sql, [profileId, skill_id, proficiency_level || "Beginner"], (err) => {
            if (err) {
                console.error("Error adding student skill:", err);
                res.status(500).json({ success: false, message: "Failed to add skill" });
                return;
            }
            res.status(200).json({ success: true, message: "Skill added/updated successfully" });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const deleteSkill = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        const { skillId } = req.params;
        db.query(`DELETE FROM student_skills WHERE student_id = ? AND skill_id = ?`, [profileId, skillId], (err) => {
            if (err) {
                res.status(500).json({ success: false, message: "Failed to remove skill" });
                return;
            }
            res.status(200).json({ success: true, message: "Skill removed successfully" });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const addCertification = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        const { title, issuing_organization, issue_date, expiry_date, credential_id, credential_url } = req.body;
        if (!title || !issuing_organization) {
            res.status(400).json({ success: false, message: "Title and issuing organization are required" });
            return;
        }
        const sql = `
      INSERT INTO certifications (student_id, title, issuing_organization, issue_date, expiry_date, credential_id, credential_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
        db.query(sql, [
            profileId,
            title,
            issuing_organization,
            issue_date || null,
            expiry_date || null,
            credential_id || null,
            credential_url || null,
        ], (err, result) => {
            if (err) {
                res.status(500).json({ success: false, message: "Failed to add certification" });
                return;
            }
            res.status(201).json({ success: true, message: "Certification added", id: result.insertId });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const deleteCertification = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        const { id } = req.params;
        db.query(`DELETE FROM certifications WHERE id = ? AND student_id = ?`, [id, profileId], (err) => {
            if (err) {
                res.status(500).json({ success: false, message: "Failed to delete certification" });
                return;
            }
            res.status(200).json({ success: true, message: "Certification deleted" });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const addProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        const { title, description, project_url, github_url, start_date, end_date } = req.body;
        if (!title) {
            res.status(400).json({ success: false, message: "Project title is required" });
            return;
        }
        const sql = `
      INSERT INTO projects (student_id, title, description, project_url, github_url, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
        db.query(sql, [profileId, title, description || null, project_url || null, github_url || null, start_date || null, end_date || null], (err, result) => {
            if (err) {
                res.status(500).json({ success: false, message: "Failed to add project" });
                return;
            }
            res.status(201).json({ success: true, message: "Project added", id: result.insertId });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const deleteProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        const { id } = req.params;
        db.query(`DELETE FROM projects WHERE id = ? AND student_id = ?`, [id, profileId], (err) => {
            if (err) {
                res.status(500).json({ success: false, message: "Failed to delete project" });
                return;
            }
            res.status(200).json({ success: true, message: "Project deleted" });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const addInternship = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        const { company_name, role_title, description, start_date, end_date, is_current } = req.body;
        if (!company_name || !role_title) {
            res.status(400).json({ success: false, message: "Company name and role title are required" });
            return;
        }
        const sql = `
      INSERT INTO internships (student_id, company_name, role_title, description, start_date, end_date, is_current)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
        db.query(sql, [
            profileId,
            company_name,
            role_title,
            description || null,
            start_date || null,
            end_date || null,
            is_current ? 1 : 0,
        ], (err, result) => {
            if (err) {
                res.status(500).json({ success: false, message: "Failed to add internship" });
                return;
            }
            res.status(201).json({ success: true, message: "Internship added", id: result.insertId });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const deleteInternship = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        const { id } = req.params;
        db.query(`DELETE FROM internships WHERE id = ? AND student_id = ?`, [id, profileId], (err) => {
            if (err) {
                res.status(500).json({ success: false, message: "Failed to delete internship" });
                return;
            }
            res.status(200).json({ success: true, message: "Internship deleted" });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const submitAssessment = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        const { skill_id, score, max_score } = req.body;
        if (!skill_id || score === undefined) {
            res.status(400).json({ success: false, message: "skill_id and score are required" });
            return;
        }
        const totalMax = max_score || 100;
        const passingScore = totalMax * 0.6; // 60% passing criteria
        const status = score >= passingScore ? "Passed" : "Failed";
        const insertSql = `
      INSERT INTO skill_assessments (student_id, skill_id, score, max_score, status)
      VALUES (?, ?, ?, ?, ?)
    `;
        db.query(insertSql, [profileId, skill_id, score, totalMax, status], (err, result) => {
            if (err) {
                res.status(500).json({ success: false, message: "Failed to save assessment" });
                return;
            }
            if (status === "Passed") {
                // Mark skill verified in student_skills
                const updateSkillSql = `
          INSERT INTO student_skills (student_id, skill_id, is_verified)
          VALUES (?, ?, 1)
          ON DUPLICATE KEY UPDATE is_verified = 1
        `;
                db.query(updateSkillSql, [profileId, skill_id], (uErr) => {
                    if (uErr)
                        console.warn("Failed updating student skill verification status:", uErr.message);
                });
            }
            res.status(201).json({
                success: true,
                message: `Assessment submitted. Result: ${status}`,
                assessment: {
                    id: result.insertId,
                    score,
                    max_score: totalMax,
                    status,
                    is_verified: status === "Passed",
                },
            });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const getSkillGaps = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileId = await getStudentProfileId(userId);
        const { opportunity_id } = req.query;
        if (!opportunity_id) {
            res.status(400).json({ success: false, message: "opportunity_id query parameter is required" });
            return;
        }
        // Fetch opportunity required skills vs student's acquired skills
        const sql = `
      SELECT 
        s.id AS skill_id, 
        s.name AS skill_name, 
        s.category,
        os.min_proficiency AS required_proficiency,
        os.is_required,
        ss.proficiency_level AS student_proficiency,
        ss.is_verified AS is_verified
      FROM opportunity_skills os
      JOIN skills s ON os.skill_id = s.id
      LEFT JOIN student_skills ss ON os.skill_id = ss.skill_id AND ss.student_id = ?
      WHERE os.opportunity_id = ?
    `;
        db.query(sql, [profileId, opportunity_id], (err, results) => {
            if (err) {
                res.status(500).json({ success: false, message: "Failed to calculate skill gaps" });
                return;
            }
            const acquired = results.filter((r) => r.student_proficiency !== null);
            const missing = results.filter((r) => r.student_proficiency === null);
            const matchPercentage = results.length > 0 ? Math.round((acquired.length / results.length) * 100) : 100;
            res.status(200).json({
                success: true,
                opportunity_id,
                matchPercentage,
                acquired_skills: acquired,
                missing_skills: missing,
            });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
