const { sendError } = require("../utils/responseHelper");

/**
 * Global Express error handler middleware.
 * Must be registered LAST (after all routes).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log full error in non-production
  if (process.env.NODE_ENV !== "production") {
    console.error("❌ Error:", err);
  }

  // ── Mongoose Validation Error ──────────────────────────────────────────────
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, "Validation failed", 400, "VALIDATION_ERROR", details);
  }

  // ── Mongoose CastError (invalid ObjectId) ──────────────────────────────────
  if (err.name === "CastError") {
    return sendError(res, `Invalid value for field: ${err.path}`, 400, "CAST_ERROR");
  }

  // ── Mongoose Duplicate Key ─────────────────────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return sendError(res, `${field} already exists`, 409, "DUPLICATE_KEY");
  }

  // ── JWT Token Errors ───────────────────────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token", 401, "INVALID_TOKEN");
  }

  if (err.name === "TokenExpiredError") {
    return sendError(res, "Token has expired", 401, "TOKEN_EXPIRED");
  }

  // ── Joi / Custom Validation ────────────────────────────────────────────────
  if (err.name === "ValidationError" && err.isJoi) {
    const details = err.details.map((d) => ({ field: d.path.join("."), message: d.message }));
    return sendError(res, "Request validation failed", 400, "VALIDATION_ERROR", details);
  }

  // ── Multer file size / type errors ────────────────────────────────────────
  if (err.code === "LIMIT_FILE_SIZE") {
    return sendError(res, "File size exceeds the allowed limit", 413, "FILE_TOO_LARGE");
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return sendError(res, "Unexpected file field", 400, "UNEXPECTED_FILE");
  }

  // ── Custom App Errors (thrown with err.statusCode) ────────────────────────
  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode, err.code || "APP_ERROR");
  }

  // ── Fallback: 500 Internal Server Error ───────────────────────────────────
  return sendError(
    res,
    process.env.NODE_ENV === "production" ? "Something went wrong" : err.message,
    500,
    "INTERNAL_SERVER_ERROR"
  );
};

/**
 * Async wrapper — eliminates try/catch boilerplate in every controller.
 * Usage: router.get('/path', asyncHandler(controllerFn))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Creates a custom app error with statusCode attached.
 */
const createError = (message, statusCode = 500, code = "APP_ERROR") => {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
};

module.exports = { errorHandler, asyncHandler, createError };
