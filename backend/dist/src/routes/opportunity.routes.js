import { Router } from "express";
import { getPublicPublishedOpportunities } from "../controllers/opportunity.controller.js";
const router = Router();
// Public / Student endpoint to view published opportunities
router.get("/opportunities", getPublicPublishedOpportunities);
router.get("/student/opportunities", getPublicPublishedOpportunities);
export default router;
