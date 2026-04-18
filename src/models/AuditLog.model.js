const mongoose = require("mongoose");

const changeEntrySchema = new mongoose.Schema(
  {
    fieldName: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const auditLogSchema = new mongoose.Schema(
  {
    logId: { type: String, required: true, unique: true, trim: true },

    // ── User & Context ────────────────────────────────────────────────────────
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String, required: true },
    userRole: { type: String, required: true }, // "owner" | "employee" | "resident"
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", default: null },

    // ── Action ────────────────────────────────────────────────────────────────
    action: {
      type: String,
      enum: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE", "REJECT", "EXPORT", "LOGIN", "LOGOUT"],
      required: true,
    },
    entityType: { type: String, required: true }, // collection name, e.g. "Payment"
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },

    // ── Data Changes ──────────────────────────────────────────────────────────
    oldData: { type: mongoose.Schema.Types.Mixed, default: null },
    newData: { type: mongoose.Schema.Types.Mixed, default: null },
    changes: [changeEntrySchema],

    // ── Request Details ───────────────────────────────────────────────────────
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    requestMethod: { type: String, default: null },
    endpoint: { type: String, default: null },
    responseStatus: { type: Number, default: null },
    responseTime: { type: Number, default: null }, // milliseconds

    // ── Status ────────────────────────────────────────────────────────────────
    status: { type: String, enum: ["Success", "Failed"], default: "Success" },
    errorMessage: { type: String, default: null },

    // ── TTL (auto-delete after 2 years — GDPR compliance) ─────────────────────
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    // Disable updatedAt — audit logs are immutable
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ hostelId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model("AuditLog", auditLogSchema);
