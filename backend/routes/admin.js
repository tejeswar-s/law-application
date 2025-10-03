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
const AdminCalendar = require("../models/AdminCalendar");

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
// Admin Calendar Routes
// ============================================

// GET /api/admin/calendar/blocked - Get blocked time slots
router.get("/calendar/blocked", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const blockedSlots = await AdminCalendar.getBlockedSlots(
      startDate,
      endDate
    );

    res.json({
      success: true,
      blockedSlots,
    });
  } catch (error) {
    console.error("Error fetching blocked slots:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blocked slots",
    });
  }
});

// GET /api/admin/calendar/available - Get available time slots
router.get("/calendar/available", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const availableSlots = await AdminCalendar.getAvailableSlots(
      startDate,
      endDate
    );

    res.json({
      success: true,
      availableSlots,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available slots",
    });
  }
});

// POST /api/admin/calendar/block - Manually block a time slot
router.post("/calendar/block", async (req, res) => {
  try {
    const { blockedDate, blockedTime, reason } = req.body;

    if (!blockedDate || !blockedTime) {
      return res.status(400).json({
        success: false,
        message: "blockedDate and blockedTime are required",
      });
    }

    const calendarId = await AdminCalendar.blockSlot({
      blockedDate,
      blockedTime,
      reason: reason || "Manually blocked by admin",
    });

    res.json({
      success: true,
      message: "Time slot blocked successfully",
      calendarId,
    });
  } catch (error) {
    console.error("Error blocking slot:", error);
    res.status(500).json({
      success: false,
      message: "Failed to block time slot",
    });
  }
});

// DELETE /api/admin/calendar/unblock/:calendarId - Unblock a time slot
router.delete("/calendar/unblock/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    await AdminCalendar.unblockSlot(calendarId);

    res.json({
      success: true,
      message: "Time slot unblocked successfully",
    });
  } catch (error) {
    console.error("Error unblocking slot:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unblock time slot",
    });
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
