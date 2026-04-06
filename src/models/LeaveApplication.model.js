const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.Mixed, default: "system" }, // ObjectId | "system"
  },
  { _id: false }
);

const leaveApplicationSchema = new mongoose.Schema(
  {
    leaveId: { type: String, required: true, unique: true, trim: true },

    // ── References ────────────────────────────────────────────────────────────
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },

    // ── Leave Details ─────────────────────────────────────────────────────────
    leaveType: {
      type: String,
      enum: ["Sick", "Personal", "Medical", "Emergency", "Maternity", "Paternity", "Other"],
      required: true,
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    duration: { type: Number, required: true }, // in days
    reason: { type: String, required: true, trim: true },

    // ── Attachments ───────────────────────────────────────────────────────────
    attachments: [attachmentSchema],

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },

    // ── Approval ──────────────────────────────────────────────────────────────
    approvalDetails: {
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      approverName: { type: String, default: null },
      approvalDate: { type: Date, default: null },
      approvalRemarks: { type: String, default: null },
      statusChangeTime: { type: Date, default: null },
    },

    // ── Rejection ─────────────────────────────────────────────────────────────
    rejectionDetails: {
      rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      rejectionDate: { type: Date, default: null },
      rejectionReason: { type: String, default: null },
    },

    // ── Status History ────────────────────────────────────────────────────────
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

leaveApplicationSchema.index({ leaveId: 1 });
leaveApplicationSchema.index({ residentId: 1 });
leaveApplicationSchema.index({ hostelId: 1 });
leaveApplicationSchema.index({ residentId: 1, fromDate: -1 });
leaveApplicationSchema.index({ status: 1 });
leaveApplicationSchema.index({ hostelId: 1, status: 1 });
leaveApplicationSchema.index({ fromDate: 1, toDate: 1 });

module.exports = mongoose.model("LeaveApplication", leaveApplicationSchema);
