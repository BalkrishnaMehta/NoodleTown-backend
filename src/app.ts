import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { initializeDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next) => {
  res.setHeader("Access-Control-Allow-origin", "http://localhost:5173");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  next();
});

app.use("/auth", authRoutes);

await initializeDatabase();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
