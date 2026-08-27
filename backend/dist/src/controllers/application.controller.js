import pool from "../config/db.js";
/**
 * 1. Apply for Opportunity (Student only)
 * POST /api/student/applications
 */
export const applyForOpportunity = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const { opportunityId, coverLetter, resumeUrl } = req.body;
    if (!opportunityId) {
        res.status(400).json({ success: false, message: "opportunityId is required." });
        return;
    }
    try {
        // Get student profile ID linked to user
        let [profiles] = await pool.query(`SELECT id FROM student_profiles WHERE user_id = ?`, [userId]);
        let studentProfileId;
        if (profiles.length === 0) {
            // Auto-create default profile if student has not filled details yet
            const [insertProfile] = await pool.query(`INSERT INTO student_profiles (user_id, degree, department) VALUES (?, 'Bachelor of Technology', 'Computer Science')`, [userId]);
            studentProfileId = insertProfile.insertId;
        }
        else {
            studentProfileId = profiles[0].id;
        }
        // Verify opportunity exists and is published
        const [oppRows] = await pool.query(`SELECT id, status, application_deadline FROM opportunities WHERE id = ?`, [opportunityId]);
        if (oppRows.length === 0) {
            res.status(404).json({ success: false, message: "Opportunity not found." });
            return;
        }
        const opp = oppRows[0];
        if (opp.status !== "published") {
            res.status(400).json({
                success: false,
                message: "Applications are closed or opportunity is not published.",
            });
            return;
        }
        // Validate deadline if set
        if (opp.application_deadline) {
            const deadlineDate = new Date(opp.application_deadline);
            deadlineDate.setHours(23, 59, 59, 999);
            if (new Date() > deadlineDate) {
                res.status(400).json({
                    success: false,
                    message: "Application deadline for this opportunity has passed.",
                });
                return;
            }
        }
        // Check if student already applied
        const [existingApp] = await pool.query(`SELECT id FROM applications WHERE student_id = ? AND opportunity_id = ?`, [studentProfileId, opportunityId]);
        if (existingApp.length > 0) {
            res.status(409).json({
                success: false,
                message: "You have already applied to this opportunity.",
            });
            return;
        }
        // Create Application
        const [insertRes] = await pool.query(`INSERT INTO applications (student_id, opportunity_id, status, cover_letter, resume_url)
       VALUES (?, ?, 'applied', ?, ?)`, [studentProfileId, opportunityId, coverLetter || null, resumeUrl || null]);
        const newAppId = insertRes.insertId;
        const [createdRows] = await pool.query(`SELECT id, student_id, opportunity_id, status, cover_letter, resume_url, applied_at
       FROM applications WHERE id = ?`, [newAppId]);
        res.status(201).json({
            success: true,
            message: "Application submitted successfully.",
            application: createdRows[0],
        });
    }
    catch (error) {
        console.error("applyForOpportunity error:", error);
        if (error.code === "ER_DUP_ENTRY") {
            res.status(409).json({
                success: false,
                message: "You have already applied to this opportunity.",
            });
            return;
        }
        res.status(500).json({ success: false, message: `Server error: ${error.message}` });
    }
};
/**
 * 2. Get Student's Applications
 * GET /api/student/applications
 */
export const getStudentApplications = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const [rows] = await pool.query(`SELECT 
        a.id,
        a.status,
        a.cover_letter AS coverLetter,
        a.resume_url AS resumeUrl,
        a.applied_at AS appliedAt,
        a.updated_at AS updatedAt,
        o.id AS opportunity_id,
        o.title AS opportunity_title,
        o.type AS opportunity_type,
        o.location AS opportunity_location,
        o.work_mode AS opportunity_work_mode,
        o.stipend_min,
        o.stipend_max,
        o.duration,
        o.application_deadline,
        o.status AS opportunity_status,
        ip.id AS industry_id,
        ip.company_name,
        ip.logo AS company_logo,
        ip.location AS company_location
       FROM applications a
       JOIN student_profiles sp ON a.student_id = sp.id
       JOIN opportunities o ON a.opportunity_id = o.id
       JOIN industry_profiles ip ON o.industry_id = ip.id
       WHERE sp.user_id = ?
       ORDER BY a.applied_at DESC`, [userId]);
        const formattedApplications = rows.map((r) => ({
            id: r.id,
            status: r.status,
            coverLetter: r.coverLetter,
            resumeUrl: r.resumeUrl,
            appliedAt: r.appliedAt,
            updatedAt: r.updatedAt,
            opportunity: {
                id: r.opportunity_id,
                title: r.opportunity_title,
                type: r.opportunity_type,
                location: r.opportunity_location,
                workMode: r.opportunity_work_mode,
                stipendMin: r.stipend_min,
                stipendMax: r.stipend_max,
                duration: r.duration,
                deadline: r.application_deadline,
                status: r.opportunity_status,
                industry: {
                    id: r.industry_id,
                    companyName: r.company_name,
                    logo: r.company_logo,
                    location: r.company_location,
                },
            },
        }));
        res.status(200).json({
            success: true,
            applications: formattedApplications,
        });
    }
    catch (error) {
        console.error("getStudentApplications error:", error);
        res.status(500).json({ success: false, message: `Database error: ${error.message}` });
    }
};
/**
 * 3. Get Student Application Details by ID
 * GET /api/student/applications/:id
 */
