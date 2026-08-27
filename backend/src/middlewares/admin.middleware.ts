import type { Request, Response, NextFunction } from "express";

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required." });
    return;
  }

  const role = req.user.role ? req.user.role.toString().toLowerCase() : "";

  if (role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Access denied. Admin authorization required.",
    });
    return;
  }

  next();
};
