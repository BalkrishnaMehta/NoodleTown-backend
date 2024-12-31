import { Router } from "express";
import {
  addAuthenticProduct,
  getProductsByFeaturedCategories,
} from "../controllers/featuredCategories.js";

const router = Router();

// GET /api/featured-categories/{category} (Get featured categories products)
router.get("/:category", getProductsByFeaturedCategories);

// POST /api/featured-categories/authentic (Add a new authentic product)
router.post("/authentic", addAuthenticProduct);

export default router;
