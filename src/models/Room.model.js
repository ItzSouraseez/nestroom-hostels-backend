const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, trim: true },

    // ── References ────────────────────────────────────────────────────────────
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },

    // ── Room Details ──────────────────────────────────────────────────────────
    floorNumber: { type: Number, required: true },
    roomNumber: { type: String, required: true, trim: true },
    roomType: {
      type: String,
      enum: ["Single", "Double", "Triple", "Dorm"],
      required: true,
    },

    // ── Capacity ──────────────────────────────────────────────────────────────
    bedCount: { type: Number, required: true, min: 1 },
    occupiedBeds: { type: Number, default: 0 },
    availableBeds: { type: Number, default: 0 },

    // ── Pricing (per bed, per frequency) ─────────────────────────────────────
    pricing: {
      monthly: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: "INR" },
      },
      quarterly: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: "INR" },
      },
      yearly: {
        amount: { type: Number, default: 0 },
        currency: { type: String, default: "INR" },
      },
    },

    // ── Status ────────────────────────────────────────────────────────────────
    roomStatus: {
      type: String,
      enum: ["Vacant", "Occupied", "Maintenance", "Blocked"],
      default: "Vacant",
    },
    maintenanceStartDate: { type: Date, default: null },
    maintenanceEndDate: { type: Date, default: null },
    maintenanceReason: { type: String, default: null },

    // ── Amenities & Features ──────────────────────────────────────────────────
    amenities: [{ type: String }],
    hasAttachedBathroom: { type: Boolean, default: false },
    hasWindowView: { type: Boolean, default: false },
    hasBalcony: { type: Boolean, default: false },

    // ── Media ────────────────────────────────────────────────────────────────
    images: [{ type: String }],
    videoTour: { type: String, default: null },

    // ── Restrictions ─────────────────────────────────────────────────────────
    genderRestriction: { type: String, enum: [null, "Male", "Female"], default: null },
    smokingAllowed: { type: Boolean, default: false },
    petPolicy: { type: String, default: "Not allowed" },

    // ── Rules ────────────────────────────────────────────────────────────────
    quietHours: {
      startTime: { type: String, default: "22:00" },
      endTime: { type: String, default: "08:00" },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomSchema.index({ roomId: 1 });
roomSchema.index({ hostelId: 1 });
roomSchema.index({ buildingId: 1 });
roomSchema.index({ hostelId: 1, roomStatus: 1 });
roomSchema.index({ hostelId: 1, occupiedBeds: 1 });
roomSchema.index({ hostelId: 1, floorNumber: 1 });

module.exports = mongoose.model("Room", roomSchema);
