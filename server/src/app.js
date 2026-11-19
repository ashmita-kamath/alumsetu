import express from "express";
import cors from "cors";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler.js";
import apiRoutes from "./routes/index.js";
import { corsOptions } from "./config/cors.js";

const app = express();

// Render sits in front of the app as a proxy; this makes req.ip the real visitor's address.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(cors(corsOptions()));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` } });
});
app.use(errorHandler);

export default app;
