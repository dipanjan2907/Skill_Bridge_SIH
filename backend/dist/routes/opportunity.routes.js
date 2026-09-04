import { Router } from "express";
import { getPublicPublishedOpportunities, getAllPublicCompanies, toggleSaveOpportunity, getSavedOpportunities, getSavedOpportunityIds, } from "../controllers/opportunity.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
const router = Router();
// Public / Student endpoint to view published opportunities and partner companies
router.get("/opportunities", getPublicPublishedOpportunities);
router.get("/student/opportunities", getPublicPublishedOpportunities);
router.get("/companies", getAllPublicCompanies);
// Saved opportunities endpoints (Authenticated)
router.get("/opportunities/saved", authenticateToken, getSavedOpportunities);
router.get("/opportunities/saved/ids", authenticateToken, getSavedOpportunityIds);
router.post("/opportunities/:id/save", authenticateToken, toggleSaveOpportunity);
export default router;
