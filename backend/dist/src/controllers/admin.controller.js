import pool from "../config/db.js";
const formatAdminIndustryItem = (row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || null,
    userEmail: row.user_email || null,
    companyName: row.company_name,
    companyType: row.company_type || null,
    industrySector: row.industry_sector || null,
    description: row.description || null,
    website: row.website || null,
    location: row.location || null,
    contactEmail: row.contact_email || null,
    phone: row.phone || null,
    logo: row.logo || null,
    verificationStatus: row.verification_status,
    rejectionReason: row.rejection_reason || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});
export const getIndustries = async (req, res) => {
    try {
        const statusParam = req.query.status ? String(req.query.status).trim().toLowerCase() : null;
        let sql = `
      SELECT 
        ip.id,
        ip.user_id,
        ip.company_name,
        ip.company_type,
        ip.industry_sector,
        ip.description,
        ip.website,
        ip.location,
        ip.contact_email,
        ip.phone,
        ip.logo,
        ip.verification_status,
        ip.rejection_reason,
        ip.created_at,
        ip.updated_at,
        u.name AS user_name,
        u.email AS user_email
      FROM industry_profiles ip
      JOIN users u ON ip.user_id = u.id
    `;
        const queryParams = [];
        if (statusParam && ["pending", "approved", "rejected"].includes(statusParam)) {
            sql += ` WHERE ip.verification_status = ?`;
            queryParams.push(statusParam);
        }
        sql += ` ORDER BY ip.created_at DESC`;
        const [rows] = await pool.query(sql, queryParams);
        const industries = rows.map(formatAdminIndustryItem);
        res.status(200).json({
            success: true,
            count: industries.length,
            data: industries,
        });
    }
    catch (error) {
        console.error("getIndustries error:", error);
        res.status(500).json({
            success: false,
            message: `Failed to retrieve industry list: ${error.message}`,
        });
    }
};
export const getIndustryById = async (req, res) => {
    const rawId = req.params.id;
    const idStr = Array.isArray(rawId) ? rawId[0] : String(rawId);
    try {
        const industryId = parseInt(idStr, 10);
        if (isNaN(industryId)) {
            res.status(400).json({ success: false, message: "Invalid industry ID." });
            return;
        }
        const [rows] = await pool.query(`SELECT 
        ip.id,
        ip.user_id,
        ip.company_name,
        ip.company_type,
        ip.industry_sector,
        ip.description,
        ip.website,
        ip.location,
        ip.contact_email,
        ip.phone,
        ip.logo,
        ip.verification_status,
        ip.rejection_reason,
        ip.created_at,
        ip.updated_at,
        u.name AS user_name,
        u.email AS user_email
      FROM industry_profiles ip
      JOIN users u ON ip.user_id = u.id
      WHERE ip.id = ? OR ip.user_id = ?`, [industryId, industryId]);
        if (!rows || rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "Industry profile not found.",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: formatAdminIndustryItem(rows[0]),
        });
    }
    catch (error) {
        console.error("getIndustryById error:", error);
        res.status(500).json({
            success: false,
            message: `Failed to retrieve industry profile: ${error.message}`,
        });
    }
};
export const approveIndustry = async (req, res) => {
    const rawId = req.params.id;
    const idStr = Array.isArray(rawId) ? rawId[0] : String(rawId);
    try {
        const industryId = parseInt(idStr, 10);
        if (isNaN(industryId)) {
            res.status(400).json({ success: false, message: "Invalid industry ID." });
            return;
        }
        const [existing] = await pool.query(`SELECT id FROM industry_profiles WHERE id = ? OR user_id = ?`, [industryId, industryId]);
        if (!existing || existing.length === 0) {
            res.status(404).json({
                success: false,
                message: "Industry profile not found.",
            });
            return;
        }
        const actualId = existing[0].id;
        await pool.query(`UPDATE industry_profiles
       SET verification_status = 'approved', rejection_reason = NULL, updated_at = NOW()
       WHERE id = ?`, [actualId]);
        const [updatedRows] = await pool.query(`SELECT 
        ip.id,
        ip.user_id,
        ip.company_name,
        ip.company_type,
        ip.industry_sector,
        ip.description,
        ip.website,
        ip.location,
        ip.contact_email,
        ip.phone,
        ip.logo,
        ip.verification_status,
        ip.rejection_reason,
        ip.created_at,
        ip.updated_at,
        u.name AS user_name,
        u.email AS user_email
      FROM industry_profiles ip
      JOIN users u ON ip.user_id = u.id
      WHERE ip.id = ?`, [actualId]);
        res.status(200).json({
            success: true,
            message: "Industry approved successfully.",
            data: formatAdminIndustryItem(updatedRows[0]),
        });
    }
    catch (error) {
        console.error("approveIndustry error:", error);
        res.status(500).json({
            success: false,
            message: `Failed to approve industry: ${error.message}`,
        });
    }
};
export const rejectIndustry = async (req, res) => {
    const rawId = req.params.id;
    const idStr = Array.isArray(rawId) ? rawId[0] : String(rawId);
    try {
        const industryId = parseInt(idStr, 10);
        if (isNaN(industryId)) {
            res.status(400).json({ success: false, message: "Invalid industry ID." });
            return;
        }
        const [existing] = await pool.query(`SELECT id FROM industry_profiles WHERE id = ? OR user_id = ?`, [industryId, industryId]);
        if (!existing || existing.length === 0) {
            res.status(404).json({
                success: false,
                message: "Industry profile not found.",
            });
            return;
        }
        const actualId = existing[0].id;
        const rejectionReason = req.body.rejectionReason || req.body.rejection_reason || "Requirements not met";
        await pool.query(`UPDATE industry_profiles
       SET verification_status = 'rejected', rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`, [rejectionReason, actualId]);
        const [updatedRows] = await pool.query(`SELECT 
        ip.id,
        ip.user_id,
        ip.company_name,
        ip.company_type,
        ip.industry_sector,
        ip.description,
        ip.website,
        ip.location,
        ip.contact_email,
        ip.phone,
        ip.logo,
        ip.verification_status,
        ip.rejection_reason,
        ip.created_at,
        ip.updated_at,
        u.name AS user_name,
        u.email AS user_email
      FROM industry_profiles ip
      JOIN users u ON ip.user_id = u.id
      WHERE ip.id = ?`, [actualId]);
        res.status(200).json({
            success: true,
            message: "Industry rejected successfully.",
            data: formatAdminIndustryItem(updatedRows[0]),
        });
    }
    catch (error) {
        console.error("rejectIndustry error:", error);
        res.status(500).json({
            success: false,
            message: `Failed to reject industry: ${error.message}`,
        });
    }
};
