const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

/** Factory: creates a Cloudinary-backed Multer upload instance */
const createUploader = (folder, allowedFormats = ["jpg", "jpeg", "png", "pdf", "webp"]) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `nestroom/${folder}`,
      allowed_formats: allowedFormats,
      resource_type: "auto",
      // Unique filename
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
    }),
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  });
};

// ─── Single-file uploaders ─────────────────────────────────────────────────────

/** Profile photo upload (field name: "profilePhoto") */
const uploadProfilePhoto = createUploader("profiles", ["jpg", "jpeg", "png", "webp"]).single("profilePhoto");

/** Cover photo upload (field name: "coverPhoto") */
const uploadCoverPhoto = createUploader("covers", ["jpg", "jpeg", "png", "webp"]).single("coverPhoto");

/** Hostel registration document (field name: "registrationDocument") */
const uploadRegistrationDoc = createUploader("registrations", ["jpg", "jpeg", "png", "pdf"]).single("registrationDocument");

// ─── Multi-file uploaders ──────────────────────────────────────────────────────

/**
 * KYC documents (fields: profilePhoto, aadhaarPhoto, collegeIdPhoto)
 */
const uploadKYCDocuments = createUploader("kyc", ["jpg", "jpeg", "png", "webp"]).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "aadhaarPhoto", maxCount: 1 },
  { name: "collegeIdPhoto", maxCount: 1 },
]);

/**
 * Complaint attachments (field: "attachments", max 5 files)
 */
const uploadComplaintAttachments = createUploader("complaints", ["jpg", "jpeg", "png", "pdf", "webp"]).array(
  "attachments",
  5
);

/**
 * Leave attachments (field: "attachments", max 3 files)
 */
const uploadLeaveAttachments = createUploader("leaves", ["jpg", "jpeg", "png", "pdf"]).array("attachments", 3);

/**
 * Room images (field: "images", max 10 files)
 */
const uploadRoomImages = createUploader("rooms", ["jpg", "jpeg", "png", "webp"]).array("images", 10);

/**
 * Hostel images (field: "images", max 10 files)
 */
const uploadHostelImages = createUploader("hostels", ["jpg", "jpeg", "png", "webp"]).array("images", 10);

module.exports = {
  uploadProfilePhoto,
  uploadCoverPhoto,
  uploadRegistrationDoc,
  uploadKYCDocuments,
  uploadComplaintAttachments,
  uploadLeaveAttachments,
  uploadRoomImages,
  uploadHostelImages,
};
