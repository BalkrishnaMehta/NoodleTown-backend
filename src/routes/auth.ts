import { Router } from "express";
import {
  createUser,
  checkUser,
  logout,
  refreshToken,
} from "../controllers/auth.js";

const router = Router();

// POST /api/auth/register (Register a new user)
router.post("/register", createUser);

// POST /api/auth/login (Login a user)
router.post("/login", checkUser);

// POST /api/auth/logout (Logout a user)
router.post("/logout", logout);

// POST /api/auth/refresh-token (Refresh token)
router.post("/refresh-token", refreshToken);

export default router;
