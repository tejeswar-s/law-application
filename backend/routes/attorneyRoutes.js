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
        cases: [],
        upcomingEvents: [],
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

// Get applications for a specific case
router.get("/cases/:caseId/applications", async (req, res) => {
  try {
    const { caseId } = req.params;
    const attorneyId = req.user.id;
    const Case = require("../models/Case");
    const JurorApplication = require("../models/JurorApplication");

    // Verify attorney owns this case
    const caseData = await Case.findById(caseId);
    if (!caseData || caseData.AttorneyId !== attorneyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get all applications for this case with juror details
    const applications = await JurorApplication.getApplicationsByCase(caseId);

    res.json({
      success: true,
      applications: applications || [],
      summary: {
        total: applications.length,
        pending: applications.filter((app) => app.Status === "pending").length,
        approved: applications.filter((app) => app.Status === "approved")
          .length,
        rejected: applications.filter((app) => app.Status === "rejected")
          .length,
      },
    });
  } catch (error) {
    console.error("Get applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
});

// Approve or reject application
router.put("/applications/:applicationId/status", async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body; // "approved" or "rejected"
    const attorneyId = req.user.id;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'approved' or 'rejected'",
      });
    }

    const JurorApplication = require("../models/JurorApplication");
    const Case = require("../models/Case");
    const Notification = require("../models/Notification");

    // Get application details
    const application = await JurorApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Verify attorney owns the case
    const caseData = await Case.findById(application.CaseId);
    if (!caseData || caseData.AttorneyId !== attorneyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Update application status
    await JurorApplication.updateApplicationStatus(
      applicationId,
      status,
      attorneyId
    );

    // Create notification for juror
    const notificationMessage =
      status === "approved"
        ? `Congratulations! You have been selected for the case "${caseData.CaseTitle}".`
        : `Your application for the case "${caseData.CaseTitle}" was not selected at this time.`;

    await Notification.createNotification({
      userId: application.JurorId,
      userType: "juror",
      caseId: application.CaseId,
      type:
        status === "approved" ? "APPLICATION_APPROVED" : "APPLICATION_REJECTED",
      title:
        status === "approved"
          ? "Application Approved"
          : "Application Not Selected",
      message: notificationMessage,
    });

    res.json({
      success: true,
      message: `Application ${status} successfully`,
    });
  } catch (error) {
    console.error("Update application status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update application status",
    });
  }
});

module.exports = router;
