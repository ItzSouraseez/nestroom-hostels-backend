const mongoose = require("mongoose");

const paymentStatusEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "Processing", "Success", "Failed", "Refunded", "Partial"],
    },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, default: "system" }, // "system" | "razorpay" | userId string
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true, trim: true },

    // ── References ────────────────────────────────────────────────────────────
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ── Amount ────────────────────────────────────────────────────────────────
    amount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    amountDue: { type: Number, default: 0 },
    amountRefunded: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },

    // ── Period ────────────────────────────────────────────────────────────────
    forPeriod: {
      startDate: { type: Date },
      endDate: { type: Date },
      frequencyType: {
        type: String,
        enum: ["Monthly", "Quarterly", "Yearly"],
      },
      periodNumber: { type: Number },
    },

    // ── Payment Status ────────────────────────────────────────────────────────
    paymentStatus: {
      type: String,
      enum: ["Pending", "Processing", "Success", "Failed", "Refunded", "Partial"],
      default: "Pending",
    },
    paymentStatusHistory: [paymentStatusEntrySchema],

    // ── Payment Method ────────────────────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ["Razorpay", "Manual", "Check", "BankTransfer", "Cash"],
      default: "Razorpay",
    },

    // ── Razorpay Integration ──────────────────────────────────────────────────
    razorpay: {
      orderId: { type: String, default: null },
      paymentId: { type: String, default: null },
      signature: { type: String, default: null },
      responseData: { type: mongoose.Schema.Types.Mixed, default: null },
    },

    // ── Manual Payment ────────────────────────────────────────────────────────
    manualPayment: {
      isManual: { type: Boolean, default: false },
      mode: { type: String, enum: [null, "Check", "Cash", "BankTransfer"], default: null },
      referenceNumber: { type: String, default: null },
      checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      verifiedAt: { type: Date, default: null },
    },

    // ── Dates ─────────────────────────────────────────────────────────────────
    dueDate: { type: Date, default: null },
    paidDate: { type: Date, default: null },
    receiptGeneratedDate: { type: Date, default: null },

    // ── Refund ────────────────────────────────────────────────────────────────
    refundStatus: { type: String, enum: [null, "Pending", "Processed"], default: null },
    refundDate: { type: Date, default: null },
    refundReason: { type: String, default: null },

    // ── Invoice ───────────────────────────────────────────────────────────────
    invoiceNumber: { type: String, default: null },
    invoiceUrl: { type: String, default: null },
    receiptUrl: { type: String, default: null },

    // ── Notes ─────────────────────────────────────────────────────────────────
    remarks: { type: String, default: null },
    internalNotes: { type: String, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

paymentSchema.index({ hostelId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ residentId: 1, paidDate: -1 });
paymentSchema.index({ hostelId: 1, createdAt: -1 });
paymentSchema.index({ dueDate: 1, paymentStatus: 1 });
paymentSchema.index({ "razorpay.paymentId": 1 });
paymentSchema.index({ "razorpay.orderId": 1 });

module.exports = mongoose.model("Payment", paymentSchema);