export const getStudentApplicationById = async (req, res) => {
    const userId = req.user?.id;
    const appId = req.params.id;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const [rows] = await pool.query(`SELECT 
        a.id,
        a.status,
        a.cover_letter AS coverLetter,
        a.resume_url AS resumeUrl,
        a.applied_at AS appliedAt,
        a.updated_at AS updatedAt,
        o.id AS opportunity_id,
        o.title AS opportunity_title,
        o.type AS opportunity_type,
        o.description AS opportunity_description,
        o.location AS opportunity_location,
        o.work_mode AS opportunity_work_mode,
        o.stipend_min,
        o.stipend_max,
        o.duration,
        o.eligibility,
        o.application_deadline,
        o.status AS opportunity_status,
        ip.id AS industry_id,
        ip.company_name,
        ip.company_type,
        ip.industry_sector,
        ip.website,
        ip.logo AS company_logo,
        ip.location AS company_location
       FROM applications a
       JOIN student_profiles sp ON a.student_id = sp.id
       JOIN opportunities o ON a.opportunity_id = o.id
       JOIN industry_profiles ip ON o.industry_id = ip.id
       WHERE a.id = ? AND sp.user_id = ?`, [appId, userId]);
        if (rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Application not found or unauthorized.",
            });
            return;
        }
        const r = rows[0];
        // Fetch required skills for the opportunity
        const [skills] = await pool.query(`SELECT os.skill_id, s.name AS skill_name, os.required_proficiency
       FROM opportunity_skills os
       JOIN skills s ON os.skill_id = s.id
       WHERE os.opportunity_id = ?`, [r.opportunity_id]);
        const applicationDetail = {
            id: r.id,
            status: r.status,
            coverLetter: r.coverLetter,
            resumeUrl: r.resumeUrl,
            appliedAt: r.appliedAt,
            updatedAt: r.updatedAt,
            opportunity: {
                id: r.opportunity_id,
                title: r.opportunity_title,
                type: r.opportunity_type,
                description: r.opportunity_description,
                location: r.opportunity_location,
                workMode: r.opportunity_work_mode,
                stipendMin: r.stipend_min,
                stipendMax: r.stipend_max,
                duration: r.duration,
                eligibility: r.eligibility,
                deadline: r.application_deadline,
                status: r.opportunity_status,
                requiredSkills: skills,
                industry: {
                    id: r.industry_id,
                    companyName: r.company_name,
                    companyType: r.company_type,
                    industrySector: r.industry_sector,
                    website: r.website,
                    logo: r.company_logo,
                    location: r.company_location,
                },
            },
        };
        res.status(200).json({
            success: true,
            application: applicationDetail,
        });
    }
    catch (error) {
        console.error("getStudentApplicationById error:", error);
        res.status(500).json({ success: false, message: `Database error: ${error.message}` });
    }
};
/**
 * 4. Get Industry Opportunity Applicants
 * GET /api/industry/opportunities/:opportunityId/applications
 */
