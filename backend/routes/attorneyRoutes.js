const express = require("express");
const {
  authMiddleware,
  requireAttorney,
  requireVerified,
} = require("../middleware/authMiddleware");
const {
  updateProfileHandler,
  deleteAccountHandler,
} = require("../controllers/attorneyController");

const router = express.Router();

// All routes here require authentication as attorney
router.use(authMiddleware);
router.use(requireAttorney);

// Get attorney dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const attorney = req.user;

    res.json({
      success: true,
      data: {
        attorney: {
          id: attorney.id,
          firstName: attorney.firstName,
          lastName: attorney.lastName,
          lawFirmName: attorney.lawFirmName,
          email: attorney.email,
          verified: attorney.verified,
          verificationStatus: attorney.verificationStatus,
        },
        // Add more dashboard data as needed
        cases: [], // Placeholder for cases
        upcomingEvents: [], // Placeholder for events
      },
    });
  } catch (error) {
    console.error("Attorney dashboard error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get attorney profile
router.get("/profile", async (req, res) => {
  try {
    const attorney = req.user;

    res.json({
      success: true,
      attorney: {
        id: attorney.id,
        firstName: attorney.firstName,
        lastName: attorney.lastName,
        lawFirmName: attorney.lawFirmName,
        email: attorney.email,
        phoneNumber: attorney.phoneNumber,
        verified: attorney.verified,
        verificationStatus: attorney.verificationStatus,
      },
    });
  } catch (error) {
    console.error("Get attorney profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update attorney profile
router.put("/profile", updateProfileHandler);

// Delete attorney account
router.delete("/profile", deleteAccountHandler);

module.exports = router;
