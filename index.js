require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const start = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start cron jobs
  require("./src/jobs/cronJobs");

  // Start HTTP server
  const server = app.listen(PORT, () => {
    console.log(`🚀 nestRoom API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`   Base URL    : http://localhost:${PORT}/v1`);
  });

  // ─── Graceful Shutdown ───────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n⚠️  ${signal} received. Gracefully shutting down...`);
    server.close(() => {
      console.log("✅ HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled Promise Rejection:", reason);
    server.close(() => process.exit(1));
  });
};

start();
