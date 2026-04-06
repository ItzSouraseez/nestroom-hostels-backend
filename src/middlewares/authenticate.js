const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { sendError } = require("../utils/responseHelper");

/**
 * Authenticates requests via JWT Bearer token.
 * Attaches `req.user` (full User doc) on success.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authorization token required", 401, "MISSING_TOKEN");
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return sendError(res, "Access token has expired", 401, "TOKEN_EXPIRED");
      }
      return sendError(res, "Invalid access token", 401, "INVALID_TOKEN");
    }

    // Fetch live user to check active/suspended status
    const user = await User.findById(decoded.id).select("-passwordHash -twoFactorSecret -refreshToken");

    if (!user) {
      return sendError(res, "User not found", 401, "USER_NOT_FOUND");
    }

    if (!user.isActive) {
      return sendError(res, "Account is deactivated", 403, "ACCOUNT_DEACTIVATED");
    }

    if (user.isSuspended) {
      return sendError(
        res,
        `Account is suspended: ${user.suspensionReason || "Contact support"}`,
        403,
        "ACCOUNT_SUSPENDED"
      );
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
