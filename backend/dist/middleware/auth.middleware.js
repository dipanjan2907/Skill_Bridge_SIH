import jwt from "jsonwebtoken";
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({
            success: false,
            message: "Access token missing or invalid",
        });
        return;
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).json({
            success: false,
            message: "Server misconfiguration: missing JWT secret",
        });
        return;
    }
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            res.status(403).json({
                success: false,
                message: "Invalid or expired token",
            });
            return;
        }
        req.user = user;
        next();
    });
};
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: Access restricted to ${roles.join(", ")}`,
            });
            return;
        }
        next();
    };
};
