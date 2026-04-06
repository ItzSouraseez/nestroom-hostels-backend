const { generateOTP } = require("../utils/idGenerator");

/**
 * In-memory OTP store.
 * In production, replace with Redis for distributed deployments.
 * Structure: { key → { otp, expiresAt } }
 *
 * Key format: "email:<email>" | "whatsapp:<number>"
 */
const otpStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate and store a new OTP.
 * @param {string} type - "email" | "whatsapp"
 * @param {string} identifier - email or phone number
 * @returns {string} The generated OTP
 */
const createOTP = (type, identifier) => {
  const otp = generateOTP();
  const key = `${type}:${identifier}`;
  otpStore.set(key, {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
  return otp;
};

/**
 * Verify an OTP.
 * @param {string} type - "email" | "whatsapp"
 * @param {string} identifier
 * @param {string} submittedOtp
 * @returns {{ valid: boolean, reason?: string }}
 */
const verifyOTP = (type, identifier, submittedOtp) => {
  const key = `${type}:${identifier}`;
  const record = otpStore.get(key);

  if (!record) {
    return { valid: false, reason: "OTP not found or already used" };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { valid: false, reason: "OTP has expired" };
  }

  if (record.attempts >= 5) {
    otpStore.delete(key);
    return { valid: false, reason: "Too many failed attempts. Request a new OTP." };
  }

  if (record.otp !== String(submittedOtp)) {
    record.attempts += 1;
    return { valid: false, reason: "Invalid OTP" };
  }

  // Successful — delete to prevent reuse
  otpStore.delete(key);
  return { valid: true };
};

/**
 * Clear OTP explicitly (e.g. on re-send).
 */
const clearOTP = (type, identifier) => {
  otpStore.delete(`${type}:${identifier}`);
};

module.exports = { createOTP, verifyOTP, clearOTP };
