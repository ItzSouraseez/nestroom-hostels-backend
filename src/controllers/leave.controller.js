const LeaveApplication = require("../models/LeaveApplication.model");
const Resident = require("../models/Resident.model");

const { asyncHandler, createError } = require("../middlewares/errorHandler");
const { sendSuccess } = require("../utils/responseHelper");
const { generateLeaveId } = require("../utils/idGenerator");

// ─── 9.1 Apply for Leave (Resident) ──────────────────────────────────────────
const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType, fromDate, toDate, reason, attachmentUrl } = req.body;

  const resident = await Resident.findOne({ userId: req.user._id }).lean();
  if (!resident) throw createError("Resident not found", 404, "RESIDENT_NOT_FOUND");

  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (from > to) throw createError("fromDate must be before toDate", 400, "INVALID_DATE_RANGE");

  const duration = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

  // Check overlapping approved leaves
  const overlap = await LeaveApplication.findOne({
    residentId: resident._id,
    status: { $in: ["Pending", "Approved"] },
    $or: [
      { fromDate: { $lte: to }, toDate: { $gte: from } },
    ],
  });
  if (overlap) throw createError("You have an overlapping leave application", 409, "LEAVE_OVERLAP");

  const leaveId = generateLeaveId();
  const attachments = attachmentUrl ? [{ fileUrl: attachmentUrl }] : [];

  const leave = await LeaveApplication.create({
    leaveId,
    residentId: resident._id,
    hostelId: resident.hostelId,
    leaveType,
    fromDate: from,
    toDate: to,
    duration,
    reason,
    attachments,
    status: "Pending",
    statusHistory: [{ status: "Pending", changedBy: req.user._id }],
  });

  return sendSuccess(res, {
    leaveId: leave.leaveId,
    duration,
    status: "Pending",
    message: "Leave application submitted",
  }, 201);
});

// ─── 9.2 Get My Leaves (Resident) ─────────────────────────────────────────────
const getMyLeaves = asyncHandler(async (req, res) => {
  const resident = await Resident.findOne({ userId: req.user._id }).lean();
  if (!resident) throw createError("Resident not found", 404);

  const leaves = await LeaveApplication.find({ residentId: resident._id })
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, { leaves });
});

// ─── 9.3 Get All Leaves (Owner/Employee) ──────────────────────────────────────
const getAllLeaves = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { hostelId: req.params.hostelId };
  if (status) filter.status = status;

  const [leaves, total] = await Promise.all([
    LeaveApplication.find(filter)
      .populate("residentId", "residentId fullName roomId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    LeaveApplication.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    leaves,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
  });
});

// ─── 9.4 Approve Leave ────────────────────────────────────────────────────────
const approveLeave = asyncHandler(async (req, res) => {
  const { remarks } = req.body;

  const leave = await LeaveApplication.findOne({
    _id: req.params.leaveId,
    hostelId: req.params.hostelId,
    status: "Pending",
  });
  if (!leave) throw createError("Leave application not found or already actioned", 404, "LEAVE_NOT_FOUND");

  leave.status = "Approved";
  leave.approvalDetails = {
    approvedBy: req.user._id,
    approverName: req.user.fullName,
    approvalDate: new Date(),
    approvalRemarks: remarks || null,
    statusChangeTime: new Date(),
  };
  leave.statusHistory.push({ status: "Approved", changedBy: req.user._id });

  // Sync resident status
  await Resident.findByIdAndUpdate(leave.residentId, { residentStatus: "OnLeave" });

  await leave.save();

  return sendSuccess(res, { message: "Leave approved successfully" });
});

// ─── 9.5 Reject Leave ─────────────────────────────────────────────────────────
const rejectLeave = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;

  const leave = await LeaveApplication.findOne({
    _id: req.params.leaveId,
    hostelId: req.params.hostelId,
    status: "Pending",
  });
  if (!leave) throw createError("Leave application not found or already actioned", 404, "LEAVE_NOT_FOUND");

  leave.status = "Rejected";
  leave.rejectionDetails = {
    rejectedBy: req.user._id,
    rejectionDate: new Date(),
    rejectionReason,
  };
  leave.statusHistory.push({ status: "Rejected", changedBy: req.user._id });
  await leave.save();

  return sendSuccess(res, { message: "Leave rejected" });
});

module.exports = { applyLeave, getMyLeaves, getAllLeaves, approveLeave, rejectLeave };
