const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    attendanceId: { type: String, required: true, trim: true },

    // ── References ────────────────────────────────────────────────────────────
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: "Building", default: null },

    // ── Date & Time ───────────────────────────────────────────────────────────
    attendanceDate: { type: Date, required: true },
    attendanceTime: { type: String, default: null }, // "HH:MM"

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["Present", "Absent", "NotResponded", "OnLeave", "Excused"],
      default: "NotResponded",
    },

    // ── Location Data (resident's GPS when marking) ───────────────────────────
    locationData: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null }, // metres
      timestamp: { type: Date, default: null },
      source: { type: String, enum: ["GPS", "NetworkBased"], default: "GPS" },
      isWithinGeofence: { type: Boolean, default: null },
    },

    // ── Geofence Verification ─────────────────────────────────────────────────
    geofenceCheck: {
      hostelLocation: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: null },
      },
      geofenceRadius: { type: Number, default: null },
      distanceFromHostel: { type: Number, default: null }, // metres
      withinGeofence: { type: Boolean, default: null },
      calculatedDistance: { type: Number, default: null },
      distanceCalculationMethod: { type: String, default: "Haversine" },
      verificationTimestamp: { type: Date, default: null },
    },

    // ── Notification & Response ───────────────────────────────────────────────
    notificationSentAt: { type: Date, default: null },
    notificationSentVia: [{ type: String }], // ["PushNotification", "InApp"]
    responseReceivedAt: { type: Date, default: null },
    responseType: { type: String, enum: ["Manual", "Auto"], default: "Manual" },

    // ── Additional ────────────────────────────────────────────────────────────
    remarks: { type: String, default: null },
    isLateResponse: { type: Boolean, default: false },
    responseTimeSeconds: { type: Number, default: null },

    // ── Leave Sync ────────────────────────────────────────────────────────────
    isOnApprovedLeave: { type: Boolean, default: false },
    approvedLeaveId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaveApplication", default: null },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ attendanceId: 1 });
attendanceRecordSchema.index({ hostelId: 1 });
attendanceRecordSchema.index({ residentId: 1, attendanceDate: -1 });
attendanceRecordSchema.index({ hostelId: 1, attendanceDate: -1 });
attendanceRecordSchema.index({ attendanceDate: 1 });
attendanceRecordSchema.index({ status: 1 });
attendanceRecordSchema.index({ createdAt: -1 });
attendanceRecordSchema.index({ hostelId: 1, attendanceDate: -1, status: 1 }); // combined

module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema);
