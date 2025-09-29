// =============================================
// adminController.js - Admin Case Management
// =============================================

const Case = require("../models/Case");
const JurorApplication = require("../models/JurorApplication");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const Attorney = require("../models/Attorney");
const Juror = require("../models/Juror");

/**
 * Get cases pending admin approval
 */
async function getCasesPendingApproval(req, res) {
  try {
    const pendingCases = await Case.getCasesPendingAdminApproval();

    res.json({
      success: true,
      pendingCases,
    });
  } catch (error) {
    console.error("Get pending cases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve pending cases",
    });
  }
}

/**
 * Approve or reject case
 */
async function reviewCaseApproval(req, res) {
  try {
    const { caseId } = req.params;
    const { decision, comments, rescheduleDate, rescheduleTime } = req.body;
    const adminId = req.user.id;

    // Validate decision
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be 'approved' or 'rejected'",
      });
    }

    // Get case data
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    let updateData = {
      adminApprovalStatus: decision,
      adminComments: comments,
    };

    // Handle rescheduling
    if (rescheduleDate && rescheduleTime) {
      updateData.scheduledDate = rescheduleDate;
      updateData.scheduledTime = rescheduleTime;
    }

    // Update case status
    await Case.updateCaseStatus(caseId, updateData);

    // Create event
    await Event.createEvent({
      caseId,
      eventType:
        decision === "approved"
          ? Event.EVENT_TYPES.ADMIN_APPROVED
          : Event.EVENT_TYPES.ADMIN_REJECTED,
      description: `Case ${decision} by admin${
        comments ? ": " + comments : ""
      }`,
      triggeredBy: adminId,
      userType: "admin",
    });

    // Notify attorney
    await Notification.createNotification({
      userId: caseData.AttorneyId,
      userType: "attorney",
      caseId,
      type:
        decision === "approved"
          ? Notification.NOTIFICATION_TYPES.CASE_APPROVED
          : Notification.NOTIFICATION_TYPES.CASE_REJECTED,
      title: `Case ${decision}`,
      message:
        decision === "approved"
          ? `Your case "${caseData.CaseTitle}" has been approved and is now open for juror applications.`
          : `Your case "${caseData.CaseTitle}" requires changes: ${comments}`,
    });

    res.json({
      success: true,
      message: `Case ${decision} successfully`,
      decision,
    });
  } catch (error) {
    console.error("Review case approval error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process case approval",
    });
  }
}

/**
 * Get all cases with filtering for admin dashboard
 */
async function getAllCases(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // For now, get all cases - can add pagination later
    const cases = await Case.getCasesByAttorney(null, status); // null gets all attorneys

    res.json({
      success: true,
      cases,
      totalCases: cases.length,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get all cases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve cases",
    });
  }
}

/**
 * Get case details for admin
 */
async function getCaseDetailsForAdmin(req, res) {
  try {
    const { caseId } = req.params;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Get all related data
    const applications = await JurorApplication.getApplicationsByCase(caseId);
    const events = await Event.getEventsByCase(caseId);

    res.json({
      success: true,
      case: caseData,
      applications,
      events,
      applicationStats: {
        total: applications.length,
        pending: applications.filter((app) => app.Status === "pending").length,
        approved: applications.filter((app) => app.Status === "approved")
          .length,
        rejected: applications.filter((app) => app.Status === "rejected")
          .length,
      },
    });
  } catch (error) {
    console.error("Get case details for admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve case details",
    });
  }
}

/**
 * Get attorneys pending verification
 */
async function getAttorneysPendingVerification(req, res) {
  try {
    const { attorneys } = await Attorney.getAllAttorneys(1, 100);
    const pendingVerification = attorneys.filter(
      (attorney) => !attorney.IsVerified
    );

    res.json({
      success: true,
      attorneys: pendingVerification,
    });
  } catch (error) {
    console.error("Get attorneys pending verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve attorneys pending verification",
    });
  }
}

/**
 * Verify attorney
 */
