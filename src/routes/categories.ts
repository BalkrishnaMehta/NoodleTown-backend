import { Router } from "express";
import { getPopularCategories } from "../controllers/product.js";
const router = Router();

// GET /api/categories/popular (Popular categories)
router.get("/popular", getPopularCategories);

export default router;
