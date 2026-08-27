import type { Request, Response, NextFunction } from "express";
import pool from "../config/db.js";
import type { RowDataPacket } from "mysql2";

export const requireIndustry = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }

  const role = req.user.role ? req.user.role.toString().toLowerCase() : "";

  if (role !== "industry") {
    res.status(403).json({
      success: false,
      message: "Access denied. Industry role required.",
    });
    return;
  }

  next();
};

export const requireVerifiedIndustry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }

  const role = req.user.role ? req.user.role.toString().toLowerCase() : "";

  if (role !== "industry") {
    res.status(403).json({
      success: false,
      message: "Access denied. Industry role required.",
    });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT verification_status, rejection_reason FROM industry_profiles WHERE user_id = ?`,
      [req.user.id]
    );

    if (!rows || rows.length === 0) {
      res.status(403).json({
        success: false,
        message: "Industry profile not found. Please complete your profile first.",
      });
      return;
    }

    const { verification_status, rejection_reason } = rows[0];

    if (verification_status === "pending") {
      res.status(403).json({
        success: false,
        message: "Your company is awaiting verification.",
        verificationStatus: "pending",
      });
      return;
    }

    if (verification_status === "rejected") {
      res.status(403).json({
        success: false,
        message: rejection_reason
          ? `Your company verification was rejected. Reason: ${rejection_reason}`
          : "Your company verification was rejected.",
        verificationStatus: "rejected",
        rejectionReason: rejection_reason || null,
      });
      return;
    }

    if (verification_status === "approved") {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: "Company status does not allow this action.",
    });
  } catch (error: any) {
    console.error("requireVerifiedIndustry error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify industry status.",
    });
  }
};