async function verifyAttorney(req, res) {
  try {
    const { attorneyId } = req.params;
    const { status = "verified", comments } = req.body;

    await Attorney.updateVerificationStatus(attorneyId, status);

    // Notify attorney
    await Notification.createNotification({
      userId: parseInt(attorneyId),
      userType: "attorney",
      type:
        status === "verified"
          ? "verification_approved"
          : "verification_rejected",
      title: `Account ${status}`,
      message:
        status === "verified"
          ? "Your attorney account has been verified. You can now access all platform features."
          : `Your account verification was rejected. ${
              comments || "Please contact support for more information."
            }`,
    });

    res.json({
      success: true,
      message: `Attorney ${status} successfully`,
    });
  } catch (error) {
    console.error("Verify attorney error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify attorney",
    });
  }
}

/**
 * Get jurors pending verification
 */
async function getJurorsPendingVerification(req, res) {
  try {
    const { jurors } = await Juror.getAllJurors(1, 100);
    const pendingVerification = jurors.filter((juror) => !juror.IsVerified);

    res.json({
      success: true,
      jurors: pendingVerification,
    });
  } catch (error) {
    console.error("Get jurors pending verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve jurors pending verification",
    });
  }
}

/**
 * Verify juror
 */
async function verifyJuror(req, res) {
  try {
    const { jurorId } = req.params;
    const { status = "verified", comments } = req.body;

    await Juror.updateVerificationStatus(jurorId, status);

    // Notify juror
    await Notification.createNotification({
      userId: parseInt(jurorId),
      userType: "juror",
      type:
        status === "verified"
          ? "verification_approved"
          : "verification_rejected",
      title: `Account ${status}`,
      message:
        status === "verified"
          ? "Your juror account has been verified. You can now apply to cases."
          : `Your account verification was rejected. ${
              comments || "Please contact support for more information."
            }`,
    });

    res.json({
      success: true,
      message: `Juror ${status} successfully`,
    });
  } catch (error) {
    console.error("Verify juror error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify juror",
    });
  }
}

/**
 * Get admin dashboard data
 */
async function getAdminDashboard(req, res) {
  try {
    // Get overview statistics
    const pendingCases = await Case.getCasesPendingAdminApproval();
    const { attorneys } = await Attorney.getAllAttorneys(1, 100);
    const { jurors } = await Juror.getAllJurors(1, 100);
    const recentEvents = await Event.getRecentEvents(10);

    const stats = {
      pendingCases: pendingCases.length,
      totalAttorneys: attorneys.length,
      verifiedAttorneys: attorneys.filter((a) => a.IsVerified).length,
      totalJurors: jurors.length,
      verifiedJurors: jurors.filter((j) => j.IsVerified).length,
      recentActivity: recentEvents.length,
    };

    res.json({
      success: true,
      stats,
      pendingCases: pendingCases.slice(0, 5), // Latest 5 for dashboard
      recentEvents: recentEvents.slice(0, 5), // Latest 5 for dashboard
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard data",
    });
  }
}

/**
 * Get system analytics
 */
async function getSystemAnalytics(req, res) {
  try {
    const { days = 30 } = req.query;

    const eventStats = await Event.getEventStatistics(days);
    const notificationStats = await Notification.getNotificationStatistics(
      days
    );

    res.json({
      success: true,
      analytics: {
        timeframe: `${days} days`,
        eventStatistics: eventStats,
        notificationStatistics: notificationStats,
      },
    });
  } catch (error) {
    console.error("Get system analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve analytics",
    });
  }
}

/**
 * Get admin schedule (placeholder for future scheduling feature)
 */
async function getAdminSchedule(req, res) {
  try {
    // For now, return a simple schedule - can be enhanced later
    const schedule = {
      today: [],
      upcoming: [],
      availability: "available",
    };

    res.json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error("Get admin schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve schedule",
    });
  }
}

/**
 * Update admin schedule (placeholder for future scheduling feature)
 */
async function updateSchedule(req, res) {
  try {
    // Placeholder for schedule updates
    res.json({
      success: true,
      message: "Schedule updated successfully",
    });
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update schedule",
    });
  }
}

module.exports = {
  // Case management
  getCasesPendingApproval,
  reviewCaseApproval,
  getAllCases,
  getCaseDetailsForAdmin,

  // User verification
  getAttorneysPendingVerification,
  verifyAttorney,
  getJurorsPendingVerification,
  verifyJuror,

  // Dashboard and analytics
  getAdminDashboard,
  getSystemAnalytics,

  // Schedule management (placeholder)
  getAdminSchedule,
  updateSchedule,
};
