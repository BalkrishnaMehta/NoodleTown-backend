import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { initializeDatabase } from "./config/database.js";
import routes from "./routes/index.js";
import { getConfig } from "./utils/config.js";

const env = getConfig();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req: Request, res: Response, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  next();
});

app.use("/api", routes);

await initializeDatabase();

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
