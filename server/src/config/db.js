import pg from "pg";
import logger from "../utils/logger.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  logger.warn("DATABASE_URL is not set. Database queries will fail until it is added to server/.env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => logger.error({ message: "Unexpected database error", error: err.message }));

export const query = (text, params) => pool.query(text, params);

export async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function checkConnection() {
  const { rows } = await pool.query("SELECT now() AS time, current_database() AS database");
  return rows[0];
}

export default pool;
