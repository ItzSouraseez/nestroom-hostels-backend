const mongoose = require("mongoose");
const AttendanceRecord = require("../models/AttendanceRecord.model");
const Resident = require("../models/Resident.model");
const Hostel = require("../models/Hostel.model");
const LeaveApplication = require("../models/LeaveApplication.model");

const { asyncHandler, createError } = require("../middlewares/errorHandler");
const { sendSuccess } = require("../utils/responseHelper");
const { generateAttendanceId } = require("../utils/idGenerator");
const { checkGeofence } = require("../services/geofence");

// Hostel-level attendance config stored on the Hostel document (simulated here via a simple in-memory map for MVP)
// In production, add an AttendanceConfig sub-document or separate collection.
const attendanceConfigs = new Map(); // hostelId → config

// ─── 8.1 Configure Attendance (Owner/Employee) ────────────────────────────────
const setAttendanceConfig = asyncHandler(async (req, res) => {
  const { location, geofenceRadius, attendanceTime, attendanceFrequency, surpriseCheckEnabled } = req.body;

  attendanceConfigs.set(String(req.params.hostelId), {
    location,
    geofenceRadius,
    attendanceTime,
    attendanceFrequency,
    surpriseCheckEnabled,
    updatedAt: new Date(),
    updatedBy: req.user._id,
  });

  // Also persist geofence radius on Hostel document
  await Hostel.findByIdAndUpdate(req.params.hostelId, {
    $set: {
      "location.coordinates": [location.longitude, location.latitude],
      geofenceRadius,
    },
  });

  return sendSuccess(res, { message: "Attendance configuration saved" });
});

// ─── 8.2 Request Attendance from All Residents ────────────────────────────────
const requestAttendance = asyncHandler(async (req, res) => {
  const hostelId = req.params.hostelId;
  const config = attendanceConfigs.get(String(hostelId));
  if (!config) throw createError("Attendance not configured for this hostel", 400, "ATTENDANCE_NOT_CONFIGURED");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check not already requested today
  const existing = await AttendanceRecord.findOne({
    hostelId,
    attendanceDate: { $gte: today },
  });
  if (existing) throw createError("Attendance already requested for today", 409, "ALREADY_REQUESTED");

  // Get all active residents
  const residents = await Resident.find({ hostelId, residentStatus: "Active" }).lean();
  if (!residents.length) throw createError("No active residents found", 400, "NO_RESIDENTS");

  // Check approved leaves for today
  const onLeave = await LeaveApplication.find({
    hostelId,
    status: "Approved",
    fromDate: { $lte: new Date() },
    toDate: { $gte: new Date() },
  }).select("residentId").lean();

  const onLeaveIds = new Set(onLeave.map((l) => String(l.residentId)));

  const records = residents.map((resident) => ({
    attendanceId: generateAttendanceId(),
    residentId: resident._id,
    hostelId,
    buildingId: resident.buildingId,
    attendanceDate: new Date(),
    status: onLeaveIds.has(String(resident._id)) ? "OnLeave" : "NotResponded",
    notificationSentAt: new Date(),
    notificationSentVia: ["InApp"],
    isOnApprovedLeave: onLeaveIds.has(String(resident._id)),
  }));

  await AttendanceRecord.insertMany(records);

  return sendSuccess(res, {
    message: `Attendance requested for ${residents.length} residents`,
    totalRequested: records.length,
    onLeave: onLeave.length,
  });
});

// ─── 8.3 Submit Attendance (Resident) ─────────────────────────────────────────
const submitAttendance = asyncHandler(async (req, res) => {
  const { status, latitude, longitude, accuracy } = req.body;

  const resident = await Resident.findOne({ userId: req.user._id }).lean();
  if (!resident) throw createError("Resident not found", 404, "RESIDENT_NOT_FOUND");

  // Find today's attendance record for this resident
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const record = await AttendanceRecord.findOne({
    residentId: resident._id,
    attendanceDate: { $gte: today },
    status: "NotResponded",
  });

  if (!record) throw createError("No pending attendance request found", 404, "NO_ATTENDANCE_REQUEST");

  // Geofence check
  const hostel = await Hostel.findById(resident.hostelId).lean();
  const hostelCoords = hostel?.location?.coordinates || [0, 0];
  const geoResult = checkGeofence(
    { latitude, longitude },
    { latitude: hostelCoords[1], longitude: hostelCoords[0] },
    hostel?.geofenceRadius || 500
  );

  // Residents can only mark Present if within geofence
  const finalStatus = status === "Present" && !geoResult.isWithin ? "Absent" : status;

  record.status = finalStatus;
  record.responseReceivedAt = new Date();
  record.responseType = "Manual";
  record.locationData = { latitude, longitude, accuracy, timestamp: new Date(), isWithinGeofence: geoResult.isWithin };
  record.geofenceCheck = {
    hostelLocation: {
      type: "Point",
      coordinates: hostelCoords,
    },
    geofenceRadius: hostel?.geofenceRadius || 500,
    distanceFromHostel: geoResult.distanceMetres,
    withinGeofence: geoResult.isWithin,
    calculatedDistance: geoResult.distanceMetres,
    verificationTimestamp: new Date(),
  };

  await record.save();

  return sendSuccess(res, {
    attendanceId: record.attendanceId,
    status: finalStatus,
    withinGeofence: geoResult.isWithin,
    distanceFromHostel: `${geoResult.distanceMetres}m`,
    message: finalStatus === "Absent" && status === "Present"
      ? "Marked as Absent: you are outside the hostel geofence"
      : `Attendance marked as ${finalStatus}`,
  });
});

// ─── 8.4 Get Attendance History (owner/employee view) ─────────────────────────
const getAttendanceHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, residentId, fromDate, toDate, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { hostelId: req.params.hostelId };
  if (residentId) filter.residentId = residentId;
  if (status) filter.status = status;
  if (fromDate || toDate) {
    filter.attendanceDate = {};
    if (fromDate) filter.attendanceDate.$gte = new Date(fromDate);
    if (toDate) filter.attendanceDate.$lte = new Date(toDate);
  }

  const [records, total] = await Promise.all([
    AttendanceRecord.find(filter)
      .populate("residentId", "residentId fullName roomId")
      .sort({ attendanceDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    AttendanceRecord.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    records,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
  });
});

// ─── 8.5 Get My Attendance (resident) ─────────────────────────────────────────
const getMyAttendance = asyncHandler(async (req, res) => {
  const resident = await Resident.findOne({ userId: req.user._id }).lean();
  if (!resident) throw createError("Resident not found", 404);

  const { page = 1, limit = 30 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [records, total] = await Promise.all([
    AttendanceRecord.find({ residentId: resident._id })
      .sort({ attendanceDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    AttendanceRecord.countDocuments({ residentId: resident._id }),
  ]);

  const present = records.filter((r) => r.status === "Present").length;
  const absent = records.filter((r) => r.status === "Absent").length;
  const onLeave = records.filter((r) => r.status === "OnLeave").length;
  const attendanceRate = records.length ? ((present / records.length) * 100).toFixed(1) : "0.0";

  return sendSuccess(res, {
    summary: { total: records.length, present, absent, onLeave, attendanceRate: `${attendanceRate}%` },
    records,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
  });
});

module.exports = {
  setAttendanceConfig, requestAttendance, submitAttendance,
  getAttendanceHistory, getMyAttendance,
};
