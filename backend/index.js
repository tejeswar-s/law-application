require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const next = require("next");

// Import routes
const authRoutes = require("./routes/authRoutes");
const attorneyRoutes = require("./routes/attorneyRoutes");
const jurorRoutes = require("./routes/jurorRoutes");
const scheduleTrialRoutes = require("./routes/scheduleTrial");
const warRoomTeamRoutes = require("./routes/warRoomTeamRoutes");
const warRoomDocumentRoutes = require("./routes/warRoomDocumentRoutes");
const warRoomVoirDireRoutes = require("./routes/warRoomVoirDireRoutes");
const warRoomInfoRoutes = require("./routes/warRoomInfoRoutes");
const adminRoutes = require("./routes/admin");
const errorHandler = require("./middleware/errorHandler");

// Database
const { poolPromise } = require("./config/db");

const app = express();

// ===== Security =====
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// ===== CORS =====
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ===== Middleware =====
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== Rate Limit =====
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => res.statusCode < 400,
});
app.use("/api", globalLimiter);

// ===== API Routes =====
app.get("/api/health", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().query("SELECT 1 as test");
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (err) {
    res.status(500).json({ status: "ERROR", error: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/attorney", attorneyRoutes);
app.use("/api/juror", jurorRoutes);
app.use("/api", scheduleTrialRoutes);
app.use("/api", require("./routes/caseRoutes"));
app.use("/api", warRoomTeamRoutes);
app.use("/api", warRoomDocumentRoutes);
app.use("/api", warRoomVoirDireRoutes);
app.use("/api", warRoomInfoRoutes);
app.use("/api/admin", adminRoutes);

// ===== 404 handler for API =====
app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// ===== Global Error Handler =====
app.use(errorHandler);

// ===== Next.js Setup =====
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev, dir: path.join(__dirname, "../frontend") });
const handle = nextApp.getRequestHandler();

async function startServer() {
  try {
    await poolPromise;
    console.log("✅ Database connection established successfully");

    await nextApp.prepare();

    const PORT = process.env.PORT || 4000;

    app.all("*", (req, res) => handle(req, res));

    const server = app.listen(PORT, () => {
      console.log(`🚀 Unified app running on http://localhost:${PORT}`);
    });

    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(() => process.exit(0));
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received. Shutting down gracefully...");
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
