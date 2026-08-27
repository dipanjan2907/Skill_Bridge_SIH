import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { signInSchema, signUpSchema } from "../schemas/auth.schema.js";
export const signIn = async (req, res) => {
    try {
        const result = signInSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.error.issues[0]?.message || "Invalid login input.",
            });
            return;
        }
        const { identifier, password } = result.data;
        const sql = `
      SELECT * FROM users
      WHERE username = ? OR email = ?
    `;
        const [rows] = await pool.query(sql, [identifier, identifier]);
        if (!rows || rows.length === 0) {
            res.status(401).json({
                success: false,
                message: "Invalid username/email or password",
            });
            return;
        }
        const user = rows[0];
        const storedPassword = user.password || user.password_hash;
        const passwordMatch = await bcrypt.compare(password, storedPassword);
        if (!passwordMatch) {
            res.status(401).json({
                success: false,
                message: "Invalid username/email or password",
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET || "skillbridge_super_jwt_secret_2026";
        const token = jwt.sign({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
        }, jwtSecret, {
            expiresIn: "7d",
        });
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username || user.name,
                email: user.email,
                role: user.role,
                is_verified: user.is_verified,
            },
        });
    }
    catch (error) {
        console.error("SignIn controller error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during sign in: " + (error.message || "Database query failed"),
        });
    }
};
export const signUp = async (req, res) => {
    try {
        const result = signUpSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                success: false,
                message: result.error.issues[0]?.message || "Invalid registration input.",
            });
            return;
        }
        const { name, username, email, password, role } = result.data;
        const lowerRole = role.trim().toLowerCase();
        if (lowerRole === "admin") {
            res.status(400).json({
                success: false,
                message: "Admin accounts cannot be registered publicly.",
            });
            return;
        }
        // STRICT UNIVERSITY / INSTITUTION VERIFICATION
        let validInstitutionId = null;
        const inputInstitutionId = req.body.institution_id || req.body.institutionId;
        const inputInstitutionName = req.body.institution_name || req.body.institutionName || req.body.university;
        if (["student", "faculty", "academician", "institution", "institute"].includes(lowerRole)) {
            if (!inputInstitutionId && !inputInstitutionName) {
                res.status(400).json({
                    success: false,
                    message: "University / Institution is required for account creation.",
                });
                return;
            }
            let checkInstSql = `SELECT id, name, verification_status FROM institutions WHERE 1=0`;
            const queryParams = [];
            if (inputInstitutionId) {
                checkInstSql += ` OR id = ?`;
                queryParams.push(inputInstitutionId);
            }
            if (inputInstitutionName) {
                checkInstSql += ` OR LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?)`;
                queryParams.push(String(inputInstitutionName).trim(), String(inputInstitutionName).trim());
            }
            const [instRows] = await pool.query(checkInstSql, queryParams);
            if (!instRows || instRows.length === 0) {
                res.status(400).json({
                    success: false,
                    message: "Selected university/institution is not registered in our database. Registration is strictly permitted only for institutions existing in our database.",
                });
                return;
            }
            validInstitutionId = instRows[0].id;
        }
        // Check if username or email exists
        const checkSql = `
      SELECT id FROM users
      WHERE username = ? OR email = ?
    `;
        const [existing] = await pool.query(checkSql, [username, email]);
        if (existing && existing.length > 0) {
            res.status(409).json({
                success: false,
                message: "Username or email already exists",
            });
            return;
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertSql = `
      INSERT INTO users (name, username, email, password, role, institution_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
        const [insertResult] = await pool.query(insertSql, [
            name,
            username,
            email,
            hashedPassword,
            role,
            validInstitutionId,
        ]);
        const userId = insertResult.insertId;
        // Auto-seed student profile if role is Student (verification_status defaults to 'pending')
        if (lowerRole === "student") {
            try {
                await pool.query(`INSERT INTO student_profiles (user_id, institution_id, verification_status) 
           VALUES (?, ?, 'pending')
           ON DUPLICATE KEY UPDATE institution_id=VALUES(institution_id)`, [userId, validInstitutionId]);
            }
            catch (err) {
                console.warn("Notice: Default student profile auto-seed error:", err);
            }
        }
        // Auto-create industry profile if role is Industry
        if (lowerRole === "industry") {
            try {
                const companyName = req.body.companyName || req.body.company_name || name;
                const companyType = req.body.companyType || req.body.company_type || null;
                const industrySector = req.body.industrySector || req.body.industry_sector || null;
                const description = req.body.description || null;
                const website = req.body.website || null;
                const location = req.body.location || null;
                const contactEmail = req.body.contactEmail || req.body.contact_email || email;
                const phone = req.body.phone || null;
                const logo = req.body.logo || null;
                await pool.query(`INSERT INTO industry_profiles 
            (user_id, company_name, company_type, industry_sector, description, website, location, contact_email, phone, logo, verification_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
           ON DUPLICATE KEY UPDATE user_id=user_id`, [userId, companyName, companyType, industrySector, description, website, location, contactEmail, phone, logo]);
            }
            catch (err) {
                console.warn("Notice: Industry profile auto-creation error:", err);
            }
        }
        const jwtSecret = process.env.JWT_SECRET || "skillbridge_super_jwt_secret_2026";
        const token = jwt.sign({
            id: userId,
            username,
            email,
            role,
        }, jwtSecret, { expiresIn: "7d" });
        res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
            user: {
                id: userId,
                name,
                username,
                email,
                role,
            },
        });
    }
    catch (error) {
        console.error("SignUp controller error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during account creation: " + (error.message || "Database insert failed"),
        });
    }
};
export const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const userId = req.user.id;
        const [results] = await pool.query(`SELECT u.id, u.name, u.username, u.email, u.role, u.institution_id, u.created_at,
              i.name AS institution_name, COALESCE(i.verification_status, 'approved') AS institution_verification_status
       FROM users u
       LEFT JOIN institutions i ON u.institution_id = i.id
       WHERE u.id = ?`, [userId]);
        if (!results || results.length === 0) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        const userData = results[0];
        const lowerRole = String(userData.role).toLowerCase();
        if (lowerRole === "student") {
            const [spResults] = await pool.query(`SELECT * FROM student_profiles WHERE user_id = ?`, [userId]);
            res.status(200).json({
                success: true,
                user: userData,
                student_profile: spResults && spResults.length > 0 ? spResults[0] : null,
            });
        }
        else if (lowerRole === "industry") {
            const [cResults] = await pool.query(`SELECT * FROM industry_profiles WHERE user_id = ?`, [userId]);
            res.status(200).json({
                success: true,
                user: userData,
                company_profile: cResults && cResults.length > 0 ? cResults[0] : null,
            });
        }
        else {
            res.status(200).json({
                success: true,
                user: userData,
            });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error fetching user" });
    }
};
