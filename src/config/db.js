const mongoose = require("mongoose");

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

let retries = 0;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || "nestroom",
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    retries = 0;
  } catch (error) {
    retries += 1;
    console.error(`❌ MongoDB connection failed (attempt ${retries}/${MAX_RETRIES}): ${error.message}`);

    if (retries < MAX_RETRIES) {
      console.log(`🔄 Retrying in ${RETRY_INTERVAL_MS / 1000}s...`);
      setTimeout(connectDB, RETRY_INTERVAL_MS);
    } else {
      console.error("💀 Max retries reached. Exiting process.");
      process.exit(1);
    }
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
  connectDB();
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err.message);
});

module.exports = connectDB;
