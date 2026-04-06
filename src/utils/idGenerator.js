/**
 * nestRoom — Custom ID Generators
 * Generates human-readable, sequential-style IDs per entity type.
 * Each uses a counter suffix that should come from an atomic DB sequence in production.
 * For simplicity these generate unique-enough IDs using timestamp + random suffix.
 */

const { randomInt } = require("crypto");

/**
 * Zero-padded random number string of a given length
 */
const randPad = (len = 3) => String(randomInt(1, 10 ** len - 1)).padStart(len, "0");

/**
 * Current year (4-digit)
 */
const year = () => new Date().getFullYear();

// ─── User IDs ────────────────────────────────────────────────────────────────
const generateOwnerId  = () => `USR_OWN_${randPad(3)}`;
const generateEmployeeUserId = () => `USR_EMP_${randPad(3)}`;
const generateResidentUserId = () => `USR_RES_${randPad(3)}`;

// ─── Hostel ───────────────────────────────────────────────────────────────────
const generateHostelId = () => `HST_${randPad(3)}`;

/**
 * Hostel code — derived from hostel name + sequential number + city
 * e.g. "XYZ_001_Bangalore"
 */
const generateHostelCode = (hostelName, city) => {
  const prefix = hostelName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 5);
  const citySlug = (city || "XX").replace(/\s+/g, "").slice(0, 10);
  return `${prefix}_${randPad(3)}_${citySlug}`;
};

// ─── Building ───────────────────────────────────────────────────────────────
const generateBuildingId = () => `BLD_${randPad(3)}`;

// ─── Room ────────────────────────────────────────────────────────────────────
/**
 * roomId format: RM_{buildingCode}_{floor}_{roomNumber}
 * e.g. RM_A_01_101
 */
const generateRoomId = (buildingCode, floorNumber, roomNumber) =>
  `RM_${buildingCode}_${String(floorNumber).padStart(2, "0")}_${roomNumber}`;

// ─── Bed ─────────────────────────────────────────────────────────────────────
/**
 * bedId format: BD_{roomId}_{bedLetter}
 * e.g. BD_RM_A_01_101_A
 */
const generateBedId = (roomId, bedLetter) => `BD_${roomId}_${bedLetter}`;

const BED_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
/**
 * Returns an array of bed IDs for a room (based on bedCount)
 */
const generateBedIds = (roomId, bedCount) =>
  Array.from({ length: bedCount }, (_, i) => generateBedId(roomId, BED_LETTERS[i] || `B${i + 1}`));

// ─── Resident ─────────────────────────────────────────────────────────────────
/**
 * @param {string} [hostelCode] - Optional hostel code prefix (e.g. "NR_001_XX")
 * @param {number} [yearParam]  - Optional year override
 */
const generateResidentId = (hostelCode, yearParam) => {
  const prefix = hostelCode
    ? hostelCode.split("_")[0].slice(0, 5).toUpperCase()
    : "RES";
  return `${prefix}_${randPad(3)}_${yearParam || year()}`;
};

// ─── Employee ─────────────────────────────────────────────────────────────────
const generateEmployeeId = () => `EMP_${randPad(3)}`;

/**
 * employeeCode format: {hostelCode}_EMP_{employeeId}
 * e.g. XYZ_001_Bangalore_EMP_001
 */
const generateEmployeeCode = (hostelCode, employeeId) => `${hostelCode}_${employeeId}`;

/**
 * Auto-generate username for employee: firstName.lastName (lowercased)
 */
const generateUsername = (fullName) => {
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  const base = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
  return `${base}${randPad(2)}`;
};

// ─── Payment ──────────────────────────────────────────────────────────────────
const generatePaymentId = () => `PAY_${randPad(3)}_${year()}`;

const generateInvoiceNumber = () => `INV_${randPad(3)}_${year()}`;

// ─── Attendance ───────────────────────────────────────────────────────────────
const generateAttendanceId = (date = new Date()) => {
  const d = date.toISOString().slice(0, 10).replace(/-/g, "_");
  return `ATT_${randPad(3)}_${d}`;
};

// ─── Leave ────────────────────────────────────────────────────────────────────
const generateLeaveId = () => `LEV_${randPad(3)}_${year()}`;

// ─── Notification ─────────────────────────────────────────────────────────────
const generateNotificationId = () => `NTF_${randPad(3)}_${year()}`;

// ─── Complaint ────────────────────────────────────────────────────────────────
const generateComplaintId = () => `CMP_${randPad(3)}_${year()}`;

// ─── Food Schedule ────────────────────────────────────────────────────────────
const generateFoodScheduleId = (weekNumber) => `FD_${randPad(3)}_${year()}_W${String(weekNumber).padStart(2, "0")}`;

// ─── Audit Log ────────────────────────────────────────────────────────────────
const generateAuditLogId = () => `AUD_${randPad(3)}_${year()}`;

// ─── OTP ──────────────────────────────────────────────────────────────────────
/**
 * Generate a 6-digit numeric OTP
 */
const generateOTP = () => String(randomInt(100000, 999999));

/**
 * Generate a secure temporary password
 * e.g. TempPass@2024
 */
const generateTempPassword = () => {
  const digits = randPad(4);
  const specials = ["@", "#", "!", "$"];
  const special = specials[randomInt(0, specials.length)];
  return `TempPass${special}${digits}`;
};

module.exports = {
  generateOwnerId,
  generateEmployeeUserId,
  generateResidentUserId,
  generateHostelId,
  generateHostelCode,
  generateBuildingId,
  generateRoomId,
  generateBedId,
  generateBedIds,
  BED_LETTERS,
  generateResidentId,
  generateEmployeeId,
  generateEmployeeCode,
  generateUsername,
  generatePaymentId,
  generateInvoiceNumber,
  generateAttendanceId,
  generateLeaveId,
  generateNotificationId,
  generateComplaintId,
  generateFoodScheduleId,
  generateAuditLogId,
  generateOTP,
  generateTempPassword,
};
