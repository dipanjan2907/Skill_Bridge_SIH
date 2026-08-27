import { Router } from "express";
import { getPublicPublishedOpportunities, getAllPublicCompanies } from "../controllers/opportunity.controller.js";
const router = Router();
// Public / Student endpoint to view published opportunities and partner companies
router.get("/opportunities", getPublicPublishedOpportunities);
router.get("/student/opportunities", getPublicPublishedOpportunities);
router.get("/companies", getAllPublicCompanies);
export default router;
