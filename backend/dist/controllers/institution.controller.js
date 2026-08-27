import pool from "../config/db.js";
// Helper to resolve the authenticated user's institution ID
export const getInstitutionIdForUser = async (userId) => {
    // 1. Check users table for institution_id
    const [userRows] = await pool.query(`SELECT institution_id FROM users WHERE id = ?`, [userId]);
    if (userRows && userRows.length > 0 && userRows[0].institution_id) {
        return userRows[0].institution_id;
    }
    // 2. Check student_profiles table for institution_id
    const [studentRows] = await pool.query(`SELECT institution_id FROM student_profiles WHERE user_id = ?`, [userId]);
    if (studentRows && studentRows.length > 0 && studentRows[0].institution_id) {
        return studentRows[0].institution_id;
    }
    // 3. Fallback to default primary institution (ID 1: JIS University)
    return 1;
};
export const getInstitutionDashboard = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const userId = req.user.id;
        const institutionId = await getInstitutionIdForUser(userId);
        // Fetch institution details
        const [instRows] = await pool.query(`SELECT id, name, code, location, website FROM institutions WHERE id = ?`, [institutionId]);
        const institutionInfo = instRows && instRows.length > 0
            ? instRows[0]
            : { id: institutionId, name: null, code: null, location: null, website: null };
        // 1. Students Overview (ONLY students, excluding admin/industry/institution accounts)
        const [totalStudentsRows] = await pool.query(`SELECT COUNT(*) AS count 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       WHERE sp.institution_id = ? AND u.role = 'student'`, [institutionId]);
        const totalStudents = Number(totalStudentsRows[0]?.count || 0);
        const [completedProfilesRows] = await pool.query(`SELECT COUNT(*) AS count 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.id 
       WHERE sp.institution_id = ? AND u.role = 'student' 
         AND sp.degree IS NOT NULL AND sp.department IS NOT NULL AND sp.cgpa IS NOT NULL`, [institutionId]);
        const completedProfiles = Number(completedProfilesRows[0]?.count || 0);
        const [assessedStudentsRows] = await pool.query(`SELECT COUNT(DISTINCT ss.student_id) AS count 
       FROM student_skills ss 
       JOIN student_profiles sp ON ss.student_id = sp.id 
       JOIN users u ON sp.user_id = u.id 
       WHERE sp.institution_id = ? AND u.role = 'student'`, [institutionId]);
        const assessedStudents = Number(assessedStudentsRows[0]?.count || 0);
        // 2. Skill Readiness Categorization for Students Only
        const [studentReadinessRows] = await pool.query(`SELECT sp.id, AVG(ss.proficiency_score) AS avg_score
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN student_skills ss ON sp.id = ss.student_id
       WHERE sp.institution_id = ? AND u.role = 'student'
       GROUP BY sp.id`, [institutionId]);
        let readyCount = 0;
        let developingCount = 0;
        let needsImprovementCount = 0;
        studentReadinessRows.forEach((row) => {
            const avg = row.avg_score !== null && row.avg_score !== undefined ? Number(row.avg_score) : null;
            if (avg === null) {
                needsImprovementCount++;
            }
            else if (avg >= 75) {
                readyCount++;
            }
            else if (avg >= 50) {
                developingCount++;
            }
            else {
                needsImprovementCount++;
            }
        });
        const readyPercentage = totalStudents > 0 ? Math.round((readyCount / totalStudents) * 100) : 0;
        const developingPercentage = totalStudents > 0 ? Math.round((developingCount / totalStudents) * 100) : 0;
        const needsImprovementPercentage = totalStudents > 0 ? Math.round((needsImprovementCount / totalStudents) * 100) : 0;
        // 3. Internship Statistics (Student Applications Only)
        const [internshipStatsRows] = await pool.query(`SELECT 
        COUNT(a.id) AS total,
        COUNT(CASE WHEN a.status = 'applied' THEN 1 END) AS applied,
        COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) AS shortlisted,
        COUNT(CASE WHEN a.status = 'selected' THEN 1 END) AS selected,
        COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) AS rejected
       FROM applications a
       JOIN student_profiles sp ON a.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       JOIN opportunities o ON a.opportunity_id = o.id
       WHERE sp.institution_id = ? AND u.role = 'student' AND o.type = 'internship'`, [institutionId]);
        const internshipStats = internshipStatsRows[0] || { total: 0, applied: 0, shortlisted: 0, selected: 0, rejected: 0 };
        // 4. Placement Statistics (Full-Time Jobs - Student Applications Only)
        const [placementStatsRows] = await pool.query(`SELECT 
        COUNT(a.id) AS total,
        COUNT(CASE WHEN a.status = 'applied' THEN 1 END) AS applied,
        COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) AS shortlisted,
        COUNT(CASE WHEN a.status = 'selected' THEN 1 END) AS selected,
        COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) AS rejected
       FROM applications a
       JOIN student_profiles sp ON a.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       JOIN opportunities o ON a.opportunity_id = o.id
       WHERE sp.institution_id = ? AND u.role = 'student' AND o.type = 'job'`, [institutionId]);
        const placementStats = placementStatsRows[0] || { total: 0, applied: 0, shortlisted: 0, selected: 0, rejected: 0 };
        // 5. Most Demanded Industry Skills (Dynamic from active published opportunities)
        const [demandedSkillsRows] = await pool.query(`SELECT 
        s.id AS skillId,
        s.name AS skillName,
        s.category AS category,
        COUNT(DISTINCT os.opportunity_id) AS demandCount,
        ROUND(AVG(os.required_proficiency)) AS avgRequiredProficiency
       FROM opportunity_skills os
       JOIN opportunities o ON os.opportunity_id = o.id
       JOIN skills s ON os.skill_id = s.id
       WHERE o.status = 'published'
       GROUP BY s.id, s.name, s.category
       ORDER BY demandCount DESC, avgRequiredProficiency DESC
       LIMIT 10`);
        // 6. Student Skill Insights & Gap Matrix for Students Only
        const [studentSkillInsightsRows] = await pool.query(`SELECT 
        s.id AS skillId,
        s.name AS skillName,
        s.category AS category,
        COUNT(DISTINCT os.opportunity_id) AS industryDemandCount,
        ROUND(AVG(os.required_proficiency)) AS avgRequiredProficiency,
        COALESCE(ROUND(AVG(ss.proficiency_score)), 0) AS avgStudentProficiency,
        COUNT(DISTINCT ss.student_id) AS studentCount
       FROM opportunity_skills os
       JOIN opportunities o ON os.opportunity_id = o.id
       JOIN skills s ON os.skill_id = s.id
       LEFT JOIN student_skills ss ON s.id = ss.skill_id 
         AND ss.student_id IN (
           SELECT sp.id 
           FROM student_profiles sp 
           JOIN users u ON sp.user_id = u.id 
           WHERE sp.institution_id = ? AND u.role = 'student'
         )
       WHERE o.status = 'published'
       GROUP BY s.id, s.name, s.category
       ORDER BY industryDemandCount DESC
       LIMIT 8`, [institutionId]);
        const studentSkillInsights = studentSkillInsightsRows.map((row) => {
            const required = Number(row.avgRequiredProficiency || 0);
            const studentProf = Number(row.avgStudentProficiency || 0);
            const gap = required - studentProf;
            let status;
            if (gap <= 0 || (studentProf >= 70 && gap <= 10)) {
                status = "Strong";
            }
            else if (gap <= 25 && studentProf > 0) {
                status = "Developing";
            }
            else {
                status = "Curriculum Gap";
            }
            return {
                skillId: row.skillId,
                skillName: row.skillName,
                category: row.category,
                industryDemandCount: Number(row.industryDemandCount || 0),
                avgRequiredProficiency: required,
                avgStudentProficiency: studentProf,
                studentCount: Number(row.studentCount || 0),
                gap: gap > 0 ? gap : 0,
                status,
            };
        });
        res.status(200).json({
            success: true,
            institution: institutionInfo,
            overview: {
                totalStudents,
                completedProfiles,
                completedProfilesPercentage: totalStudents > 0 ? Math.round((completedProfiles / totalStudents) * 100) : 0,
                assessedStudents,
                assessedStudentsPercentage: totalStudents > 0 ? Math.round((assessedStudents / totalStudents) * 100) : 0,
            },
            skillReadiness: {
                ready: { count: readyCount, percentage: readyPercentage },
                developing: { count: developingCount, percentage: developingPercentage },
                needsImprovement: { count: needsImprovementCount, percentage: needsImprovementPercentage },
            },
            internships: {
                totalApplications: Number(internshipStats.total || 0),
                applied: Number(internshipStats.applied || 0),
                shortlisted: Number(internshipStats.shortlisted || 0),
                selected: Number(internshipStats.selected || 0),
                rejected: Number(internshipStats.rejected || 0),
            },
            placements: {
                totalApplications: Number(placementStats.total || 0),
                applied: Number(placementStats.applied || 0),
                shortlisted: Number(placementStats.shortlisted || 0),
                selected: Number(placementStats.selected || 0),
                rejected: Number(placementStats.rejected || 0),
            },
            demandedSkills: demandedSkillsRows.map((r) => ({
                skillId: r.skillId,
                skillName: r.skillName,
                category: r.category,
                demandCount: Number(r.demandCount || 0),
                avgRequiredProficiency: Number(r.avgRequiredProficiency || 0),
            })),
            studentSkillInsights,
            students: (await pool.query(`SELECT 
          sp.id AS studentProfileId,
          u.id AS userId,
          u.name,
          u.email,
          sp.degree,
          sp.department,
          sp.cgpa,
          sp.current_sem AS currentSem,
          COUNT(DISTINCT ss.id) AS assessedSkillsCount,
          COALESCE(ROUND(AVG(ss.proficiency_score)), 0) AS avgProficiency
         FROM student_profiles sp
         JOIN users u ON sp.user_id = u.id
         LEFT JOIN student_skills ss ON sp.id = ss.student_id
         WHERE sp.institution_id = ? AND u.role = 'student'
         GROUP BY sp.id, u.id, u.name, u.email, sp.degree, sp.department, sp.cgpa, sp.current_sem
         ORDER BY u.name ASC`, [institutionId]))[0].map((s) => ({
                studentProfileId: s.studentProfileId,
                userId: s.userId,
                name: s.name,
                email: s.email,
                degree: s.degree || "N/A",
                department: s.department || "N/A",
                cgpa: s.cgpa !== null ? Number(s.cgpa) : null,
                currentSem: s.currentSem || "N/A",
                assessedSkillsCount: Number(s.assessedSkillsCount || 0),
                avgProficiency: Number(s.avgProficiency || 0),
                verificationStatus: s.verificationStatus || "pending",
            })),
        });
    }
    catch (error) {
        console.error("getInstitutionDashboard controller error:", error);
        res.status(500).json({
            success: false,
            message: "Server error generating institution dashboard: " + (error.message || "Database query failed"),
        });
    }
};
export const getPublicInstitutions = async (_req, res) => {
    try {
        const sql = `
      SELECT id, name, code, location, website, COALESCE(verification_status, 'approved') AS verification_status
      FROM institutions
      WHERE LOWER(COALESCE(verification_status, 'approved')) = 'approved'
      ORDER BY name ASC
    `;
        const [rows] = await pool.query(sql);
        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows,
        });
    }
    catch (error) {
        console.error("getPublicInstitutions error:", error);
        res.status(500).json({
            success: false,
            message: `Failed to retrieve public institutions list: ${error.message}`,
        });
    }
};
export const getInstitutionStudentsList = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized." });
            return;
        }
        const userId = req.user.id;
        const institutionId = await getInstitutionIdForUser(userId);
        const [rows] = await pool.query(`SELECT 
        sp.id AS studentProfileId,
        u.id AS userId,
        u.name,
        u.username,
        u.email,
        sp.roll_number AS rollNumber,
        sp.degree,
        sp.department,
        sp.cgpa,
        sp.current_sem AS currentSem,
        COALESCE(sp.verification_status, 'pending') AS verificationStatus,
        u.created_at AS registeredAt
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.institution_id = ? AND LOWER(u.role) = 'student'
       ORDER BY sp.verification_status DESC, u.name ASC`, [institutionId]);
        res.status(200).json({
            success: true,
            count: rows.length,
            students: rows,
        });
    }
    catch (error) {
        console.error("getInstitutionStudentsList error:", error);
        res.status(500).json({
            success: false,
            message: `Failed to fetch institution students: ${error.message}`,
        });
    }
};
export const updateStudentVerificationByInstitution = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized." });
            return;
        }
        const userId = req.user.id;
        const institutionId = await getInstitutionIdForUser(userId);
        const rawId = req.params.studentId;
        const targetStudentId = parseInt(Array.isArray(rawId) ? rawId[0] : String(rawId), 10);
        const { status } = req.body; // 'approved' | 'rejected' | 'pending'
        if (isNaN(targetStudentId)) {
            res.status(400).json({ success: false, message: "Invalid student ID." });
            return;
        }
        if (!["approved", "rejected", "pending"].includes(status)) {
            res.status(400).json({ success: false, message: "Status must be 'approved', 'rejected', or 'pending'." });
            return;
        }
        // Verify student belongs to this institution
        const [existing] = await pool.query(`SELECT sp.id FROM student_profiles sp WHERE (sp.id = ? OR sp.user_id = ?) AND sp.institution_id = ?`, [targetStudentId, targetStudentId, institutionId]);
        if (!existing || existing.length === 0) {
            res.status(404).json({ success: false, message: "Student profile not found under your institution." });
            return;
        }
        await pool.query(`UPDATE student_profiles SET verification_status = ? WHERE (id = ? OR user_id = ?) AND institution_id = ?`, [status, targetStudentId, targetStudentId, institutionId]);
        res.status(200).json({
            success: true,
            message: `Student status updated to ${status.toUpperCase()} successfully.`,
            status,
        });
    }
    catch (error) {
        console.error("updateStudentVerificationByInstitution error:", error);
        res.status(500).json({
            success: false,
            message: `Failed to update student status: ${error.message}`,
        });
    }
};
