const mongoose = require("mongoose");

const buildingSchema = new mongoose.Schema(
  {
    buildingId: { type: String, required: true, trim: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },

    buildingName: { type: String, required: true, trim: true },
    buildingNumber: { type: String, trim: true, default: null }, // "A", "B", etc.

    // ── Structure ────────────────────────────────────────────────────────────
    floorCount: { type: Number, required: true, min: 1 },
    floorPlan: { type: String, default: null }, // URL to PDF

    // ── Location ─────────────────────────────────────────────────────────────
    address: { type: String, default: null },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },

    // ── Amenities ────────────────────────────────────────────────────────────
    amenities: [{ type: String }],

    // ── Management ───────────────────────────────────────────────────────────
    buildingManager: { type: String, default: null },
    managerPhone: { type: String, default: null },
    maintenanceContact: { type: String, default: null },

    // ── Media ─────────────────────────────────────────────────────────────────
    images: [{ type: String }],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

buildingSchema.index({ buildingId: 1 });
buildingSchema.index({ hostelId: 1 });
buildingSchema.index({ hostelId: 1, isActive: 1 });
buildingSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Building", buildingSchema);
