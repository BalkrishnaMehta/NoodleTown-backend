import { Router } from "express";
import { addAddress, getAddresses } from "../controllers/address.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = Router();

// GET /api/addresses (List all user addresses)
router.get("/", authenticateToken, getAddresses);

// POST /api/addresses (Add a new address)
router.post("/", authenticateToken, addAddress);

export default router;
