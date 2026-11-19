import "dotenv/config";
import app from "./app.js";
import logger from "./utils/logger.js";
import { checkConnection } from "./config/db.js";
import { checkProductionEnv } from "./config/checkEnv.js";

const problems = checkProductionEnv();
const fatal = problems.filter((p) => p.startsWith("DATABASE_URL") || p.startsWith("JWT_SECRET"));
problems.forEach((p) => logger.error(`Config problem: ${p}`));
if (fatal.length) {
  logger.error("Fix these environment variables on Render, then redeploy.");
  process.exit(1);
}

const PORT = process.env.PORT || 5050;

app.listen(PORT, async () => {
  logger.info(`AlumSetu API running on port ${PORT}`);
  try {
    const { database } = await checkConnection();
    logger.info(`Connected to PostgreSQL database "${database}"`);
  } catch (err) {
    logger.error({ message: "Could not connect to PostgreSQL", error: err.message });
  }
});
