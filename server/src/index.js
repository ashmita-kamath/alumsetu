import "dotenv/config";
import app from "./app.js";
import logger from "./utils/logger.js";
import { checkConnection } from "./config/db.js";

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
