import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import logger from "../utils/logger.js";

export default function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid request data", details },
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Request body is not valid JSON", details: [] },
    });
  }

  if (typeof err.status === "number" && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({
      error: { code: "BAD_REQUEST", message: err.message, details: [] },
    });
  }

  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.originalUrl,
  });
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side", details: [] },
  });
}
