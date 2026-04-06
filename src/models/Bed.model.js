const mongoose = require("mongoose");

const previousResidentSchema = new mongoose.Schema(
  {
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },
    allocatedFrom: { type: Date },
    allocatedTo: { type: Date },
    name: { type: String },
  },
  { _id: false }
);

const bedSchema = new mongoose.Schema(
  {
    bedId: { type: String, required: true, trim: true },

    // ── References ────────────────────────────────────────────────────────────
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: "Building", required: true },

    // ── Bed Info ─────────────────────────────────────────────────────────────
    bedNumber: { type: String, required: true }, // "A", "B", "C"
    bedPosition: {
      type: String,
      enum: ["WindowSide", "DoorSide", "Middle", "Corner", "Other"],
      default: "Other",
    },
    bedType: {
      type: String,
      enum: ["Single", "Bunk", "Queen"],
      default: "Single",
    },

    // ── Allocation ────────────────────────────────────────────────────────────
    bedStatus: {
      type: String,
      enum: ["Vacant", "Occupied", "Maintenance"],
      default: "Vacant",
    },
    currentResidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      default: null,
    },
    allocationDate: { type: Date, default: null },
    expectedCheckoutDate: { type: Date, default: null },

    // ── History ───────────────────────────────────────────────────────────────
    previousResidents: [previousResidentSchema],

    // ── Maintenance ───────────────────────────────────────────────────────────
    lastMaintenanceDate: { type: Date, default: null },
    nextMaintenanceDate: { type: Date, default: null },
    maintenanceNotes: { type: String, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bedSchema.index({ bedId: 1 });
bedSchema.index({ roomId: 1 });
bedSchema.index({ currentResidentId: 1 });
bedSchema.index({ roomId: 1, bedStatus: 1 });
bedSchema.index({ hostelId: 1, bedStatus: 1 });

module.exports = mongoose.model("Bed", bedSchema);
