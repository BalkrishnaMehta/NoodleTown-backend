import { Router } from "express";
import { getOrderData, getOrders, makeOrder } from "../controllers/order.js";
import { authenticateToken } from "../middlewares/authenticateToken.js";

const router = Router();

// POST /api/orders (Create a new order)
router.post("/", authenticateToken, makeOrder);

// GET /api/orders (List all orders for the current user)
router.get("/", authenticateToken, getOrders);

// GET /api/orders/{id} (Get order details)
router.get("/:id", authenticateToken, getOrderData);

export default router;
