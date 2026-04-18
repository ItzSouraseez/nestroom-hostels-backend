const AttendanceRecord = require("../models/AttendanceRecord.model");
const Resident = require("../models/Resident.model");
const LeaveApplication = require("../models/LeaveApplication.model");
const Hostel = require("../models/Hostel.model");
const { generateAttendanceId } = require("../utils/idGenerator");

/**
 * Triggers attendance for a specific hostel.
 * Used by both manual requests and automated cron jobs.
 * @param {string} hostelId 
 * @param {boolean} isSurprise 
 */
const triggerAttendanceForHostel = async (hostelId, isSurprise = false) => {
  const hostel = await Hostel.findById(hostelId).lean();
  if (!hostel) return { success: false, message: "Hostel not found" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // For regular checks, don't allow double requests unless it's a surprise
  if (!isSurprise) {
    const existing = await AttendanceRecord.findOne({
      hostelId,
      attendanceDate: { $gte: today },
      remarks: { $ne: "Surprise Attendance Check" }
    });
    if (existing) return { success: false, message: "Attendance already requested for today" };
  }

  // Get all active residents
  const residents = await Resident.find({ hostelId, residentStatus: "Active" }).lean();
  if (!residents.length) return { success: false, message: "No active residents found" };

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
    remarks: isSurprise ? "Surprise Attendance Check" : null,
  }));

  await AttendanceRecord.insertMany(records);

  return {
    success: true,
    message: isSurprise ? "Surprise attendance requested" : `Regular attendance requested for ${residents.length} residents`,
    totalRequested: records.length,
    onLeaveCount: onLeave.length,
  };
};

module.exports = { triggerAttendanceForHostel };
