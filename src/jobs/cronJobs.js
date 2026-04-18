/**
 * nestRoom — Scheduled Cron Jobs
 * Runs on server startup via index.js
 */

const cron = require("node-cron");
const AttendanceRecord = require("../models/AttendanceRecord.model");
const Resident = require("../models/Resident.model");
const User = require("../models/User.model");
const Employee = require("../models/Employee.model");
const Payment = require("../models/Payment.model");

console.log("⏰ Cron jobs initialised.");

// ─── Job 1: Auto-close attendance ────────────────────────────────────────────
// Runs every hour. Marks all NotResponded records as Absent.
cron.schedule("0 * * * *", async () => {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    const result = await AttendanceRecord.updateMany(
      { status: "NotResponded", createdAt: { $lte: cutoff } },
      {
        $set: {
          status: "Absent",
          isLateResponse: false,
          responseType: "Auto",
        },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`⏰ [CRON] Auto-closed ${result.modifiedCount} attendance records → Absent`);
    }
  } catch (err) {
    console.error("❌ [CRON] autoCloseAttendance failed:", err.message);
  }
});

// ─── Job 2: Payment due reminders ─────────────────────────────────────────────
// Runs every day at 9:00 AM IST (03:30 UTC).
// Notifies residents whose payment is due in 3 days or 1 day.
cron.schedule("30 3 * * *", async () => {
  try {
    const now = new Date();
    const in1Day = new Date(now); in1Day.setDate(in1Day.getDate() + 1);
    const in3Days = new Date(now); in3Days.setDate(in3Days.getDate() + 3);

    const dueSoon = await Resident.find({
      residentStatus: "Active",
      nextDueDate: {
        $gte: now,
        $lte: in3Days,
      },
    })
      .select("fullName email whatsappNumber nextDueDate feeAmount")
      .lean();

    console.log(`💳 [CRON] Payment reminders: ${dueSoon.length} residents due soon`);

    // Lazy-require to avoid circular deps
    const { sendPaymentReceiptEmail } = require("../services/email");

    // In production: send actual reminder emails/WhatsApp per resident
    // for (const resident of dueSoon) { ... }
  } catch (err) {
    console.error("❌ [CRON] sendPaymentReminders failed:", err.message);
  }
});

// ─── Job 3: Employee password expiry check ────────────────────────────────────
// Runs every day at midnight IST (18:30 UTC).
// Flags employees whose password hasn't been changed in 90 days.
cron.schedule("30 18 * * *", async () => {
  try {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const expired = await Employee.countDocuments({
      isActive: true,
      "credentials.passwordLastChanged": { $lte: cutoff },
    });

    if (expired > 0) {
      console.log(`🔑 [CRON] ${expired} employee accounts have expired passwords`);
    }
    // Production: send targeted reminder per employee
  } catch (err) {
    console.error("❌ [CRON] checkEmployeePasswordExpiry failed:", err.message);
  }
});

// ─── Job 4: Clean up stale Pending payments ───────────────────────────────────
// Runs every day at 01:00 UTC.
// Marks Pending Razorpay orders older than 24h as Failed.
cron.schedule("0 1 * * *", async () => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Payment.updateMany(
      {
        paymentStatus: "Pending",
        paymentMethod: "Razorpay",
        createdAt: { $lte: cutoff },
      },
      {
        $set: {
          paymentStatus: "Failed",
        },
        $push: {
          paymentStatusHistory: { status: "Failed", changedBy: "system" },
        },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`🗑️  [CRON] Expired ${result.modifiedCount} stale Pending payments → Failed`);
    }
  } catch (err) {
    console.error("❌ [CRON] expireStalePayments failed:", err.message);
  }
});

// ─── Job 5: Recurring Attendance Trigger ─────────────────────────────────────
// Runs every 5 minutes.
// Checks hostels with enabled attendance and triggers if startTime matches.
cron.schedule("*/5 * * * *", async () => {
  try {
    const { triggerAttendanceForHostel } = require("../services/attendanceTrigger");
    const Hostel = require("../models/Hostel.model");
    
    // Get current time in HH:MM format (Asia/Kolkata)
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hh}:${mm}`;
    const currentDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];

    // Find hostels where attendance is enabled and startTime is due
    // Since we run every 5 mins, we check if startTime is within the last 5 mins
    const hostels = await Hostel.find({
      "attendanceConfig.enabled": true,
      "attendanceConfig.daysOfWeek": currentDay,
      "attendanceConfig.startTime": { $lte: currentTime },
    });

    for (const hostel of hostels) {
      // Check if it's strictly within the last 5 minutes to avoid double triggers in subsequent runs
      // Or just let triggerAttendanceForHostel handle the "already requested" check
      const result = await triggerAttendanceForHostel(hostel._id);
      if (result.success) {
        console.log(`⏰ [CRON] Triggered scheduled attendance for hostel: ${hostel.hostelName}`);
      }
    }
  } catch (err) {
    console.error("❌ [CRON] dailyAttendanceTrigger failed:", err.message);
  }
});

module.exports = {};
