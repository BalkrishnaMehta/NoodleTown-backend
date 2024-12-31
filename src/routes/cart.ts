import { Router } from "express";
import { addToCart, getCart, removeFromCart } from "../controllers/cart.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = Router();

// GET /api/cart (Get current user's cart)
router.get("/", authenticateToken, getCart);

// POST /api/cart/items (Add item to cart)
router.post("/items", authenticateToken, addToCart);

// DELETE /api/cart/items (Remove item from cart)
router.delete("/items", authenticateToken, removeFromCart);

export default router;
