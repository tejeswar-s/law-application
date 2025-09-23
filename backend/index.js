const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { poolPromise } = require("./config/db");
require("dotenv").config();

// Next.js integration
const next = require("next");
const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev, dir: path.join(__dirname, "../frontend") });
const handle = nextApp.getRequestHandler();

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
    origin: process.env.FRONTEND_URL || "*", // allow frontend hosted together
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

// ===== Routes =====
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

// Import routers
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/attorney", require("./routes/attorneyRoutes"));
app.use("/api/juror", require("./routes/jurorRoutes"));
app.use("/api", require("./routes/caseRoutes"));
app.use("/api", require("./routes/scheduleTrial"));
app.use("/api", require("./routes/warRoomTeamRoutes"));
app.use("/api", require("./routes/warRoomDocumentRoutes"));
app.use("/api", require("./routes/warRoomVoirDireRoutes"));
app.use("/api", require("./routes/warRoomInfoRoutes"));

// ===== Global error handler =====
app.use(require("./middleware/errorHandler"));

// ===== Start server with Next.js =====
// ===== Start server with Next.js =====
nextApp.prepare().then(() => {
  // Let Next.js handle all non-API requests
  app.all("/*", (req, res) => handle(req, res));

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Unified app running on http://localhost:${PORT}`);
  });
});
