import { Router } from "express";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";
import restaurantRoutes from "./restaurants.js";
import productRoutes from "./products.js";
import categoryRoutes from "./categories.js";
import featuredCategoryRoutes from "./featuredCategories.js";
import cartRoutes from "./cart.js";
import addressRoutes from "./addresses.js";
import orderRoutes from "./orders.js";
import couponRoutes from "./coupons.js";
import searchRoutes from "./search.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/featured-categories", featuredCategoryRoutes);
router.use("/cart", cartRoutes);
router.use("/addresses", addressRoutes);
router.use("/orders", orderRoutes);
router.use("/coupons", couponRoutes);
router.use("/search", searchRoutes);

export default router;