export const getIndustryOpportunityApplications = async (req, res) => {
    const userId = req.user?.id;
    const { opportunityId } = req.params;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        // Verify industry is approved
        const [indRows] = await pool.query(`SELECT id, verification_status FROM industry_profiles WHERE user_id = ?`, [userId]);
        if (indRows.length === 0 || indRows[0].verification_status !== "approved") {
            res.status(403).json({
                success: false,
                message: "Only verified industry accounts can view applicants.",
            });
            return;
        }
        const industryId = indRows[0].id;
        // Verify opportunity belongs to this industry
        const [oppRows] = await pool.query(`SELECT id, title, type, status FROM opportunities WHERE id = ? AND industry_id = ?`, [opportunityId, industryId]);
        if (oppRows.length === 0) {
            res.status(403).json({
                success: false,
                message: "Opportunity not found or owned by another industry.",
            });
            return;
        }
        // Fetch applications
        const [appRows] = await pool.query(`SELECT 
        a.id AS application_id,
        a.status,
        a.cover_letter AS coverLetter,
        a.resume_url AS resumeUrl,
        a.applied_at AS appliedAt,
        a.updated_at AS updatedAt,
        sp.id AS student_id,
        u.name AS student_name,
        u.email AS student_email,
        sp.degree,
        sp.department,
        sp.cgpa,
        sp.current_sem,
        sp.location AS student_location,
        sp.github,
        sp.linkedin,
        sp.portfolio,
        COALESCE(inst.name, 'Enrolled Institute') AS institution_name
       FROM applications a
       JOIN student_profiles sp ON a.student_id = sp.id
       JOIN users u ON sp.user_id = u.id
       LEFT JOIN institutions inst ON sp.institution_id = inst.id
       WHERE a.opportunity_id = ?
       ORDER BY a.applied_at DESC`, [opportunityId]);
        // Fetch verified skills for each student
        const applications = await Promise.all(appRows.map(async (app) => {
            const [skills] = await pool.query(`SELECT ss.skill_id, s.name AS skill_name, ss.proficiency_score, ss.is_badge_earned
           FROM student_skills ss
           JOIN skills s ON ss.skill_id = s.id
           WHERE ss.student_id = ?`, [app.student_id]);
            return {
                id: app.application_id,
                status: app.status,
                coverLetter: app.coverLetter,
                resumeUrl: app.resumeUrl,
                appliedAt: app.appliedAt,
                updatedAt: app.updatedAt,
                student: {
                    id: app.student_id,
                    name: app.student_name,
                    email: app.student_email,
                    institution: app.institution_name,
                    degree: app.degree,
                    department: app.department,
                    cgpa: app.cgpa,
                    currentSem: app.current_sem,
                    location: app.student_location,
                    github: app.github,
                    linkedin: app.linkedin,
                    portfolio: app.portfolio,
                    skills: skills,
                },
            };
        }));
        res.status(200).json({
            success: true,
            opportunity: oppRows[0],
            applications: applications,
        });
    }
    catch (error) {
        console.error("getIndustryOpportunityApplications error:", error);
        res.status(500).json({ success: false, message: `Database error: ${error.message}` });
    }
};
/**
 * 5. Update Application Status (Industry only)
 * PUT /api/industry/applications/:applicationId/status
 */
export const updateApplicationStatus = async (req, res) => {
    const userId = req.user?.id;
    const { applicationId } = req.params;
    const { status } = req.body;
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validStatuses = ["applied", "shortlisted", "rejected", "selected"];
    if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
        return;
    }
    try {
        // Verify industry is approved
        const [indRows] = await pool.query(`SELECT id, verification_status FROM industry_profiles WHERE user_id = ?`, [userId]);
        if (indRows.length === 0 || indRows[0].verification_status !== "approved") {
            res.status(403).json({
                success: false,
                message: "Only verified industry accounts can update application status.",
            });
            return;
        }
        const industryId = indRows[0].id;
        // Verify application belongs to an opportunity owned by this industry
        const [appRows] = await pool.query(`SELECT a.id, a.status AS current_status, a.opportunity_id
       FROM applications a
       JOIN opportunities o ON a.opportunity_id = o.id
       WHERE a.id = ? AND o.industry_id = ?`, [applicationId, industryId]);
        if (appRows.length === 0) {
            res.status(403).json({
                success: false,
                message: "Application not found or not owned by your company.",
            });
            return;
        }
        const currentStatus = appRows[0].current_status;
        // Enforce workflow logic (Part 7): prevent rejected applications from being selected/shortlisted
        if (currentStatus === "rejected" && (status === "selected" || status === "shortlisted")) {
            res.status(400).json({
                success: false,
                message: "Cannot select or shortlist an application that has already been rejected.",
            });
            return;
        }
        // Update status
        await pool.query(`UPDATE applications SET status = ? WHERE id = ?`, [
            status,
            applicationId,
        ]);
        const [updatedRows] = await pool.query(`SELECT id, status, updated_at FROM applications WHERE id = ?`, [applicationId]);
        res.status(200).json({
            success: true,
            message: `Application status updated to '${status}'.`,
            application: updatedRows[0],
        });
    }
    catch (error) {
        console.error("updateApplicationStatus error:", error);
        res.status(500).json({ success: false, message: `Database error: ${error.message}` });
    }
};
