const CryptoJS = require("crypto-js");

const SECRET = process.env.ENCRYPTION_SECRET;

if (!SECRET) {
  console.warn("⚠️  ENCRYPTION_SECRET not set — sensitive fields will NOT be encrypted.");
}

/**
 * Encrypt a plaintext string using AES-256.
 * @param {string} plaintext
 * @returns {string|null} Encrypted ciphertext string, or null if input is falsy.
 */
const encrypt = (plaintext) => {
  if (!plaintext || !SECRET) return plaintext;
  return CryptoJS.AES.encrypt(String(plaintext), SECRET).toString();
};

/**
 * Decrypt an AES-256 encrypted string.
 * @param {string} ciphertext
 * @returns {string|null} Decrypted plaintext, or null on failure.
 */
const decrypt = (ciphertext) => {
  if (!ciphertext || !SECRET) return ciphertext;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8) || null;
  } catch {
    return null;
  }
};

/**
 * Mask a decrypted string for safe display (e.g. "XXXX XXXX XXXX 1234")
 * @param {string} plaintext
 * @param {number} visibleChars - How many trailing chars to show
 */
const mask = (plaintext, visibleChars = 4) => {
  if (!plaintext) return null;
  const str = String(plaintext);
  if (str.length <= visibleChars) return str;
  return "X".repeat(str.length - visibleChars) + str.slice(-visibleChars);
};

module.exports = { encrypt, decrypt, mask };
