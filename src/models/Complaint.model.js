const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  { fileName: String, fileUrl: String, fileType: String, uploadedAt: { type: Date, default: Date.now } },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.Mixed, default: "system" },
    remarks: { type: String, default: null },
  },
  { _id: false }
);

const communicationLogSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId },
    fromType: { type: String, enum: ["Resident", "Employee", "Owner"] },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, required: true, unique: true, trim: true },

    // ── References ────────────────────────────────────────────────────────────
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },

    // ── Details ───────────────────────────────────────────────────────────────
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Maintenance", "Cleanliness", "Staff", "Food", "Safety", "Other"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    location: { type: String, default: null }, // "Room 101 - Bathroom"

    // ── Attachments ───────────────────────────────────────────────────────────
    attachments: [attachmentSchema],

    // ── Status Management ─────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["Open", "InProgress", "OnHold", "Resolved", "Closed", "Rejected"],
      default: "Open",
    },
    statusHistory: [statusHistorySchema],

    // ── Assignment ────────────────────────────────────────────────────────────
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignmentDate: { type: Date, default: null },
    expectedResolutionDate: { type: Date, default: null },

    // ── Resolution ────────────────────────────────────────────────────────────
    resolutionDate: { type: Date, default: null },
    resolutionNotes: { type: String, default: null },
    resolutionVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Communication Log ─────────────────────────────────────────────────────
    communicationLog: [communicationLogSchema],

    // ── Resident Feedback (post-resolution) ────────────────────────────────
    residentFeedback: {
      satisfactionRating: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: null },
      feedbackDate: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

complaintSchema.index({ complaintId: 1 });
complaintSchema.index({ residentId: 1 });
complaintSchema.index({ hostelId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ hostelId: 1, status: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Complaint", complaintSchema);
