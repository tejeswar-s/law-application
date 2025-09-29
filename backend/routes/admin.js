const express = require("express");
const router = express.Router();
const {
  authMiddleware,
  requireAdmin,
} = require("../middleware/authMiddleware");

// Import admin controller functions
const {
  getCasesPendingApproval,
  reviewCaseApproval,
  getAllCases,
  getCaseDetailsForAdmin,
  getAttorneysPendingVerification,
  verifyAttorney,
  getJurorsPendingVerification,
  verifyJuror,
  getAdminDashboard,
  getSystemAnalytics,
  getAdminSchedule,
  updateSchedule,
} = require("../controllers/adminController");

// Import models for simple routes
const Attorney = require("../models/Attorney");
const Juror = require("../models/Juror");

// Apply authentication middleware to all admin routes
// Note: Uncomment these when you have admin authentication ready
// router.use(authMiddleware);
// router.use(requireAdmin);

// ============================================
// Dashboard & Analytics Routes
// ============================================

// GET /api/admin/dashboard - Get admin dashboard overview
router.get("/dashboard", getAdminDashboard);

// GET /api/admin/analytics - Get system analytics
router.get("/analytics", getSystemAnalytics);

// ============================================
// Case Management Routes
// ============================================

// GET /api/admin/cases/pending - Get cases pending approval
router.get("/cases/pending", getCasesPendingApproval);

// GET /api/admin/cases - Get all cases with filtering
router.get("/cases", getAllCases);

// GET /api/admin/cases/:caseId - Get case details
router.get("/cases/:caseId", getCaseDetailsForAdmin);

// POST /api/admin/cases/:caseId/review - Approve/reject case
router.post("/cases/:caseId/review", reviewCaseApproval);

// ============================================
// Attorney Management Routes
// ============================================

// GET /api/admin/attorneys - Get all attorneys
router.get("/attorneys", async (req, res) => {
  try {
    const { attorneys } = await Attorney.getAllAttorneys(1, 100);
    res.json(attorneys);
  } catch (err) {
    console.error("Error fetching attorneys:", err);
    res.status(500).json({ error: "Failed to fetch attorneys" });
  }
});

// GET /api/admin/attorneys/pending - Get attorneys pending verification
router.get("/attorneys/pending", getAttorneysPendingVerification);

// POST /api/admin/attorneys/:attorneyId/verify - Verify attorney
router.post("/attorneys/:attorneyId/verify", verifyAttorney);

// Legacy route for backward compatibility
router.post("/attorneys/:id/verify", async (req, res) => {
  try {
    await Attorney.updateVerificationStatus(req.params.id, "verified");
    res.json({ success: true });
  } catch (err) {
    console.error("Error verifying attorney:", err);
    res.status(500).json({ error: "Failed to verify attorney" });
  }
});

// ============================================
// Juror Management Routes
// ============================================

// GET /api/admin/jurors - Get all jurors
router.get("/jurors", async (req, res) => {
  try {
    const { jurors } = await Juror.getAllJurors(1, 100);
    res.json(jurors);
  } catch (err) {
    console.error("Error fetching jurors:", err);
    res.status(500).json({ error: "Failed to fetch jurors" });
  }
});

// GET /api/admin/jurors/pending - Get jurors pending verification
router.get("/jurors/pending", getJurorsPendingVerification);

// POST /api/admin/jurors/:jurorId/verify - Verify juror
router.post("/jurors/:jurorId/verify", verifyJuror);

// Legacy route for backward compatibility
router.post("/jurors/:id/verify", async (req, res) => {
  try {
    await Juror.updateVerificationStatus(req.params.id, "verified");
    res.json({ success: true });
  } catch (err) {
    console.error("Error verifying juror:", err);
    res.status(500).json({ error: "Failed to verify juror" });
  }
});

// ============================================
// Schedule Management Routes (Placeholder)
// ============================================

// GET /api/admin/schedule - Get admin schedule
router.get("/schedule", getAdminSchedule);

// PUT /api/admin/schedule - Update admin schedule
router.put("/schedule", updateSchedule);

module.exports = router;
