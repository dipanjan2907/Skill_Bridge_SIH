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
// Helper to fetch complete real database-driven institution analytics telemetry
export const getInstitutionAnalyticsData = async (institutionId) => {
    // 1. Institution basic info
    const [instRows] = await pool.query(`SELECT id, name, code, location, website FROM institutions WHERE id = ?`, [institutionId]);
    const institutionInfo = instRows && instRows.length > 0
        ? instRows[0]
        : { id: institutionId, name: "Institution", code: "INST", location: null, website: null };
    // 2. Total Students for this Institution (ONLY students)
    const [totalStudentsRows] = await pool.query(`SELECT COUNT(*) AS count 
     FROM student_profiles sp 
     JOIN users u ON sp.user_id = u.id 
     WHERE sp.institution_id = ? AND LOWER(u.role) = 'student'`, [institutionId]);
    const totalStudents = Number(totalStudentsRows[0]?.count || 0);
    // 3. Profiles Completed
    const [completedProfilesRows] = await pool.query(`SELECT COUNT(*) AS count 
     FROM student_profiles sp 
     JOIN users u ON sp.user_id = u.id 
     WHERE sp.institution_id = ? AND LOWER(u.role) = 'student' 
       AND sp.degree IS NOT NULL AND sp.department IS NOT NULL AND sp.cgpa IS NOT NULL`, [institutionId]);
    const completedProfiles = Number(completedProfilesRows[0]?.count || 0);
    // 4. Assessed Students (Students with at least 1 skill record)
    const [assessedStudentsRows] = await pool.query(`SELECT COUNT(DISTINCT ss.student_id) AS count 
     FROM student_skills ss 
     JOIN student_profiles sp ON ss.student_id = sp.id 
     JOIN users u ON sp.user_id = u.id 
     WHERE sp.institution_id = ? AND LOWER(u.role) = 'student'`, [institutionId]);
    const assessedStudents = Number(assessedStudentsRows[0]?.count || 0);
    // 5. Skill Readiness Categorization & Industry-Ready Students Calculation
    const [studentReadinessRows] = await pool.query(`SELECT sp.id, AVG(ss.proficiency_score) AS avg_score, COUNT(ss.id) AS skill_count
     FROM student_profiles sp
     JOIN users u ON sp.user_id = u.id
     LEFT JOIN student_skills ss ON sp.id = ss.student_id
     WHERE sp.institution_id = ? AND LOWER(u.role) = 'student'
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
    // 6. Internship Participation Statistics
    const [internshipStatsRows] = await pool.query(`SELECT 
      COUNT(a.id) AS totalApplications,
      COUNT(DISTINCT a.student_id) AS totalApplicants,
      COUNT(CASE WHEN a.status = 'applied' THEN 1 END) AS applied,
      COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) AS shortlisted,
      COUNT(CASE WHEN a.status = 'selected' THEN 1 END) AS selected,
      COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) AS rejected,
      COUNT(DISTINCT CASE WHEN a.status IN ('shortlisted', 'selected') THEN a.student_id END) AS participatingStudents
     FROM applications a
     JOIN student_profiles sp ON a.student_id = sp.id
     JOIN users u ON sp.user_id = u.id
     JOIN opportunities o ON a.opportunity_id = o.id
     WHERE sp.institution_id = ? AND LOWER(u.role) = 'student' AND o.type = 'internship'`, [institutionId]);
    const internshipStats = internshipStatsRows[0] || {
        totalApplications: 0,
        totalApplicants: 0,
        applied: 0,
        shortlisted: 0,
        selected: 0,
        rejected: 0,
        participatingStudents: 0
    };
    const internshipStudents = Number(internshipStats.participatingStudents || 0);
    // 7. Full-Time Job Placements Statistics
    const [placementStatsRows] = await pool.query(`SELECT 
      COUNT(a.id) AS totalApplications,
      COUNT(DISTINCT a.student_id) AS totalApplicants,
      COUNT(CASE WHEN a.status = 'applied' THEN 1 END) AS applied,
      COUNT(CASE WHEN a.status = 'shortlisted' THEN 1 END) AS shortlisted,
      COUNT(CASE WHEN a.status = 'selected' THEN 1 END) AS selected,
      COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) AS rejected,
      COUNT(DISTINCT CASE WHEN a.status = 'selected' THEN a.student_id END) AS placedStudents
     FROM applications a
     JOIN student_profiles sp ON a.student_id = sp.id
     JOIN users u ON sp.user_id = u.id
     JOIN opportunities o ON a.opportunity_id = o.id
     WHERE sp.institution_id = ? AND LOWER(u.role) = 'student' AND o.type = 'job'`, [institutionId]);
    const placementStats = placementStatsRows[0] || {
        totalApplications: 0,
        totalApplicants: 0,
        applied: 0,
        shortlisted: 0,
        selected: 0,
        rejected: 0,
        placedStudents: 0
    };
    const placedStudents = Number(placementStats.placedStudents || 0);
    // 8. Total Published Opportunities (For Industry Demand calculation)
    const [totalOppRows] = await pool.query(`SELECT COUNT(*) AS total FROM opportunities WHERE status = 'published'`);
    const totalPublishedOpportunities = Math.max(Number(totalOppRows[0]?.total || 0), 1);
    // 9. Comprehensive Skill Demand vs Student Supply Analysis
    const [skillAnalysisRows] = await pool.query(`SELECT 
      s.id AS skillId,
      s.name AS skillName,
      COALESCE(s.category, 'Technical') AS category,
      COUNT(DISTINCT os.opportunity_id) AS opportunityCount,
      COALESCE(ROUND(AVG(os.required_proficiency)), 70) AS avgRequiredProficiency,
      COALESCE(COUNT(DISTINCT ss.student_id), 0) AS studentCount,
      COALESCE(ROUND(AVG(ss.proficiency_score)), 0) AS avgStudentProficiency
     FROM skills s
     LEFT JOIN opportunity_skills os ON s.id = os.skill_id
     LEFT JOIN opportunities o ON os.opportunity_id = o.id AND o.status = 'published'
     LEFT JOIN student_skills ss ON s.id = ss.skill_id 
       AND ss.student_id IN (
         SELECT sp.id 
         FROM student_profiles sp 
         JOIN users u ON sp.user_id = u.id 
         WHERE sp.institution_id = ? AND LOWER(u.role) = 'student'
       )
     GROUP BY s.id, s.name, s.category
     ORDER BY opportunityCount DESC, studentCount DESC, s.name ASC`, [institutionId]);
    const skillDemandVsSupply = skillAnalysisRows
        .filter((row) => Number(row.opportunityCount || 0) > 0)
        .map((row) => {
        const oppCount = Number(row.opportunityCount || 0);
        const demandPercentage = Math.round((oppCount / totalPublishedOpportunities) * 100);
        const stuCount = Number(row.studentCount || 0);
        const studentCoveragePercentage = totalStudents > 0 ? Math.round((stuCount / totalStudents) * 100) : 0;
        const requiredProf = Number(row.avgRequiredProficiency || 0);
        const studentProf = Number(row.avgStudentProficiency || 0);
        const gapDelta = Math.max(requiredProf - studentProf, 0);
        const isCriticalGap = demandPercentage >= 35 && (studentCoveragePercentage < 30 || gapDelta > 20);
        return {
            skillId: Number(row.skillId),
            skillName: String(row.skillName),
            category: String(row.category),
            opportunityCount: oppCount,
            industryDemandPercentage: demandPercentage,
            avgRequiredProficiency: requiredProf,
            studentCount: stuCount,
            studentCoveragePercentage,
            avgStudentProficiency: studentProf,
            gapDelta,
            isCriticalGap,
        };
    });
    // 10. Smart Automation: "What Should We Teach?" (Skills to Prioritize)
    const skillsToPrioritize = skillDemandVsSupply
        .map((item) => {
        const demandWeight = item.industryDemandPercentage * 0.50;
        const coverageGapWeight = (100 - Math.min(item.studentCoveragePercentage, 100)) * 0.30;
        const proficiencyGapWeight = Math.min(item.gapDelta, 50) * 0.40;
        const priorityScore = Math.min(Math.round(demandWeight + coverageGapWeight + proficiencyGapWeight), 100);
        let priority = "Moderate";
        if (priorityScore >= 65 || item.isCriticalGap) {
            priority = "High";
        }
        else if (priorityScore >= 45) {
            priority = "Medium";
        }
        let reason = "";
        if (item.industryDemandPercentage >= 40 && item.studentCoveragePercentage < 25) {
            reason = `High industry demand (${item.industryDemandPercentage}%) with low student coverage (${item.studentCoveragePercentage}% of cohort).`;
        }
        else if (item.gapDelta >= 15) {
            reason = `Strong industry demand (${item.industryDemandPercentage}%) with a notable student proficiency gap (-${item.gapDelta}%).`;
        }
        else {
            reason = `Sustained corporate hiring demand (${item.industryDemandPercentage}%) requiring ongoing curriculum alignment.`;
        }
        return {
            skillId: item.skillId,
            skillName: item.skillName,
            category: item.category,
            priority,
            priorityScore,
            industryDemandPercentage: item.industryDemandPercentage,
            studentCount: item.studentCount,
            studentCoveragePercentage: item.studentCoveragePercentage,
            avgRequiredProficiency: item.avgRequiredProficiency,
            avgStudentProficiency: item.avgStudentProficiency,
            gapDelta: item.gapDelta,
            reason,
        };
    })
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 6);
    // 11. Actionable Institutional Recommendations
    const institutionalActions = [];
    skillsToPrioritize.forEach((item) => {
        if (item.priority === "High") {
            if (item.studentCoveragePercentage < 25) {
                institutionalActions.push(`Increase ${item.skillName} elective modules & lab capacity to meet ${item.industryDemandPercentage}% industry demand.`);
            }
            else if (item.gapDelta > 15) {
                institutionalActions.push(`Host advanced ${item.skillName} bootcamps or industry guest lectures to bridge the ${item.gapDelta}% proficiency gap.`);
            }
        }
    });
    if (institutionalActions.length === 0) {
        institutionalActions.push("Maintain current curriculum focus while encouraging student participation in certified industry assessments.");
        institutionalActions.push("Expand industry-partnered capstone projects across emerging technology domains.");
    }
    // 12. Top Industry Skills
    const topIndustrySkills = skillDemandVsSupply
        .slice()
        .sort((a, b) => b.opportunityCount - a.opportunityCount)
        .slice(0, 6)
        .map((s) => ({
        skillId: s.skillId,
        skillName: s.skillName,
        category: s.category,
        demandCount: s.opportunityCount,
        demandPercentage: s.industryDemandPercentage,
        avgRequiredProficiency: s.avgRequiredProficiency,
    }));
    // 13. Top Student Skills
    const [topStudentSkillsRows] = await pool.query(`SELECT 
      s.id AS skillId,
      s.name AS skillName,
      s.category AS category,
      COUNT(DISTINCT ss.student_id) AS studentCount,
      ROUND(AVG(ss.proficiency_score)) AS avgProficiency
     FROM student_skills ss
     JOIN student_profiles sp ON ss.student_id = sp.id
     JOIN users u ON sp.user_id = u.id
     JOIN skills s ON ss.skill_id = s.id
     WHERE sp.institution_id = ? AND LOWER(u.role) = 'student'
     GROUP BY s.id, s.name, s.category
     ORDER BY studentCount DESC, avgProficiency DESC
     LIMIT 6`, [institutionId]);
    const topStudentSkills = topStudentSkillsRows.map((r) => ({
        skillId: Number(r.skillId),
        skillName: String(r.skillName),
        category: String(r.category),
        studentCount: Number(r.studentCount || 0),
        studentPercentage: totalStudents > 0 ? Math.round((Number(r.studentCount || 0) / totalStudents) * 100) : 0,
        avgProficiency: Number(r.avgProficiency || 0),
    }));
    // 14. Students List for Table / Roster View
    const [studentsListRows] = await pool.query(`SELECT 
      sp.id AS studentProfileId,
      u.id AS userId,
      u.name,
      u.email,
      sp.degree,
      sp.department,
      sp.cgpa,
      sp.current_sem AS currentSem,
      sp.student_id AS studentId,
      COALESCE(sp.verification_status, 'pending') AS verificationStatus,
      COUNT(DISTINCT ss.id) AS assessedSkillsCount,
      COALESCE(ROUND(AVG(ss.proficiency_score)), 0) AS avgProficiency
     FROM student_profiles sp
     JOIN users u ON sp.user_id = u.id
     LEFT JOIN student_skills ss ON sp.id = ss.student_id
     WHERE sp.institution_id = ? AND LOWER(u.role) = 'student'
     GROUP BY sp.id, u.id, u.name, u.email, sp.degree, sp.department, sp.cgpa, sp.current_sem, sp.student_id, sp.verification_status
     ORDER BY u.name ASC`, [institutionId]);
    return {
        institution: institutionInfo,
        overview: {
            totalStudents,
            completedProfiles,
            completedProfilesPercentage: totalStudents > 0 ? Math.round((completedProfiles / totalStudents) * 100) : 0,
            assessedStudents,
            assessedStudentsPercentage: totalStudents > 0 ? Math.round((assessedStudents / totalStudents) * 100) : 0,
            industryReadyStudents: readyCount,
            industryReadyPercentage: readyPercentage,
            internshipStudents,
            internshipPercentage: totalStudents > 0 ? Math.round((internshipStudents / totalStudents) * 100) : 0,
            placedStudents,
            placedPercentage: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
        },
        skillReadiness: {
            ready: { count: readyCount, percentage: readyPercentage },
            developing: { count: developingCount, percentage: developingPercentage },
            needsImprovement: { count: needsImprovementCount, percentage: needsImprovementPercentage },
        },
        skillDemandVsSupply,
        skillsToPrioritize,
        institutionalActions,
        topIndustrySkills,
        topStudentSkills,
        internships: {
            totalApplications: Number(internshipStats.totalApplications || 0),
            totalApplicants: Number(internshipStats.totalApplicants || 0),
            applied: Number(internshipStats.applied || 0),
            shortlisted: Number(internshipStats.shortlisted || 0),
            selected: Number(internshipStats.selected || 0),
            rejected: Number(internshipStats.rejected || 0),
            participatingStudents: internshipStudents,
            participationRate: totalStudents > 0 ? Math.round((internshipStudents / totalStudents) * 100) : 0,
        },
        placements: {
            totalApplications: Number(placementStats.totalApplications || 0),
            totalApplicants: Number(placementStats.totalApplicants || 0),
            applied: Number(placementStats.applied || 0),
            shortlisted: Number(placementStats.shortlisted || 0),
            selected: Number(placementStats.selected || 0),
            rejected: Number(placementStats.rejected || 0),
            placedStudents,
            placementRate: totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0,
        },
        demandedSkills: topIndustrySkills,
        studentSkillInsights: skillDemandVsSupply.slice(0, 8).map((s) => ({
            skillId: s.skillId,
            skillName: s.skillName,
            category: s.category,
            industryDemandCount: s.opportunityCount,
            avgRequiredProficiency: s.avgRequiredProficiency,
            avgStudentProficiency: s.avgStudentProficiency,
            studentCount: s.studentCount,
            gap: s.gapDelta,
            status: s.gapDelta <= 5 ? "Strong" : s.gapDelta <= 20 ? "Developing" : "Curriculum Gap",
        })),
        students: studentsListRows.map((s) => ({
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
    };
};
export const getInstitutionDashboard = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const userId = req.user.id;
        const institutionId = await getInstitutionIdForUser(userId);
        const analytics = await getInstitutionAnalyticsData(institutionId);
        res.status(200).json({
            success: true,
            ...analytics,
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
export const getInstitutionAnalytics = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const userId = req.user.id;
        const institutionId = await getInstitutionIdForUser(userId);
        const analytics = await getInstitutionAnalyticsData(institutionId);
        res.status(200).json({
            success: true,
            data: analytics,
        });
    }
    catch (error) {
        console.error("getInstitutionAnalytics controller error:", error);
        res.status(500).json({
            success: false,
            message: "Server error generating institution analytics: " + (error.message || "Database query failed"),
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
export const getInstitutionStudentDetails = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized." });
            return;
        }
        const userId = req.user.id;
        const institutionId = await getInstitutionIdForUser(userId);
        const targetId = parseInt(String(req.params.studentId), 10);
        if (isNaN(targetId)) {
            res.status(400).json({ success: false, message: "Invalid student ID." });
            return;
        }
        // Fetch student profile & user info
        const [profileRows] = await pool.query(`SELECT 
        sp.id AS studentProfileId,
        sp.user_id AS userId,
        u.name,
        u.email,
        sp.phone,
        sp.degree,
        sp.department,
        sp.cgpa,
        sp.current_sem AS currentSem,
        sp.roll_number AS rollNumber,
        sp.student_id AS studentId,
        sp.bio,
        sp.location,
        COALESCE(sp.verification_status, 'pending') AS verificationStatus,
        u.created_at AS registeredAt
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE (sp.id = ? OR sp.user_id = ?) AND sp.institution_id = ?`, [targetId, targetId, institutionId]);
        if (!profileRows || profileRows.length === 0) {
            res.status(404).json({ success: false, message: "Student details not found under this institution." });
            return;
        }
        const studentProfile = profileRows[0];
        // Fetch assessed skills for this student
        const [skillRows] = await pool.query(`SELECT 
        ss.id AS studentSkillId,
        s.id AS skillId,
        s.name AS skillName,
        s.category,
        ss.proficiency_score AS proficiencyScore,
        COALESCE(ss.verification_source, 'Self Reported') AS verificationSource
       FROM student_skills ss
       JOIN skills s ON ss.skill_id = s.id
       WHERE (ss.student_id = ? OR ss.student_id = ?)
       ORDER BY ss.proficiency_score DESC`, [studentProfile.studentProfileId, studentProfile.userId]);
        // Fetch student applications summary
        const [appRows] = await pool.query(`SELECT 
        a.id AS applicationId,
        o.title AS opportunityTitle,
        COALESCE(ip.company_name, 'Verified Hiring Partner') AS companyName,
        o.type AS opportunityType,
        a.status,
        a.applied_at AS appliedAt
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       LEFT JOIN industry_profiles ip ON o.industry_id = ip.id
       WHERE (a.student_id = ? OR a.student_id = ?)
       ORDER BY a.applied_at DESC`, [studentProfile.studentProfileId, studentProfile.userId]);
        // Fetch uploaded documents (Resumes & Certifications)
        let docRows = [];
        try {
            const [resumes] = await pool.query(`SELECT 
          id,
          'Resume' AS documentType,
          file_name AS originalName,
          file_url AS fileUrl,
          uploaded_at AS uploadedAt
         FROM student_resumes
         WHERE (student_id = ? OR student_id = ?)`, [studentProfile.studentProfileId, studentProfile.userId]);
            const [certs] = await pool.query(`SELECT 
          id,
          'Certificate' AS documentType,
          COALESCE(file_name, title) AS originalName,
          COALESCE(credential_url, file_name, '') AS fileUrl,
          created_at AS uploadedAt
         FROM student_certifications
         WHERE (student_id = ? OR student_id = ?)`, [studentProfile.studentProfileId, studentProfile.userId]);
            docRows = [...(resumes || []), ...(certs || [])];
        }
        catch (_docErr) {
            docRows = [];
        }
        res.status(200).json({
            success: true,
            student: {
                ...studentProfile,
                skills: skillRows.map((r) => ({
                    studentSkillId: r.studentSkillId,
                    skillId: r.skillId,
                    skillName: r.skillName,
                    category: r.category,
                    proficiencyScore: Number(r.proficiencyScore || 0),
                    verificationSource: r.verificationSource,
                })),
                applications: appRows,
                documents: docRows,
            },
        });
    }
    catch (error) {
        console.error("getInstitutionStudentDetails error:", error);
        res.status(500).json({
            success: false,
            message: `Failed to fetch student details: ${error.message}`,
        });
    }
};
export const viewInstitutionStudentDocument = async (req, res) => {
    try {
        const docUrl = req.query.url;
        if (!docUrl) {
            res.status(400).send("Document URL is required");
            return;
        }
        // Clean Cloudinary flags to ensure inline view (no fl_attachment)
        const cleanUrl = docUrl.replace(/\/fl_attachment\//g, "/");
        const response = await fetch(cleanUrl);
        if (!response.ok) {
            res.status(500).send("Failed to fetch document content");
            return;
        }
        const contentType = response.headers.get("content-type") || "application/pdf";
        const arrayBuffer = await response.arrayBuffer();
        res.setHeader("Content-Type", contentType.includes("octet-stream") ? "application/pdf" : contentType);
        res.setHeader("Content-Disposition", "inline; filename=\"student_document.pdf\"");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.send(Buffer.from(arrayBuffer));
    }
    catch (error) {
        console.error("viewInstitutionStudentDocument error:", error);
        res.status(500).send("Unable to render document inline");
    }
};
