const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  attorneySignup,
  jurorSignup,
  attorneyLogin,
  jurorLogin,
  verifyToken,
  requestPasswordReset,
  resetPassword,
  sendJurorEmailVerification,
  verifyEmailVerificationToken,
  sendAttorneyEmailVerification,
  sendAttorneyOTP,
  verifyAttorneyOTP,
  sendJurorOTP, // NEW
  verifyJurorOTP, // NEW
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many login attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: "Too many password reset attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

// Attorney routes
router.post("/attorney/signup", authLimiter, attorneySignup);
router.post("/attorney/login", loginLimiter, attorneyLogin);

// Juror routes
router.post("/juror/signup", authLimiter, jurorSignup);
router.post("/juror/login", loginLimiter, jurorLogin);

// Password reset routes
router.post(
  "/request-password-reset",
  passwordResetLimiter,
  requestPasswordReset
);
router.post("/reset-password", authLimiter, resetPassword);

// Email verification (juror signup step 3)
router.post(
  "/juror/send-email-verification",
  authLimiter,
  sendJurorEmailVerification
);
router.post(
  "/attorney/send-email-verification",
  authLimiter,
  sendAttorneyEmailVerification
);
router.get("/verify-email-token", verifyEmailVerificationToken);

// Attorney OTP verification routes
router.post("/attorney/send-otp", authLimiter, sendAttorneyOTP);
router.post("/attorney/verify-otp", authLimiter, verifyAttorneyOTP);

// Juror OTP verification routes (NEW)
router.post("/juror/send-otp", authLimiter, sendJurorOTP);
router.post("/juror/verify-otp", authLimiter, verifyJurorOTP);

// Token verification
router.post("/verify-token", verifyToken);
router.get("/verify-token", verifyToken);

// Protected route - get current user info
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { user } = req;
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        type: user.type,
        verified: user.verified,
        ...user,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "auth",
  });
});

module.exports = router;
