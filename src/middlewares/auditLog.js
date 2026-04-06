const AuditLog = require("../models/AuditLog.model");
const { generateAuditLogId } = require("../utils/idGenerator");

/**
 * Audit logging middleware — logs mutating requests to AuditLog collection.
 * Should be mounted AFTER authentication middleware.
 *
 * Usage: router.post('/path', authenticate, auditLog('CREATE', 'Payment'), controller)
 *
 * @param {string} action - One of: CREATE, UPDATE, DELETE, APPROVE, REJECT, EXPORT
 * @param {string} entityType - Collection name (e.g. "Payment", "Resident")
 */
const auditLog = (action, entityType) => async (req, res, next) => {
  // Capture start time
  const startTime = Date.now();

  // Intercept res.json to capture response status + auto-log
  const originalJson = res.json.bind(res);

  res.json = async (body) => {
    // Restore original
    res.json = originalJson;

    // Only log if user is authenticated
    if (req.user) {
      try {
        await AuditLog.create({
          logId: generateAuditLogId(),
          userId: req.user._id,
          userEmail: req.user.email,
          userRole: req.user.userType,
          hostelId: req.params.hostelId || req.user.hostelId || null,
          action,
          entityType,
          entityId: req.params.id || req.params.hostelId || null,
          ipAddress: req.ip || req.headers["x-forwarded-for"],
          userAgent: req.headers["user-agent"],
          requestMethod: req.method,
          endpoint: req.originalUrl,
          responseStatus: res.statusCode,
          responseTime: Date.now() - startTime,
          status: res.statusCode < 400 ? "Success" : "Failed",
          errorMessage: body?.error?.message || null,
        });
      } catch (err) {
        // Audit log failure must NEVER crash the main response
        console.error("⚠️  AuditLog write failed:", err.message);
      }
    }

    return originalJson(body);
  };

  next();
};

module.exports = auditLog;
