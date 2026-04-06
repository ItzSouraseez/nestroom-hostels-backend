const Employee = require("../models/Employee.model");
const { sendError } = require("../utils/responseHelper");

/**
 * Restricts route to owners only.
 */
const requireOwner = (req, res, next) => {
  if (req.user?.userType !== "owner") {
    return sendError(res, "Access denied: Owner only", 403, "FORBIDDEN");
  }
  next();
};

/**
 * Restricts route to residents only.
 */
const requireResident = (req, res, next) => {
  if (req.user?.userType !== "resident") {
    return sendError(res, "Access denied: Resident only", 403, "FORBIDDEN");
  }
  next();
};

/**
 * Restricts route to employees with a specific permission flag.
 * @param {string} permission - Key from Employee.permissions (e.g. "canManageRooms")
 */
const requirePermission = (permission) => async (req, res, next) => {
  try {
    if (req.user?.userType === "owner") return next(); // Owners bypass RBAC

    if (req.user?.userType !== "employee") {
      return sendError(res, "Access denied: Employees only", 403, "FORBIDDEN");
    }

    const employee = await Employee.findOne({ userId: req.user._id, isActive: true }).lean();

    if (!employee) {
      return sendError(res, "Employee record not found", 403, "FORBIDDEN");
    }

    if (!employee.permissions?.[permission]) {
      return sendError(res, `Access denied: Missing permission '${permission}'`, 403, "INSUFFICIENT_PERMISSIONS");
    }

    req.employee = employee; // attach for downstream use
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Allows owner OR employee with specified permission(s).
 * If multiple permissions given, employee must have ALL of them.
 * @param {...string} permissions
 */
const requireOwnerOrEmployee = (...permissions) => async (req, res, next) => {
  try {
    if (req.user?.userType === "owner") return next();

    if (req.user?.userType !== "employee") {
      return sendError(res, "Access denied", 403, "FORBIDDEN");
    }

    const employee = await Employee.findOne({ userId: req.user._id, isActive: true }).lean();

    if (!employee) {
      return sendError(res, "Employee record not found", 403, "FORBIDDEN");
    }

    const missing = permissions.filter((p) => !employee.permissions?.[p]);
    if (missing.length > 0) {
      return sendError(
        res,
        `Access denied: Missing permissions — ${missing.join(", ")}`,
        403,
        "INSUFFICIENT_PERMISSIONS"
      );
    }

    req.employee = employee;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validates that a request is for a hostel the owner actually owns.
 * Must be used AFTER authenticate + requireOwner.
 * Expects :hostelId param.
 */
const validateHostelOwnership = async (req, res, next) => {
  try {
    const Hostel = require("../models/Hostel.model");
    const hostel = await Hostel.findOne({
      _id: req.params.hostelId,
      ownerId: req.user._id,
      isActive: true,
    }).lean();

    if (!hostel) {
      return sendError(res, "Hostel not found or access denied", 404, "HOSTEL_NOT_FOUND");
    }

    req.hostel = hostel;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Ensures employee belongs to the hostel in :hostelId param.
 */
const validateEmployeeHostel = async (req, res, next) => {
  try {
    if (req.user?.userType === "owner") return next(); // owners skip

    const employee = req.employee || await Employee.findOne({ userId: req.user._id }).lean();
    const Hostel = require("../models/Hostel.model");
    const hostel = await Hostel.findById(req.params.hostelId).lean();

    if (!hostel) return sendError(res, "Hostel not found", 404, "HOSTEL_NOT_FOUND");
    if (String(employee?.hostelId) !== String(hostel._id)) {
      return sendError(res, "Access denied: Not your hostel", 403, "FORBIDDEN");
    }

    req.hostel = hostel;
    req.employee = employee;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireOwner,
  requireResident,
  requirePermission,
  requireOwnerOrEmployee,
  validateHostelOwnership,
  validateEmployeeHostel,
};
