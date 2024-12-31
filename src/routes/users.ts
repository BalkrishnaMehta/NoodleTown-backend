import { Router } from "express";
import { getUser, updatePassword } from "../controllers/user.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = Router();

// GET /api/users/me (Get current user's data)
router.get("/me", authenticateToken, getUser);

// PATCH /api/users/password (Update user's password)
router.patch("/password", authenticateToken, updatePassword);

export default router;
