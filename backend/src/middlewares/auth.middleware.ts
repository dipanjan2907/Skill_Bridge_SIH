import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthUser } from "../types/express.js";

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token missing or malformed" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    ) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

export const requireStudent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }

  const role = req.user.role ? req.user.role.toString().toLowerCase() : "";

  if (role !== "student" && role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Access denied. Student role required.",
    });
    return;
  }

  next();
};

export const requireInstitution = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }

  const role = req.user.role ? req.user.role.toString().toLowerCase() : "";

  const allowedRoles = ["institution", "academician", "faculty", "institute", "admin"];
  if (!allowedRoles.includes(role)) {
    res.status(403).json({
      success: false,
      message: "Access denied. Institution role required.",
    });
    return;
  }

  next();
};