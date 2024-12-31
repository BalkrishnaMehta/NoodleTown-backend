import { Router } from "express";
import { getSearchResults } from "../controllers/search.js";

const router = Router();

// GET /api/search/:city (Search Restaurant)
router.get("/:city", getSearchResults);

export default router;
