const Razorpay = require("razorpay");

/**
 * Lazy-initialize Razorpay client so the app doesn't crash at startup
 * when RAZORPAY_KEY_ID is not set (e.g. in test/dev environments).
 * The actual client is created on first use — by which time envs are loaded.
 */
let _client = null;

const getRazorpayClient = () => {
  if (!_client) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn("⚠️  RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payment features disabled.");
      return null;
    }
    _client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _client;
};

// Proxy object: intercept property access → delegate to lazy client
// This keeps `razorpay.orders.create(...)` call-sites unchanged.
const razorpayProxy = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getRazorpayClient();
      if (!client) throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
      return client[prop];
    },
  }
);

module.exports = razorpayProxy;
