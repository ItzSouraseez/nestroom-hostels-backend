const axios = require("axios");

const BASE_URL = `https://graph.facebook.com/${process.env.META_WHATSAPP_API_VERSION}`;
const PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID;
const TOKEN = process.env.META_WHATSAPP_TOKEN;

/**
 * Low-level: send a WhatsApp template message.
 * @param {string} to - Recipient phone (E.164 format: +919876543210)
 * @param {string} templateName - Meta-approved template name
 * @param {string} languageCode - e.g. "en"
 * @param {Array}  components - Template variable components
 */
const sendTemplate = async (to, templateName, languageCode = "en", components = []) => {
  const phone = to.replace(/^\+/, ""); // strip leading +

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components.length > 0 && { components }),
    },
  };

  try {
    const res = await axios.post(`${BASE_URL}/${PHONE_NUMBER_ID}/messages`, payload, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (err) {
    console.error("WhatsApp API error:", err.response?.data || err.message);
    throw new Error("WhatsApp message delivery failed");
  }
};

/**
 * Send OTP via WhatsApp (uses Meta OTP template).
 * Template must have a body parameter: {{1}} for OTP code.
 */
const sendOTPWhatsapp = async (to, otp) => {
  return sendTemplate(
    to,
    process.env.META_OTP_TEMPLATE_NAME || "otp",
    process.env.META_TEMPLATE_LANGUAGE_CODE || "en",
    [
      {
        type: "body",
        parameters: [{ type: "text", text: String(otp) }],
      },
    ]
  );
};

/**
 * Send login credentials via WhatsApp.
 * Requires a pre-approved "credentials" template with params: name, email, password.
 */
const sendCredentialsWhatsapp = async (to, { fullName, email, password, hostelCode }) => {
  // If you don't have a specific template, fall back to a text message
  // (This is a placeholder — replace with your approved template name + components)
  console.log(`[WhatsApp] Credentials for ${fullName} → ${to}`);
  // return sendTemplate(to, "user_credentials", "en", [...]);
};

/**
 * Send a payment reminder via WhatsApp.
 */
const sendPaymentReminder = async (to, { residentName, amount, dueDate }) => {
  console.log(`[WhatsApp] Payment reminder for ${residentName} → ${to}`);
  // return sendTemplate(to, "payment_reminder", "en", [...]);
};

/**
 * Send a leave status notification via WhatsApp.
 */
const sendLeaveStatus = async (to, { residentName, status, leaveId }) => {
  console.log(`[WhatsApp] Leave ${status} for ${residentName} → ${to}`);
  // return sendTemplate(to, "leave_status", "en", [...]);
};

module.exports = {
  sendOTPWhatsapp,
  sendCredentialsWhatsapp,
  sendPaymentReminder,
  sendLeaveStatus,
};
