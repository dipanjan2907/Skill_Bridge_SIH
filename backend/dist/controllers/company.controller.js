import db from "../config/db";
const getCompanyId = (userId, name = "Company") => {
    return new Promise((resolve, reject) => {
        db.query(`SELECT id FROM companies WHERE user_id = ?`, [userId], (err, results) => {
            if (err)
                return reject(err);
            if (results.length > 0)
                return resolve(results[0].id);
            db.query(`INSERT INTO companies (user_id, company_name) VALUES (?, ?)`, [userId, name], (cErr, cResult) => {
                if (cErr)
                    return reject(cErr);
                resolve(cResult.insertId);
            });
        });
    });
};
export const getMyCompanyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = await getCompanyId(userId, req.user.name || "Company");
        db.query(`SELECT c.*, u.email as contact_email 
       FROM companies c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.id = ?`, [companyId], (err, results) => {
            if (err || results.length === 0) {
                res.status(500).json({ success: false, message: "Failed to load company profile" });
                return;
            }
            res.status(200).json({ success: true, data: results[0] });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const updateCompanyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = await getCompanyId(userId, req.user.name || "Company");
        const { company_name, industry_type, description, website, location, logo_url } = req.body;
        const sql = `
      UPDATE companies
      SET company_name = ?, industry_type = ?, description = ?, website = ?, location = ?, logo_url = ?
      WHERE id = ?
    `;
        db.query(sql, [
            company_name || "Company",
            industry_type || null,
            description || null,
            website || null,
            location || null,
            logo_url || null,
            companyId,
        ], (err) => {
            if (err) {
                console.error("Error updating company profile:", err);
                res.status(500).json({ success: false, message: "Failed to update profile" });
                return;
            }
            res.status(200).json({ success: true, message: "Company profile updated successfully" });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
export const getAllCompanies = (req, res) => {
    db.query(`SELECT * FROM companies ORDER BY company_name ASC`, (err, results) => {
        if (err) {
            res.status(500).json({ success: false, message: "Failed to fetch companies" });
            return;
        }
        res.status(200).json({ success: true, data: results });
    });
};
export const getCompanyById = (req, res) => {
    const { id } = req.params;
    db.query(`SELECT * FROM companies WHERE id = ?`, [id], (err, results) => {
        if (err || results.length === 0) {
            res.status(404).json({ success: false, message: "Company not found" });
            return;
        }
        res.status(200).json({ success: true, data: results[0] });
    });
};
