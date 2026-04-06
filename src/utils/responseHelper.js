/**
 * Standard success response
 * @param {import('express').Response} res
 * @param {*} data - Response payload
 * @param {number} statusCode - HTTP status (default 200)
 */
const sendSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

/**
 * Standard error response
 * @param {import('express').Response} res
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status (default 500)
 * @param {string} code - Machine-readable error code
 * @param {Array} details - Validation error details
 */
const sendError = (res, message = "Internal Server Error", statusCode = 500, code = "SERVER_ERROR", details = []) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details.length > 0 && { details }),
    },
  });
};

module.exports = { sendSuccess, sendError };
