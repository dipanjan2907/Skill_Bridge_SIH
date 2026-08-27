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
            username: user.username,
            email: user.email,
            role: user.role,
        }, jwtSecret, { expiresIn: "7d" });
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
        if (role.trim().toLowerCase() === "admin") {
            res.status(400).json({
                success: false,
                message: "Admin accounts cannot be registered publicly.",
            });
            return;
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
      INSERT INTO users (name, username, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `;
        const [insertResult] = await pool.query(insertSql, [
            name,
            username,
            email,
            hashedPassword,
            role,
        ]);
        const userId = insertResult.insertId;
        const lowerRole = role.toLowerCase();
        // Auto-seed default student profile if role is Student
        if (lowerRole === "student") {
            try {
                await pool.query(`INSERT INTO student_profiles (user_id, institution, degree, department, cgpa) 
           VALUES (?, 'JIS University', 'Bachelor of Technology (B.Tech)', 'Computer Science & Engineering', 8.5)
           ON DUPLICATE KEY UPDATE user_id=user_id`, [userId]);
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
