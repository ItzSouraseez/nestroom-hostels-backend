const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    collegeIdPhoto: { type: String, default: null },
    profilePhoto: { type: String, default: null },
    kycStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },
    kycVerifiedAt: { type: Date, default: null },
    kycVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectionReason: { type: String, default: null },
  },
  { _id: false }
);

const residentSchema = new mongoose.Schema(
  {
    residentId: { type: String, required: true, unique: true, trim: true },

    // ── User Link ─────────────────────────────────────────────────────────────
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ── Hostel Assignment ─────────────────────────────────────────────────────
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    bedId: { type: mongoose.Schema.Types.ObjectId, ref: "Bed", required: true },

    // ── Personal Info ─────────────────────────────────────────────────────────
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    whatsappNumber: { type: String, trim: true, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: null },

    // ── Emergency Contact ─────────────────────────────────────────────────────
    emergencyContactName: { type: String, default: null },
    emergencyContactPhone: { type: String, default: null },
    emergencyContactRelation: { type: String, default: null },

    // ── Educational Info ──────────────────────────────────────────────────────
    college: { type: String, default: null },
    enrollmentNumber: { type: String, default: null },
    courseYear: { type: String, default: null },
    major: { type: String, default: null },

    // ── Identity (sensitive — store encrypted) ────────────────────────────────
    idCardType: {
      type: String,
      enum: ["Aadhaar", "PAN", "DL", "Passport", "Other"],
      default: null,
    },
    idCardNumber: { type: String, default: null }, // AES-256 encrypted
    idCardPhoto: { type: String, default: null },  // Cloudinary URL

    // ── KYC ───────────────────────────────────────────────────────────────────
    kyc: { type: kycSchema, default: () => ({}) },

    // ── Residence Details ─────────────────────────────────────────────────────
    checkInDate: { type: Date, default: null },
    checkOutDate: { type: Date, default: null },
    residentStatus: {
      type: String,
      enum: ["Active", "Inactive", "OnLeave", "TerminatedWithNotice", "TerminatedImmediate"],
      default: "Active",
    },

    // ── Financial ─────────────────────────────────────────────────────────────
    feeAmount: { type: Number, required: true },
    feeFrequency: {
      type: String,
      enum: ["Monthly", "Quarterly", "Yearly"],
      default: "Monthly",
    },
    nextDueDate: { type: Date, default: null },
    securityDeposit: { type: Number, default: 0 },
    securityDepositPaid: { type: Boolean, default: false },
    securityDepositRefundedDate: { type: Date, default: null },

    // ── Food ──────────────────────────────────────────────────────────────────
    foodEnabled: { type: Boolean, default: false },
    foodStartDate: { type: Date, default: null },
    dietaryPreferences: [{ type: String }],

    // ── Notes ─────────────────────────────────────────────────────────────────
    specialRequests: { type: String, default: null },
    internalNotes: { type: String, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

residentSchema.index({ residentId: 1 });
residentSchema.index({ userId: 1 });
residentSchema.index({ hostelId: 1 });
residentSchema.index({ roomId: 1 });
residentSchema.index({ bedId: 1 });
residentSchema.index({ hostelId: 1, residentStatus: 1 });
residentSchema.index({ hostelId: 1, nextDueDate: 1 });
residentSchema.index({ email: 1 });

module.exports = mongoose.model("Resident", residentSchema);
