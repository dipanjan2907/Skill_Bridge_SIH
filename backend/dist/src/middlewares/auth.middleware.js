import jwt from "jsonwebtoken";
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ error: "Access token missing or malformed" });
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(403).json({ error: "Invalid or expired token" });
    }
};
export const requireStudent = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const role = req.user.role ? req.user.role.toString().toLowerCase() : "";
    if (role !== "student") {
        res.status(403).json({
            success: false,
            message: "Access denied. Student role required.",
        });
        return;
    }
    next();
};
