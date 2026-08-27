import express from "express";
import authRoutes from "./routes/auth.routes.js";
import industryRoutes from "./routes/industry.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import matchingRoutes from "./routes/matching.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
const app = express();
app.use(express.json());
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/industry", industryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", matchingRoutes);
app.use("/api", applicationRoutes);
export default app;
