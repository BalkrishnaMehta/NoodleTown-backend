import { Router } from "express";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";
import restaurantRoutes from "./restaurants.js";
import productRoutes from "./products.js";
import categoryRoutes from "./categories.js";
import cartRoutes from "./cart.js";
import addressRoutes from "./addresses.js";
import orderRoutes from "./orders.js";
import couponRoutes from "./coupons.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/cart", cartRoutes);
router.use("/addresses", addressRoutes);
router.use("/orders", orderRoutes);
router.use("/coupons", couponRoutes);

export default router;
