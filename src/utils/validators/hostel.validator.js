const Joi = require("joi");

const phoneSchema = Joi.string().pattern(/^\+[1-9]\d{6,14}$/).message("Use E.164 format e.g. +919876543210");

// ── Update Hostel Profile ─────────────────────────────────────────────────────
const updateHostelSchema = Joi.object({
  hostelName: Joi.string().min(2).max(100).trim(),
  description: Joi.string().max(500).trim().allow("", null),
  hostelType: Joi.string().valid("Budget", "Standard", "Premium"),
  contactPhone: phoneSchema.allow(null),
  contactEmail: Joi.string().email().lowercase().allow(null),
  whatsappNumber: phoneSchema.allow(null),
  checkInTime: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null),
  checkOutTime: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null),
  visitorPolicy: Joi.string().max(200).allow(null),
  smokePolicy: Joi.string().max(200).allow(null),
  address: Joi.string().max(300).allow(null),
  landmark: Joi.string().max(200).allow(null),
  city: Joi.string().max(100).allow(null),
  state: Joi.string().max(100).allow(null),
  pincode: Joi.string().max(10).allow(null),
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).allow(null),
  geofenceRadius: Joi.number().min(100).max(5000).allow(null),
});

// ── Update Bank Details ───────────────────────────────────────────────────────
const updateBankDetailsSchema = Joi.object({
  accountHolderName: Joi.string().trim().required(),
  accountNumber: Joi.string().trim().required(),
  ifscCode: Joi.string().trim().uppercase().required(),
  bankName: Joi.string().trim().required(),
  accountType: Joi.string().valid("Savings", "Current").required(),
  branchCode: Joi.string().trim().allow(null),
});

// ── Add Employee ──────────────────────────────────────────────────────────────
const addEmployeeSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  whatsappNumber: phoneSchema.required(),
  position: Joi.string().valid("Manager","Warden","Receptionist","Housekeeping","Kitchen","Security","Other").required(),
  department: Joi.string().max(100).allow(null),
  hireDate: Joi.string().isoDate().allow(null),
  employmentType: Joi.string().valid("Full-Time","Part-Time","Contract").default("Full-Time"),
  permissions: Joi.object({
    canAddResidents: Joi.boolean().default(false),
    canEditResidents: Joi.boolean().default(false),
    canDeleteResidents: Joi.boolean().default(false),
    canViewResidentKYC: Joi.boolean().default(false),
    canApproveKYC: Joi.boolean().default(false),
    canManageRooms: Joi.boolean().default(false),
    canEditRoomStatus: Joi.boolean().default(false),
    canAllocateRooms: Joi.boolean().default(false),
    canViewPayments: Joi.boolean().default(false),
    canInitiatePayments: Joi.boolean().default(false),
    canMarkPaymentManual: Joi.boolean().default(false),
    canViewRevenue: Joi.boolean().default(false),
    canExportPaymentReport: Joi.boolean().default(false),
    canViewAttendance: Joi.boolean().default(false),
    canInitiateAttendance: Joi.boolean().default(false),
    canOverrideAttendance: Joi.boolean().default(false),
    canApproveLeaves: Joi.boolean().default(false),
    canRejectLeaves: Joi.boolean().default(false),
    canViewLeaveAnalytics: Joi.boolean().default(false),
    canViewComplaints: Joi.boolean().default(false),
    canAssignComplaints: Joi.boolean().default(false),
    canUpdateComplaintStatus: Joi.boolean().default(false),
    canDeleteComplaints: Joi.boolean().default(false),
    canSendNotifications: Joi.boolean().default(false),
    canViewNotificationAnalytics: Joi.boolean().default(false),
    canViewPollResults: Joi.boolean().default(false),
    canManageFoodSchedule: Joi.boolean().default(false),
    canViewFoodFeedback: Joi.boolean().default(false),
  }).default({}),
});

// ── Create Building ───────────────────────────────────────────────────────────
const createBuildingSchema = Joi.object({
  buildingName: Joi.string().min(1).max(100).trim().required(),
  buildingNumber: Joi.string().max(10).trim().allow(null),
  floorCount: Joi.number().integer().min(1).max(200).required(),
  address: Joi.string().max(300).allow(null),
  amenities: Joi.array().items(Joi.string()).default([]),
  buildingManager: Joi.string().max(100).allow(null),
  managerPhone: phoneSchema.allow(null),
});

// ── Create Room ───────────────────────────────────────────────────────────────
const createRoomSchema = Joi.object({
  buildingId: Joi.string().required(),
  floorNumber: Joi.number().integer().min(0).required(),
  roomNumber: Joi.string().max(20).trim().required(),
  roomType: Joi.string().valid("Single","Double","Triple","Dorm").required(),
  bedCount: Joi.number().integer().min(1).max(20).required(),
  monthlyFee: Joi.number().min(0).required(),
  quarterlyFee: Joi.number().min(0).allow(null),
  yearlyFee: Joi.number().min(0).allow(null),
  amenities: Joi.array().items(Joi.string()).default([]),
  hasAttachedBathroom: Joi.boolean().default(false),
  hasWindowView: Joi.boolean().default(false),
  hasBalcony: Joi.boolean().default(false),
  genderRestriction: Joi.string().valid("Male","Female").allow(null).default(null),
  smokingAllowed: Joi.boolean().default(false),
});

// ── Update Room ───────────────────────────────────────────────────────────────
const updateRoomSchema = Joi.object({
  roomType: Joi.string().valid("Single","Double","Triple","Dorm"),
  monthlyFee: Joi.number().min(0),
  quarterlyFee: Joi.number().min(0).allow(null),
  yearlyFee: Joi.number().min(0).allow(null),
  amenities: Joi.array().items(Joi.string()),
  hasAttachedBathroom: Joi.boolean(),
  hasWindowView: Joi.boolean(),
  hasBalcony: Joi.boolean(),
  roomStatus: Joi.string().valid("Vacant","Occupied","Maintenance","Blocked"),
  maintenanceReason: Joi.string().max(200).allow(null),
  genderRestriction: Joi.string().valid("Male","Female").allow(null),
  smokingAllowed: Joi.boolean(),
});

module.exports = {
  updateHostelSchema,
  updateBankDetailsSchema,
  addEmployeeSchema,
  createBuildingSchema,
  createRoomSchema,
  updateRoomSchema,
};
