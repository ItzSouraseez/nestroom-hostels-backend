const mongoose = require("mongoose");

const hostelSchema = new mongoose.Schema(
  {
    // ── System ────────────────────────────────────────────────────────────────
    hostelId: { type: String, required: true, unique: true, trim: true },
    hostelCode: { type: String, required: true, unique: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    chainId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", default: null },

    // ── Basic Info ────────────────────────────────────────────────────────────
    hostelName: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    hostelType: {
      type: String,
      enum: ["Budget", "Standard", "Premium"],
      default: "Budget",
    },

    // ── Contact ───────────────────────────────────────────────────────────────
    contactPerson: { type: String, trim: true, default: null },
    contactPhone: { type: String, trim: true, default: null },
    contactEmail: { type: String, lowercase: true, trim: true, default: null },
    whatsappNumber: { type: String, trim: true, default: null },

    // ── Address ───────────────────────────────────────────────────────────────
    address: { type: String, default: null },
    landmark: { type: String, default: null },
    city: { type: String, trim: true, default: null },
    state: { type: String, trim: true, default: null },
    country: { type: String, default: "India" },
    pincode: { type: String, trim: true, default: null },

    // ── Geolocation (GeoJSON Point for geofencing) ────────────────────────────
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    geofenceRadius: { type: Number, default: 500 }, // metres

    // ── Registration ──────────────────────────────────────────────────────────
    registrationNumber: { type: String, default: null },
    registrationDate: { type: Date, default: null },
    registrationDocument: { type: String, default: null },

    // ── Facilities ────────────────────────────────────────────────────────────
    bedCount: { type: Number, default: 0 },
    roomCount: { type: Number, default: 0 },
    buildingCount: { type: Number, default: 0 },
    occupiedBeds: { type: Number, default: 0 },

    // ── Bank Details (account number stored encrypted via service) ────────────
    bankDetails: {
      accountHolderName: { type: String, default: null },
      accountNumber: { type: String, default: null }, // AES-256 encrypted
      ifscCode: { type: String, default: null },
      bankName: { type: String, default: null },
      accountType: { type: String, default: null },
      branchCode: { type: String, default: null },
    },

    // ── Images ────────────────────────────────────────────────────────────────
    profilePhoto: { type: String, default: null },
    coverPhoto: { type: String, default: null },
    images: [{ type: String }],

    // ── Policies ─────────────────────────────────────────────────────────────
    checkInTime: { type: String, default: "14:00" },
    checkOutTime: { type: String, default: "11:00" },
    visitorPolicy: { type: String, default: null },
    smokePolicy: { type: String, default: null },

    // ── Stats (denormalised for quick dashboard reads) ──────────────────────
    totalRevenue: { type: Number, default: 0 },
    totalResidents: { type: Number, default: 0 },
    averageOccupancy: { type: Number, default: 0 },

    // ── Attendance Config ─────────────────────────────────────────────────────
    attendanceConfig: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: "21:00" }, // 9:00 PM
      windowMinutes: { type: Number, default: 120 }, // 2 hours
      daysOfWeek: [{ type: String, enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }],
      timezone: { type: String, default: "Asia/Kolkata" },
    },

    // ── Status ────────────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
hostelSchema.index({ ownerId: 1 });
hostelSchema.index({ chainId: 1 });
hostelSchema.index({ location: "2dsphere" });
hostelSchema.index({ isActive: 1 });
hostelSchema.index({ city: 1 });

module.exports = mongoose.model("Hostel", hostelSchema);
