const mongoose = require("mongoose");

const pollResponseSchema = new mongoose.Schema(
  {
    respondentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    respondentName: String,
    selectedOption: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const viewedBySchema = new mongoose.Schema(
  {
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    residentName: String,
    viewedAt: { type: Date, default: Date.now },
    viewDuration: Number, // seconds
  },
  { _id: false }
);

const deliveryChannelSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["Delivered", "Failed", "Pending"], default: "Pending" },
    reason: { type: String, default: null },
    timestamp: { type: Date, default: null },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, required: true, unique: true, trim: true },

    // ── References ────────────────────────────────────────────────────────────
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ── Content ───────────────────────────────────────────────────────────────
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Announcement", "Attendance", "Payment", "Leave", "Food", "Emergency", "Survey"],
      required: true,
    },
    attachmentUrl: { type: String, default: null },

    // ── Recipients ────────────────────────────────────────────────────────────
    recipientType: {
      type: String,
      enum: ["AllResidents", "SelectedResidents", "ByRoom", "ByFloor", "ByBuilding"],
      default: "AllResidents",
    },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resident" }],

    // ── Poll ──────────────────────────────────────────────────────────────────
    poll: {
      isPoll: { type: Boolean, default: false },
      pollType: {
        type: String,
        enum: ["MultiChoice", "YesNo", "Rating", "OpenEnded"],
        default: null,
      },
      pollQuestion: { type: String, default: null },
      pollOptions: [{ type: String }],
      pollDeadline: { type: Date, default: null },
      pollResponses: [pollResponseSchema],
      totalResponses: { type: Number, default: 0 },
      responseRate: { type: Number, default: 0 },
      responseBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    // ── Views ─────────────────────────────────────────────────────────────────
    viewedBy: [viewedBySchema],
    totalViewCount: { type: Number, default: 0 },
    viewRate: { type: Number, default: 0 },

    // ── Delivery ──────────────────────────────────────────────────────────────
    deliveryStatus: {
      type: String,
      enum: ["Queued", "Sending", "Delivered", "Failed"],
      default: "Queued",
    },
    deliverChannels: {
      inApp: { type: deliveryChannelSchema, default: () => ({}) },
      pushNotification: { type: deliveryChannelSchema, default: () => ({}) },
      email: { type: deliveryChannelSchema, default: () => ({}) },
      whatsapp: { type: deliveryChannelSchema, default: () => ({}) },
    },

    // ── Immutability (audit compliance) ─────────────────────────────────────
    isEditable: { type: Boolean, default: false },
    isDeletable: { type: Boolean, default: false },

    // ── Meta ──────────────────────────────────────────────────────────────────
    sentAt: { type: Date, default: Date.now },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

notificationSchema.index({ hostelId: 1 });
notificationSchema.index({ senderId: 1 });
notificationSchema.index({ hostelId: 1, sentAt: -1 });
notificationSchema.index({ sentAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ recipients: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
