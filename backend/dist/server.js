import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import profileRoutes from "./routes/profile.routes.js";
import authRoutes from "./routes/auth.routes.js";
import skillsRoutes from "./routes/skills.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import industryRoutes from "./routes/industry.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import opportunityRoutes from "./routes/opportunity.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import matchingRoutes from "./routes/matching.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import institutionRoutes from "./routes/institution.routes.js";
import collaborationRoutes from "./routes/collaboration.routes.js";
import { initTables } from "./config/initTables.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://skillbridgeportal.vercel.app",
];
const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests (e.g. mobile apps, Postman, curl)
        if (!origin)
            return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, "");
        // Allow localhost, vercel.app preview domains, or allowed origins
        if (normalizedOrigin.includes("localhost") ||
            normalizedOrigin.includes("127.0.0.1") ||
            normalizedOrigin.endsWith(".vercel.app") ||
            normalizedOrigin.includes("vercel.app") ||
            allowedOrigins.some((o) => o.replace(/\/$/, "") === normalizedOrigin) ||
            (process.env.FRONTEND_URL && normalizedOrigin === process.env.FRONTEND_URL.replace(/\/$/, ""))) {
            return callback(null, true);
        }
        // Fallback: allow origin to avoid breaking preflights
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
// Initialize DB schema on server start
initTables();
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", profileRoutes);
app.use("/api/industry", industryRoutes);
app.use("/api/institution", institutionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", skillsRoutes);
app.use("/api", assessmentRoutes);
app.use("/api", matchingRoutes);
app.use("/api", opportunityRoutes);
app.use("/api", applicationRoutes);
app.use("/api", collaborationRoutes);
// Health check
app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date() });
});
// Fallback 404 handler for unmatched routes
app.use((_req, res) => {
    res.status(404).json({ error: "Endpoint not found on SkillBridge API server" });
});
app.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
    await initTables();
});
