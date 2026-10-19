import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", service: "alumsetu-api", time: new Date().toISOString() });
});

export default router;
