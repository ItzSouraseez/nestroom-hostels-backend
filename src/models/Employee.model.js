const mongoose = require("mongoose");

const allowanceSchema = new mongoose.Schema(
  { name: String, amount: Number },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true },
    employeeCode: { type: String, required: true, unique: true, trim: true },

    // ── User Link ─────────────────────────────────────────────────────────────
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },

    // ── Personal Info ─────────────────────────────────────────────────────────
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    whatsappNumber: { type: String, trim: true, default: null },
    dateOfBirth: { type: Date, default: null },

    // ── Employment ────────────────────────────────────────────────────────────
    position: {
      type: String,
      enum: ["Manager", "Warden", "Receptionist", "Housekeeping", "Kitchen", "Security", "Other"],
      required: true,
    },
    department: { type: String, default: null },
    hireDate: { type: Date, default: null },
    contractEndDate: { type: Date, default: null },
    employmentType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract"],
      default: "Full-Time",
    },

    // ── Login Credentials ─────────────────────────────────────────────────────
    credentials: {
      username: { type: String, required: true, unique: true, trim: true },
      passwordHash: { type: String, required: true },
      passwordLastChanged: { type: Date, default: Date.now },
      passwordExpiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    },

    // ── RBAC Permissions ─────────────────────────────────────────────────────
    permissions: {
      // Resident Management
      canAddResidents: { type: Boolean, default: false },
      canEditResidents: { type: Boolean, default: false },
      canDeleteResidents: { type: Boolean, default: false },
      canViewResidentKYC: { type: Boolean, default: false },
      canApproveKYC: { type: Boolean, default: false },
      // Room Management
      canManageRooms: { type: Boolean, default: false },
      canEditRoomStatus: { type: Boolean, default: false },
      canAllocateRooms: { type: Boolean, default: false },
      // Payment Management
      canViewPayments: { type: Boolean, default: false },
      canInitiatePayments: { type: Boolean, default: false },
      canMarkPaymentManual: { type: Boolean, default: false },
      canViewRevenue: { type: Boolean, default: false },
      canExportPaymentReport: { type: Boolean, default: false },
      // Attendance
      canViewAttendance: { type: Boolean, default: false },
      canInitiateAttendance: { type: Boolean, default: false },
      canOverrideAttendance: { type: Boolean, default: false },
      // Leave
      canApproveLeaves: { type: Boolean, default: false },
      canRejectLeaves: { type: Boolean, default: false },
      canViewLeaveAnalytics: { type: Boolean, default: false },
      // Complaints
      canViewComplaints: { type: Boolean, default: false },
      canAssignComplaints: { type: Boolean, default: false },
      canUpdateComplaintStatus: { type: Boolean, default: false },
      canDeleteComplaints: { type: Boolean, default: false },
      // Notifications
      canSendNotifications: { type: Boolean, default: false },
      canViewNotificationAnalytics: { type: Boolean, default: false },
      canViewPollResults: { type: Boolean, default: false },
      // Food
      canManageFoodSchedule: { type: Boolean, default: false },
      canViewFoodFeedback: { type: Boolean, default: false },
      // General
      canManageEmployees: { type: Boolean, default: false },
      isAdmin: { type: Boolean, default: false },
    },

    // ── Assignment ────────────────────────────────────────────────────────────
    assignedBuildings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Building" }],
    assignedFloors: [{ type: Number }],

    // ── Contact ───────────────────────────────────────────────────────────────
    phoneNumber: { type: String, default: null },
    alternatePhone: { type: String, default: null },
    emergencyContactName: { type: String, default: null },
    emergencyContactPhone: { type: String, default: null },

    // ── Address ───────────────────────────────────────────────────────────────
    address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    pincode: { type: String, default: null },

    // ── Bank (for salary) — encrypted ─────────────────────────────────────────
    bankDetails: {
      accountHolderName: { type: String, default: null },
      accountNumber: { type: String, default: null }, // AES-256 encrypted
      ifscCode: { type: String, default: null },
      bankName: { type: String, default: null },
    },

    // ── Salary ────────────────────────────────────────────────────────────────
    salary: {
      basicSalary: { type: Number, default: 0 },
      allowances: [allowanceSchema],
      deductions: [allowanceSchema],
      payrollFrequency: { type: String, default: "Monthly" },
    },

    // ── Activity ──────────────────────────────────────────────────────────────
    lastLogin: { type: Date, default: null },
    loginCount: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lastPasswordChangeBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Status ────────────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String, default: null },
  },
  { timestamps: true }
);

employeeSchema.index({ userId: 1 });
employeeSchema.index({ hostelId: 1 });
employeeSchema.index({ position: 1 });
employeeSchema.index({ hostelId: 1, isActive: 1 });

module.exports = mongoose.model("Employee", employeeSchema);
