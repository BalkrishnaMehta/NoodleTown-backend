import { Router } from "express";
import { addCoupon, validateCoupon } from "../controllers/coupons.js";

const router = Router();

// POST /api/coupons/ (Add a new coupon)
router.post("/", addCoupon);

// POST /api/coupons/validate (Validate a coupon)
router.post("/validate", validateCoupon);

export default router;
