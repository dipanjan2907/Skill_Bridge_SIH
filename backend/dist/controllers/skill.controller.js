import db from "../config/db";
export const getSkills = (req, res) => {
    const { search, category } = req.query;
    let sql = `SELECT * FROM skills WHERE 1=1`;
    const params = [];
    if (search) {
        sql += ` AND name LIKE ?`;
        params.push(`%${search}%`);
    }
    if (category) {
        sql += ` AND category = ?`;
        params.push(category);
    }
    sql += ` ORDER BY name ASC`;
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error fetching skills:", err);
            res.status(500).json({ success: false, message: "Failed to fetch skills" });
            return;
        }
        res.status(200).json({
            success: true,
            data: results,
        });
    });
};
export const createSkill = (req, res) => {
    const { name, category, description } = req.body;
    if (!name) {
        res.status(400).json({ success: false, message: "Skill name is required" });
        return;
    }
    const sql = `INSERT INTO skills (name, category, description) VALUES (?, ?, ?)`;
    db.query(sql, [name.trim(), category || null, description || null], (err, result) => {
        if (err) {
            if (err.message.includes("ER_DUP_ENTRY") || err.message.includes("Duplicate entry")) {
                res.status(409).json({ success: false, message: "Skill already exists" });
                return;
            }
            console.error("Error creating skill:", err);
            res.status(500).json({ success: false, message: "Failed to create skill" });
            return;
        }
        res.status(201).json({
            success: true,
            message: "Skill created successfully",
            data: {
                id: result.insertId,
                name: name.trim(),
                category,
                description,
            },
        });
    });
};
