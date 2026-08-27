import { Router } from "express";
import { signIn, signUp, getMe } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
const router = Router();
router.post("/signin", signIn);
router.post("/signup", signUp);
router.get("/me", authenticateToken, getMe);
export default router;
