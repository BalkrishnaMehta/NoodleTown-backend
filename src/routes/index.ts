import { Router } from "express";
import authRoutes from "./auth.js";
import userRoutes from "./users.js";
import restaurantRoutes from "./restaurants.js";
import productRoutes from "./products.js";
import categoryRoutes from "./categories.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/restaurants", restaurantRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);

export default router;
