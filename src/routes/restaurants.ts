import { Router } from "express";
import {
  getRestaurants,
  addRestaurant,
  getCategorizedProducts,
  getRestaurantDetails,
  getRestaurantsByServiceType,
  getRestaurantsByCuisine,
  addRecommendationForRestaurant,
} from "../controllers/restaurants.js";

const router = Router();

// GET /api/restaurants (List all restaurants)
router.get("/", getRestaurants);

// POST /api/restaurants (Create a new restaurant)
router.post("/", addRestaurant);

// GET /api/restaurants (List all restaurants for particular service type)
router.get("/service-type/:type", getRestaurantsByServiceType);

// GET /api/restaurants (List all restaurants for particular tag in retaurant)
router.get("/cuisine/:cuisine", getRestaurantsByCuisine);

// GET /api/restaurants/{id} (Get specific restaurant)
router.get("/:id", getRestaurantDetails);

// POST /api/restaurants/{id}/recommend (Add Recommended Product for a restaurant)
router.post("/:id/recommend", addRecommendationForRestaurant);

// GET /api/restaurants/{id}/menu (Get restaurant's menu/products)
router.get("/:id/menu", getCategorizedProducts);

export default router;
