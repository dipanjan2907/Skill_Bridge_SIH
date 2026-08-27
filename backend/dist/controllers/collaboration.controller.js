import pool from "../config/db.js";
// Supported Collaboration Types
export const VALID_COLLABORATION_TYPES = [
    "Mentorship",
    "Workshop",
    "Guest Lecture",
    "Innovation Challenge",
    "Live Industry Project",
    "Research Collaboration",
    "Faculty Training",
    "Industrial Training",
];
// Helper: Calculate skill match percentage between required skill IDs and user skills
async function calculateSkillMatchScore(userId, requiredSkillIds) {
    if (!requiredSkillIds || requiredSkillIds.length === 0)
        return 100;
    try {
        // Get student profile ID first
        const [profRows] = await pool.query(`SELECT id FROM student_profiles WHERE user_id = ?`, [userId]);
        if (!profRows || profRows.length === 0)
            return 0;
        const studentId = profRows[0].id;
        // Get verified skill IDs for student
        const [userSkills] = await pool.query(`SELECT skill_id FROM student_skills WHERE student_id = ?`, [studentId]);
        if (!userSkills || userSkills.length === 0)
            return 0;
        const userSkillIds = new Set(userSkills.map((s) => s.skill_id));
        const matchedCount = requiredSkillIds.filter((id) => userSkillIds.has(id)).length;
        return Math.round((matchedCount / requiredSkillIds.length) * 100);
    }
    catch (error) {
        console.error("Error calculating skill match score:", error);
        return 0;
    }
}
// 1. GET /api/collaborations (Discovery with search, filter, skill matching)
export const getCollaborations = async (req, res) => {
    try {
        const { search, type, mode, target_audience, skill_id, status = "published" } = req.query;
        const currentUserId = req.user ? req.user.id : null;
        let query = `
      SELECT 
        c.id,
        c.created_by,
        c.industry_id,
        c.institution_id,
        c.title,
        c.description,
        c.collaboration_type,
        c.target_audience,
        c.start_date,
        c.end_date,
        c.start_time,
        c.location,
        c.mode,
        c.capacity,
        c.status,
        c.created_at,
        c.updated_at,
        u.name AS creator_name,
        u.role AS creator_role,
        ip.company_name,
        ip.logo AS company_logo,
        inst.name AS institution_name,
        (SELECT COUNT(*) FROM collaboration_participants cp WHERE cp.collaboration_id = c.id) AS participant_count
      FROM collaborations c
      JOIN users u ON c.created_by = u.id
      LEFT JOIN industry_profiles ip ON c.industry_id = ip.id
      LEFT JOIN institutions inst ON c.institution_id = inst.id
      WHERE 1=1
    `;
        const queryParams = [];
        if (status && status !== "all") {
            query += ` AND c.status = ?`;
            queryParams.push(status);
        }
        else {
            query += ` AND c.status = 'published'`;
        }
        if (type && typeof type === "string" && type.trim() !== "") {
            query += ` AND c.collaboration_type = ?`;
            queryParams.push(type.trim());
        }
        if (mode && typeof mode === "string" && mode.trim() !== "") {
            query += ` AND c.mode = ?`;
            queryParams.push(mode.trim());
        }
        if (target_audience && typeof target_audience === "string" && target_audience.trim() !== "") {
            query += ` AND (c.target_audience = ? OR c.target_audience = 'Both')`;
            queryParams.push(target_audience.trim());
        }
        if (search && typeof search === "string" && search.trim() !== "") {
            const searchTerm = `%${search.trim()}%`;
            query += ` AND (c.title LIKE ? OR c.description LIKE ? OR ip.company_name LIKE ? OR inst.name LIKE ?)`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        query += ` ORDER BY c.created_at DESC`;
        const [rows] = await pool.query(query, queryParams);
        // Attach required skills & current user participant status to each collaboration
        const result = await Promise.all(rows.map(async (collab) => {
            // Fetch required skills
            const [skillRows] = await pool.query(`SELECT s.id, s.name, s.category 
           FROM collaboration_skills cs
           JOIN skills s ON cs.skill_id = s.id
           WHERE cs.collaboration_id = ?`, [collab.id]);
            collab.skills = skillRows;
            const skillIds = skillRows.map((s) => s.id);
            // Compute match score if student user
            if (currentUserId && req.user?.role?.toLowerCase() === "student") {
                collab.match_score = await calculateSkillMatchScore(currentUserId, skillIds);
            }
            else {
                collab.match_score = null;
            }
            // Fetch user participant status
            if (currentUserId) {
                const [partRows] = await pool.query(`SELECT status FROM collaboration_participants WHERE collaboration_id = ? AND user_id = ?`, [collab.id, currentUserId]);
                collab.my_status = partRows.length > 0 ? partRows[0].status : null;
            }
            else {
                collab.my_status = null;
            }
            return collab;
        }));
        // Optional skill filtering in-memory if skill_id filter supplied
        let filteredResult = result;
        if (skill_id) {
            const targetSkillId = Number(skill_id);
            filteredResult = result.filter((collab) => collab.skills.some((s) => s.id === targetSkillId));
        }
        res.status(200).json({
            success: true,
            collaborations: filteredResult,
        });
    }
    catch (error) {
        console.error("Error in getCollaborations:", error);
        res.status(500).json({ success: false, message: "Failed to fetch collaborations." });
    }
};
// 2. GET /api/collaborations/:id
export const getCollaborationById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user ? req.user.id : null;
        const [rows] = await pool.query(`SELECT 
        c.*,
        u.name AS creator_name,
        u.email AS creator_email,
        u.role AS creator_role,
        ip.company_name,
        ip.website AS company_website,
        ip.logo AS company_logo,
        inst.name AS institution_name,
        inst.website AS institution_website,
        (SELECT COUNT(*) FROM collaboration_participants cp WHERE cp.collaboration_id = c.id) AS participant_count
       FROM collaborations c
       JOIN users u ON c.created_by = u.id
       LEFT JOIN industry_profiles ip ON c.industry_id = ip.id
       LEFT JOIN institutions inst ON c.institution_id = inst.id
       WHERE c.id = ?`, [id]);
        if (!rows || rows.length === 0) {
            res.status(404).json({ success: false, message: "Collaboration not found." });
            return;
        }
        const collab = rows[0];
        // Fetch skills
        const [skillRows] = await pool.query(`SELECT s.id, s.name, s.category 
       FROM collaboration_skills cs
       JOIN skills s ON cs.skill_id = s.id
       WHERE cs.collaboration_id = ?`, [collab.id]);
        collab.skills = skillRows;
        // Fetch user status
        if (currentUserId) {
            const [partRows] = await pool.query(`SELECT status FROM collaboration_participants WHERE collaboration_id = ? AND user_id = ?`, [collab.id, currentUserId]);
            collab.my_status = partRows.length > 0 ? partRows[0].status : null;
            if (req.user?.role?.toLowerCase() === "student") {
                const skillIds = skillRows.map((s) => s.id);
                collab.match_score = await calculateSkillMatchScore(currentUserId, skillIds);
            }
        }
        res.status(200).json({ success: true, collaboration: collab });
    }
    catch (error) {
        console.error("Error in getCollaborationById:", error);
        res.status(500).json({ success: false, message: "Failed to fetch collaboration details." });
    }
};
// 3. POST /api/collaborations (Create Collaboration with RBAC)
export const createCollaboration = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const userRole = req.user.role ? req.user.role.toString().toLowerCase() : "";
        const userId = req.user.id;
        let industryId = null;
        let institutionId = null;
        // RBAC Check for Creation
        if (userRole === "industry") {
            // Must be a verified industry profile
            const [indRows] = await pool.query(`SELECT id, verification_status FROM industry_profiles WHERE user_id = ?`, [userId]);
            if (!indRows || indRows.length === 0) {
                res.status(403).json({
                    success: false,
                    message: "Industry profile not found. Please set up your company profile first.",
                });
                return;
            }
            if (indRows[0].verification_status !== "approved") {
                res.status(403).json({
                    success: false,
                    message: "Only verified industry partners are allowed to publish collaborations.",
                });
                return;
            }
            industryId = indRows[0].id;
        }
        else if (["institution", "academician", "faculty", "institute"].includes(userRole)) {
            // Derive institution_id from users table or student_profiles
            const [uRows] = await pool.query(`SELECT institution_id FROM users WHERE id = ?`, [userId]);
            if (uRows && uRows.length > 0 && uRows[0].institution_id) {
                institutionId = uRows[0].institution_id;
            }
            else {
                // Fallback default institution
                institutionId = 1;
            }
        }
        else if (userRole === "admin") {
            // Admin can publish
            institutionId = 1;
        }
        else {
            res.status(403).json({
                success: false,
                message: "Students are not authorized to create collaboration listings.",
            });
            return;
        }
        const { title, description, collaboration_type, target_audience = "Both", start_date, end_date, start_time, location, mode = "Online", capacity = 50, skill_ids = [], } = req.body;
        // Validations
        if (!title || typeof title !== "string" || title.trim() === "") {
            res.status(400).json({ success: false, message: "Title is required." });
            return;
        }
        if (!description || typeof description !== "string" || description.trim() === "") {
            res.status(400).json({ success: false, message: "Description is required." });
            return;
        }
        if (!collaboration_type || !VALID_COLLABORATION_TYPES.includes(collaboration_type)) {
            res.status(400).json({
                success: false,
                message: `Invalid collaboration_type. Must be one of: ${VALID_COLLABORATION_TYPES.join(", ")}`,
            });
            return;
        }
        // Insert Collaboration
        const [result] = await pool.query(`INSERT INTO collaborations 
       (created_by, industry_id, institution_id, title, description, collaboration_type, target_audience, start_date, end_date, start_time, location, mode, capacity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`, [
            userId,
            industryId,
            institutionId,
            title.trim(),
            description.trim(),
            collaboration_type,
            target_audience,
            start_date || null,
            end_date || null,
            start_time || null,
            location || null,
            mode,
            Number(capacity) || 50,
        ]);
        const collaborationId = result.insertId;
        // Insert Collaboration Skills
        if (Array.isArray(skill_ids) && skill_ids.length > 0) {
            for (const item of skill_ids) {
                let finalSkillId = null;
                if (typeof item === "number" || (!isNaN(Number(item)) && String(item).trim() !== "")) {
                    finalSkillId = Number(item);
                }
                else if (typeof item === "string" && item.trim() !== "") {
                    const sName = item.trim();
                    const [existRows] = await pool.query(`SELECT id FROM skills WHERE LOWER(name) = LOWER(?) LIMIT 1`, [sName]);
                    if (existRows.length > 0) {
                        finalSkillId = existRows[0].id;
                    }
                    else {
                        const [insRes] = await pool.query(`INSERT INTO skills (name, category) VALUES (?, 'Technical')`, [sName]);
                        finalSkillId = insRes.insertId;
                    }
                }
                if (finalSkillId) {
                    await pool.query(`INSERT INTO collaboration_skills (collaboration_id, skill_id) 
             VALUES (?, ?) ON DUPLICATE KEY UPDATE skill_id = VALUES(skill_id)`, [collaborationId, finalSkillId]);
                }
            }
        }
        res.status(201).json({
            success: true,
            message: "Collaboration initiative created successfully!",
            collaboration_id: collaborationId,
        });
    }
    catch (error) {
        console.error("Error in createCollaboration:", error);
        res.status(500).json({ success: false, message: "Failed to create collaboration initiative." });
    }
};
// 4. PUT /api/collaborations/:id
export const updateCollaboration = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role ? req.user.role.toString().toLowerCase() : "";
        // Verify ownership
        const [collabRows] = await pool.query(`SELECT created_by FROM collaborations WHERE id = ?`, [id]);
        if (!collabRows || collabRows.length === 0) {
            res.status(404).json({ success: false, message: "Collaboration not found." });
            return;
        }
        if (collabRows[0].created_by !== userId && userRole !== "admin") {
            res.status(403).json({ success: false, message: "Unauthorized to edit this collaboration." });
            return;
        }
        const { title, description, collaboration_type, target_audience, start_date, end_date, location, mode, capacity, status, skill_ids, } = req.body;
        await pool.query(`UPDATE collaborations SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        collaboration_type = COALESCE(?, collaboration_type),
        target_audience = COALESCE(?, target_audience),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        location = COALESCE(?, location),
        mode = COALESCE(?, mode),
        capacity = COALESCE(?, capacity),
        status = COALESCE(?, status)
       WHERE id = ?`, [
            title || null,
            description || null,
            collaboration_type || null,
            target_audience || null,
            start_date || null,
            end_date || null,
            location || null,
            mode || null,
            capacity || null,
            status || null,
            id,
        ]);
        // Update Skills if provided
        if (Array.isArray(skill_ids)) {
            await pool.query(`DELETE FROM collaboration_skills WHERE collaboration_id = ?`, [id]);
            for (const sId of skill_ids) {
                if (Number(sId)) {
                    await pool.query(`INSERT INTO collaboration_skills (collaboration_id, skill_id) VALUES (?, ?)`, [id, Number(sId)]);
                }
            }
        }
        res.status(200).json({ success: true, message: "Collaboration updated successfully." });
    }
    catch (error) {
        console.error("Error in updateCollaboration:", error);
        res.status(500).json({ success: false, message: "Failed to update collaboration." });
    }
};
// 5. DELETE /api/collaborations/:id
export const deleteCollaboration = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role ? req.user.role.toString().toLowerCase() : "";
        const [collabRows] = await pool.query(`SELECT created_by FROM collaborations WHERE id = ?`, [id]);
        if (!collabRows || collabRows.length === 0) {
            res.status(404).json({ success: false, message: "Collaboration not found." });
            return;
        }
        if (collabRows[0].created_by !== userId && userRole !== "admin") {
            res.status(403).json({ success: false, message: "Unauthorized to delete this collaboration." });
            return;
        }
        await pool.query(`DELETE FROM collaborations WHERE id = ?`, [id]);
        res.status(200).json({ success: true, message: "Collaboration deleted successfully." });
    }
    catch (error) {
        console.error("Error in deleteCollaboration:", error);
        res.status(500).json({ success: false, message: "Failed to delete collaboration." });
    }
};
// 6. POST /api/collaborations/:id/apply (Apply / Join)
export const applyCollaboration = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role ? req.user.role.toString() : "Student";
        // Fetch Collaboration
        const [collabRows] = await pool.query(`SELECT id, capacity, target_audience, status FROM collaborations WHERE id = ?`, [id]);
        if (!collabRows || collabRows.length === 0) {
            res.status(404).json({ success: false, message: "Collaboration not found." });
            return;
        }
        const collab = collabRows[0];
        if (collab.status !== "published") {
            res.status(400).json({ success: false, message: "This collaboration is closed for applications." });
            return;
        }
        // Check Capacity
        const [partCountRows] = await pool.query(`SELECT COUNT(*) AS total FROM collaboration_participants WHERE collaboration_id = ? AND status != 'Rejected'`, [id]);
        if (partCountRows[0].total >= collab.capacity) {
            res.status(400).json({ success: false, message: "Capacity reached for this collaboration." });
            return;
        }
        // Check target audience alignment
        const roleLower = userRole.toLowerCase();
        if (collab.target_audience === "Student" && roleLower !== "student") {
            res.status(403).json({
                success: false,
                message: "This initiative is reserved exclusively for students.",
            });
            return;
        }
        if (collab.target_audience === "Faculty" &&
            !["academician", "faculty", "institution", "institute"].includes(roleLower)) {
            res.status(403).json({
                success: false,
                message: "This initiative is reserved exclusively for faculty / academicians.",
            });
            return;
        }
        // Check if already applied
        const [existing] = await pool.query(`SELECT id, status FROM collaboration_participants WHERE collaboration_id = ? AND user_id = ?`, [id, userId]);
        if (existing && existing.length > 0) {
            res.status(400).json({
                success: false,
                message: `You have already applied/joined. Current status: ${existing[0].status}`,
            });
            return;
        }
        // Insert Participant Record
        await pool.query(`INSERT INTO collaboration_participants (collaboration_id, user_id, role, status) VALUES (?, ?, ?, 'Applied')`, [id, userId, userRole]);
        res.status(201).json({
            success: true,
            message: "Application / registration submitted successfully!",
        });
    }
    catch (error) {
        console.error("Error in applyCollaboration:", error);
        res.status(500).json({ success: false, message: "Failed to apply for collaboration." });
    }
};
// 7. DELETE /api/collaborations/:id/apply (Cancel Application)
export const cancelApplication = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const { id } = req.params;
        const userId = req.user.id;
        const [result] = await pool.query(`DELETE FROM collaboration_participants WHERE collaboration_id = ? AND user_id = ? AND status = 'Applied'`, [id, userId]);
        if (result.affectedRows === 0) {
            res.status(400).json({
                success: false,
                message: "No pending application found to cancel.",
            });
            return;
        }
        res.status(200).json({ success: true, message: "Application cancelled successfully." });
    }
    catch (error) {
        console.error("Error in cancelApplication:", error);
        res.status(500).json({ success: false, message: "Failed to cancel application." });
    }
};
// 8. GET /api/collaborations/my (User's Participations & Created Listings)
export const getMyCollaborations = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const userId = req.user.id;
        const userRole = req.user.role ? req.user.role.toString().toLowerCase() : "";
        // Participations
        const [participations] = await pool.query(`SELECT 
        cp.id AS participant_id,
        cp.status AS participation_status,
        cp.applied_at,
        cp.updated_at,
        c.id AS collaboration_id,
        c.title,
        c.description,
        c.collaboration_type,
        c.target_audience,
        c.start_date,
        c.end_date,
        c.location,
        c.mode,
        c.capacity,
        u.name AS creator_name,
        ip.company_name,
        ip.logo AS company_logo,
        inst.name AS institution_name
       FROM collaboration_participants cp
       JOIN collaborations c ON cp.collaboration_id = c.id
       JOIN users u ON c.created_by = u.id
       LEFT JOIN industry_profiles ip ON c.industry_id = ip.id
       LEFT JOIN institutions inst ON c.institution_id = inst.id
       WHERE cp.user_id = ?
       ORDER BY cp.applied_at DESC`, [userId]);
        // If Creator (Industry/Institution/Admin), also get created collaborations
        let created = [];
        if (["industry", "institution", "academician", "faculty", "admin"].includes(userRole)) {
            const [createdRows] = await pool.query(`SELECT 
          c.*,
          (SELECT COUNT(*) FROM collaboration_participants cp WHERE cp.collaboration_id = c.id) AS participant_count
         FROM collaborations c
         WHERE c.created_by = ?
         ORDER BY c.created_at DESC`, [userId]);
            created = createdRows;
        }
        res.status(200).json({
            success: true,
            participations,
            created,
        });
    }
    catch (error) {
        console.error("Error in getMyCollaborations:", error);
        res.status(500).json({ success: false, message: "Failed to fetch user collaborations." });
    }
};
// 9. GET /api/collaborations/:id/participants
export const getCollaborationParticipants = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role ? req.user.role.toString().toLowerCase() : "";
        // Verify requester is creator or admin
        const [collabRows] = await pool.query(`SELECT created_by FROM collaborations WHERE id = ?`, [id]);
        if (!collabRows || collabRows.length === 0) {
            res.status(404).json({ success: false, message: "Collaboration not found." });
            return;
        }
        if (collabRows[0].created_by !== userId && userRole !== "admin") {
            res.status(403).json({ success: false, message: "Unauthorized to view participants." });
            return;
        }
        const [participants] = await pool.query(`SELECT 
        cp.id AS participant_id,
        cp.user_id,
        cp.role,
        cp.status,
        cp.applied_at,
        u.name,
        u.email,
        sp.degree,
        sp.department,
        sp.current_sem,
        sp.roll_number,
        sp.cgpa,
        sp.phone
       FROM collaboration_participants cp
       JOIN users u ON cp.user_id = u.id
       LEFT JOIN student_profiles sp ON u.id = sp.user_id
       WHERE cp.collaboration_id = ?
       ORDER BY cp.applied_at DESC`, [id]);
        res.status(200).json({ success: true, participants });
    }
    catch (error) {
        console.error("Error in getCollaborationParticipants:", error);
        res.status(500).json({ success: false, message: "Failed to fetch participants." });
    }
};
// 10. PATCH /api/collaborations/:id/participants/:participantId (Update participant status)
export const updateParticipantStatus = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const { id, participantId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role ? req.user.role.toString().toLowerCase() : "";
        if (!["Accepted", "Rejected", "Completed", "Applied"].includes(status)) {
            res.status(400).json({ success: false, message: "Invalid status value." });
            return;
        }
        // Ownership check
        const [collabRows] = await pool.query(`SELECT created_by FROM collaborations WHERE id = ?`, [id]);
        if (!collabRows || collabRows.length === 0) {
            res.status(404).json({ success: false, message: "Collaboration not found." });
            return;
        }
        if (collabRows[0].created_by !== userId && userRole !== "admin") {
            res.status(403).json({ success: false, message: "Unauthorized to manage participants." });
            return;
        }
        await pool.query(`UPDATE collaboration_participants SET status = ? WHERE id = ? AND collaboration_id = ?`, [status, participantId, id]);
        res.status(200).json({ success: true, message: `Participant status updated to ${status}.` });
    }
    catch (error) {
        console.error("Error in updateParticipantStatus:", error);
        res.status(500).json({ success: false, message: "Failed to update participant status." });
    }
};
