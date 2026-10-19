import logger from "../utils/logger.js";

export default function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  logger.error({ message: err.message, path: req.path, status });
  res.status(status).json({ error: status === 500 ? "Something went wrong" : err.message });
}
