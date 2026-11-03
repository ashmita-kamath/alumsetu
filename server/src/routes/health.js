import { Router } from "express";
import { checkConnection } from "../config/db.js";

const router = Router();

router.get("/", async (req, res) => {
  let database = "connected";
  try {
    await checkConnection();
  } catch {
    database = "unreachable";
  }
  res.status(database === "connected" ? 200 : 503).json({
    status: database === "connected" ? "ok" : "degraded",
    service: "alumsetu-api",
    database,
    time: new Date().toISOString(),
  });
});

export default router;
