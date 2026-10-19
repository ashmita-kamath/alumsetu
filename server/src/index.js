import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import logger from "./utils/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import healthRoutes from "./routes/health.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/health", healthRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);

app.listen(PORT, () => logger.info(`AlumSetu API running on port ${PORT}`));
