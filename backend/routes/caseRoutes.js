const express = require("express");
const router = express.Router();
const {
  authMiddleware,
  requireAttorney,
} = require("../middleware/authMiddleware");
const {
  createCase,
  getAttorneyCases,
  getCaseDetails,
} = require("../controllers/caseController");

// Create new case (Attorney only)
router.post("/cases", authMiddleware, requireAttorney, createCase);

// Get attorney's cases
router.get("/cases", authMiddleware, requireAttorney, getAttorneyCases);

// Get specific case details (accessible to both attorneys and jurors)
router.get("/cases/:caseId", authMiddleware, async (req, res) => {
  try {
    const { caseId } = req.params;
    const Case = require("../models/Case");

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // If user is a juror, verify the case is available to them
    if (req.user.type === "juror") {
      // Check if case is approved and in war room state
      if (
        caseData.AdminApprovalStatus !== "approved" ||
        caseData.AttorneyStatus !== "war_room"
      ) {
        return res.status(403).json({
          success: false,
          message: "This case is not available for applications",
        });
      }
    }

    res.json({
      success: true,
      case: caseData,
    });
  } catch (error) {
    console.error("Get case details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch case details",
    });
  }
});

module.exports = router;
