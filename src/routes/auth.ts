import { Router } from "express";
import { createUser, checkUser } from "../controllers/auth.js";

const router = Router();

router.post("/register", createUser);

router.post("/login", checkUser);

export default router;
