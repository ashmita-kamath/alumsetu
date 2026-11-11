import "dotenv/config";
import pool, { checkConnection } from "../config/db.js";

try {
  const info = await checkConnection();
  const { rows } = await pool.query(
    "SELECT count(*)::int AS tables FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log(`Connected to "${info.database}" at ${info.time.toISOString()}`);
  console.log(`Tables found: ${rows[0].tables} (expected 15)`);
} catch (err) {
  console.error("Connection failed:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
