import pool from "../config/db.js";
export const getStudentProfile = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized access" });
        return;
    }
    try {
        // 1. Fetch user, student_profile, and JOINED institution from institutions table
        // Using DATE_FORMAT(sp.dob, '%Y-%m-%d') prevents JS Date timezone offset shifting bugs
        let [profileRows] = await pool.query(`SELECT 
        u.name, 
        u.email, 
        sp.id AS profile_id,
        sp.institution_id,
        sp.phone, 
        sp.location, 
        DATE_FORMAT(sp.dob, '%Y-%m-%d') AS dob, 
        sp.gender, 
        sp.bio, 
        COALESCE(inst.name, 'Enrolled Institute') AS institution, 
        inst.code AS institution_code,
        sp.degree, 
        sp.department, 
        sp.roll_number, 
        sp.current_sem, 
        sp.cgpa, 
        sp.expected_grad, 
        sp.counselor, 
        sp.github, 
        sp.linkedin, 
        sp.portfolio,
        sp.work_mode_preference,
        sp.expected_stipend_min,
        sp.expected_stipend_max,
        sp.preferred_locations,
        sp.target_roles
       FROM users u 
       LEFT JOIN student_profiles sp ON u.id = sp.user_id 
       LEFT JOIN institutions inst ON sp.institution_id = inst.id
       WHERE u.id = ?`, [userId]);
        if (profileRows.length === 0) {
            res.status(404).json({ error: "Student account not found in database" });
            return;
        }
        let rawProfile = profileRows[0];
        // If profile row doesn't exist yet, auto-create one linked to institution_id = 1
        if (!rawProfile.profile_id) {
            await pool.query(`INSERT INTO student_profiles (user_id, institution_id, degree, department, cgpa, location, bio)
         VALUES (?, 1, 'Bachelor of Technology (B.Tech)', 'Computer Science & Engineering', 8.75, 'Kolkata, West Bengal', 'Passionate CS student proficient in Python, SQL, and Web Tech.')
         ON DUPLICATE KEY UPDATE user_id=user_id`, [userId]);
            // Re-query profile with formatted dob
            const [reQueried] = await pool.query(`SELECT 
          u.name, 
          u.email, 
          sp.id AS profile_id,
          sp.institution_id,
          sp.phone, 
          sp.location, 
          DATE_FORMAT(sp.dob, '%Y-%m-%d') AS dob, 
          sp.gender, 
          sp.bio, 
          COALESCE(inst.name, 'Enrolled Institute') AS institution, 
          inst.code AS institution_code,
          sp.degree, 
          sp.department, 
          sp.roll_number, 
          sp.current_sem, 
          sp.cgpa, 
          sp.expected_grad, 
          sp.counselor, 
          sp.github, 
          sp.linkedin, 
          sp.portfolio,
          sp.work_mode_preference,
          sp.expected_stipend_min,
          sp.expected_stipend_max,
          sp.preferred_locations,
          sp.target_roles
         FROM users u 
         LEFT JOIN student_profiles sp ON u.id = sp.user_id 
         LEFT JOIN institutions inst ON sp.institution_id = inst.id
         WHERE u.id = ?`, [userId]);
            if (reQueried.length > 0) {
                rawProfile = reQueried[0];
            }
        }
        const studentProfileId = rawProfile.profile_id;
        // Parse JSON attributes safely
        const profile = {
            ...rawProfile,
            preferred_locations: typeof rawProfile.preferred_locations === "string"
                ? JSON.parse(rawProfile.preferred_locations)
                : rawProfile.preferred_locations || ["Kolkata", "Bengaluru", "Remote"],
            target_roles: typeof rawProfile.target_roles === "string"
                ? JSON.parse(rawProfile.target_roles)
                : rawProfile.target_roles || ["Junior Data Analyst", "Frontend Engineer"],
        };
        // 2. Fetch Verified Skills with category
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
        // 3. Fetch Projects
        let [projectRows] = await pool.query(`SELECT id, title, description, tech_stack, status, project_url 
       FROM student_projects 
       WHERE student_id = ?`, [studentProfileId || 1]);
        if (!projectRows || projectRows.length === 0) {
            const [defaultProj] = await pool.query(`SELECT id, title, description, tech_stack, status, project_url FROM student_projects WHERE student_id = 1`);
            projectRows = defaultProj;
        }
        const projects = projectRows.map((p) => ({
            ...p,
            tech_stack: typeof p.tech_stack === "string"
                ? JSON.parse(p.tech_stack)
                : p.tech_stack || [],
        }));
        // 4. Fetch Certifications
        let [certifications] = await pool.query(`SELECT id, title, issuer, issue_year, credential_url 
       FROM student_certifications 
       WHERE student_id = ?`, [studentProfileId || 1]);
        if (!certifications || certifications.length === 0) {
            const [defaultCerts] = await pool.query(`SELECT id, title, issuer, issue_year, credential_url FROM student_certifications WHERE student_id = 1`);
            certifications = defaultCerts;
        }
        res.status(200).json({
            profile,
            skills,
            projects,
            certifications,
        });
    }
    catch (error) {
        console.error("getStudentProfile error:", error);
        res.status(500).json({ error: `Database failure: ${error.message}` });
    }
};
export const updateStudentProfile = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: "Unauthorized access" });
        return;
    }
    const { name, phone, location, dob, gender, bio, institution_id, degree, department, roll_number, current_sem, cgpa, expected_grad, counselor, github, linkedin, portfolio, work_mode_preference, expected_stipend_min, expected_stipend_max, preferred_locations, target_roles, } = req.body;
    try {
        // Update user full name in users table if changed
        if (name) {
            await pool.query(`UPDATE users SET name = ? WHERE id = ?`, [name, userId]);
        }
        const cleanInstId = institution_id ? parseInt(String(institution_id)) || null : null;
        const cleanDob = dob && typeof dob === "string" && dob.trim() !== "" ? dob.split("T")[0] : null;
        const cleanCgpa = cgpa ? parseFloat(cgpa) || null : null;
        const cleanStipendMin = expected_stipend_min ? parseInt(expected_stipend_min) || null : null;
        const cleanStipendMax = expected_stipend_max ? parseInt(expected_stipend_max) || null : null;
        await pool.query(`INSERT INTO student_profiles (
        user_id, institution_id, phone, location, dob, gender, bio, degree,
        department, roll_number, current_sem, cgpa, expected_grad,
        counselor, github, linkedin, portfolio, work_mode_preference,
        expected_stipend_min, expected_stipend_max, preferred_locations, target_roles
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        institution_id = VALUES(institution_id),
        phone = VALUES(phone),
        location = VALUES(location),
        dob = VALUES(dob),
        gender = VALUES(gender),
        bio = VALUES(bio),
        degree = VALUES(degree),
        department = VALUES(department),
        roll_number = VALUES(roll_number),
        current_sem = VALUES(current_sem),
        cgpa = VALUES(cgpa),
        expected_grad = VALUES(expected_grad),
        counselor = VALUES(counselor),
        github = VALUES(github),
        linkedin = VALUES(linkedin),
        portfolio = VALUES(portfolio),
        work_mode_preference = VALUES(work_mode_preference),
        expected_stipend_min = VALUES(expected_stipend_min),
        expected_stipend_max = VALUES(expected_stipend_max),
        preferred_locations = VALUES(preferred_locations),
        target_roles = VALUES(target_roles)`, [
            userId,
            cleanInstId,
            phone || null,
            location || null,
            cleanDob,
            gender || null,
            bio || null,
            degree || null,
            department || null,
            roll_number || null,
            current_sem || null,
            cleanCgpa,
            expected_grad || null,
            counselor || null,
            github || null,
            linkedin || null,
            portfolio || null,
            work_mode_preference || null,
            cleanStipendMin,
            cleanStipendMax,
            preferred_locations ? JSON.stringify(preferred_locations) : null,
            target_roles ? JSON.stringify(target_roles) : null,
        ]);
        res
            .status(200)
            .json({ message: "Profile successfully synchronized with database" });
    }
    catch (error) {
        console.error("updateStudentProfile error:", error);
        res.status(500).json({ error: `Update failed: ${error.message}` });
    }
};
export const getInstitutions = async (_req, res) => {
    try {
        const [rows] = await pool.query(`SELECT id, name, code, location, website FROM institutions ORDER BY name ASC`);
        res.status(200).json(rows);
    }
    catch (error) {
        console.error("getInstitutions error:", error);
        res.status(500).json({ error: `Database error: ${error.message}` });
    }
};
