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
import { initTables } from "./config/initTables.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
// Initialize DB schema on server start
initTables();
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", profileRoutes);
app.use("/api/industry", industryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", skillsRoutes);
app.use("/api", assessmentRoutes);
app.use("/api", matchingRoutes);
app.use("/api", opportunityRoutes);
app.use("/api", applicationRoutes);
// Health check
app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date() });
});
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
