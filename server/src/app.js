import express from "express";
import cors from "cors";
import morgan from "morgan";
import errorHandler from "./middleware/errorHandler.js";
import apiRoutes from "./routes/index.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` } });
});
app.use(errorHandler);

export default app;
