import { Router } from "express";
import {
  addProduct,
  addProducts,
  getProductDetails,
  getSeasonalProducts,
} from "../controllers/product.js";

const router = Router();

// GET /api/products/seasonal (Get products by seasonal tag)
router.get("/seasonal", getSeasonalProducts);

// GET /api/products/{id} (Get specific product)
router.get("/:id", getProductDetails);

// POST /api/products (Create a new product)
router.post("/", addProduct);

// POST /api/products/bulk (Bulk create products)
router.post("/bulk", addProducts);

export default router;
