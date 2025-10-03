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
    const JurorApplication = require("../models/JurorApplication");

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // If user is an attorney, verify they own this case
    if (req.user.type === "attorney" && caseData.AttorneyId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // If user is a juror, verify they have access
    if (req.user.type === "juror") {
      // Check if juror has an application for this case
      const application = await JurorApplication.findByJurorAndCase(
        req.user.id,
        caseId
      );

      // If no application exists, only allow access to cases in war_room state (for applying)
      if (!application) {
        if (
          caseData.AdminApprovalStatus !== "approved" ||
          caseData.AttorneyStatus !== "war_room"
        ) {
          return res.status(403).json({
            success: false,
            message: "This case is not available",
          });
        }
      } else {
        // If application exists but not approved, deny access
        if (application.Status !== "approved") {
          return res.status(403).json({
            success: false,
            message: "You are not approved for this case",
          });
        }
        // If approved, allow access regardless of case status
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
