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

const trialRoutes = require("./trialRoutes");
const { createTrialMeeting } = trialRoutes;
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

// ============================================
// SUBMIT WAR ROOM - ENHANCED VERSION
// ============================================
router.post("/cases/:caseId/submit-war-room", async (req, res) => {
  try {
    const { caseId } = req.params;
    const attorneyId = req.user.id;

    const Case = require("../models/Case");
    const JurorApplication = require("../models/JurorApplication");
    const Notification = require("../models/Notification");
    const Event = require("../models/Event");
    const { createTrialMeeting } = require("./trialRoutes");

    // Get case data
    const caseData = await Case.findById(caseId);
    if (!caseData || caseData.AttorneyId !== attorneyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Verify enough jurors are approved
    const approvedJurors = await JurorApplication.getApprovedJurorsForCase(
      caseId
    );
    const requiredJurors = caseData.RequiredJurors || 2;

    if (approvedJurors.length < requiredJurors) {
      return res.status(400).json({
        success: false,
        message: `Need at least ${requiredJurors} approved jurors to submit war room. Currently have ${approvedJurors.length}.`,
      });
    }

    // Transition to join_trial state
    await Case.updateCaseStatus(caseId, {
      attorneyStatus: Case.ATTORNEY_CASE_STATES.JOIN_TRIAL,
    });

    // CREATE TRIAL MEETING
    await createTrialMeeting(caseId);

    // Create event
    await Event.createEvent({
      caseId,
      eventType: Event.EVENT_TYPES.TRIAL_STARTED,
      description: "War room submitted, trial is ready to begin",
      triggeredBy: attorneyId,
      userType: "attorney",
    });

    // Format trial date and time for notifications
    const trialDate = new Date(caseData.ScheduledDate).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );

    // Notify all approved jurors
    for (const juror of approvedJurors) {
      await Notification.createNotification({
        userId: juror.JurorId,
        userType: "juror",
        caseId,
        type: Notification.NOTIFICATION_TYPES.TRIAL_STARTING,
        title: "Trial Ready to Begin",
        message: `The trial for "${caseData.CaseTitle}" is ready. Scheduled for ${trialDate} at ${caseData.ScheduledTime}. You can now join the trial room.`,
      });
    }

    // NOTIFY ADMIN - ENHANCED WITH FULL DETAILS
    await Notification.createNotification({
      userId: 1, // Admin ID - adjust if your admin has a different ID
      userType: "admin",
      caseId,
      type: "TRIAL_READY",
      title: "Trial Ready - Moderator Access Available",
      message: `War room submitted for "${caseData.CaseTitle}". Trial scheduled for ${trialDate} at ${caseData.ScheduledTime}. ${approvedJurors.length} jurors approved. You can join as trial moderator.`,
    });

    res.json({
      success: true,
      message: "War room submitted successfully. Trial is now ready to begin.",
      newStatus: Case.ATTORNEY_CASE_STATES.JOIN_TRIAL,
    });
  } catch (error) {
    console.error("Submit war room error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit war room",
    });
  }
});

// ============================================
// RESCHEDULE MANAGEMENT ROUTES
// ============================================

// Get pending reschedule requests for attorney
router.get("/reschedule-requests", async (req, res) => {
  try {
    const attorneyId = req.user.id;
    const CaseReschedule = require("../models/CaseReschedule");

    const rescheduleRequests =
      await CaseReschedule.getPendingReschedulesByAttorney(attorneyId);

    res.json({
      success: true,
      rescheduleRequests,
    });
  } catch (error) {
    console.error("Get reschedule requests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve reschedule requests",
    });
  }
});

// Accept a suggested time slot
router.post("/reschedule-requests/:requestId/accept", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { selectedSlot } = req.body; // {date, time}
    const attorneyId = req.user.id;

    if (!selectedSlot || !selectedSlot.date || !selectedSlot.time) {
      return res.status(400).json({
        success: false,
        message: "Selected slot with date and time is required",
      });
    }

    const CaseReschedule = require("../models/CaseReschedule");
    const Case = require("../models/Case");
    const AdminCalendar = require("../models/AdminCalendar");
    const Notification = require("../models/Notification");

    // Get reschedule request
    const request = await CaseReschedule.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Reschedule request not found",
      });
    }

    // Verify attorney owns this case
    const caseData = await Case.findById(request.CaseId);
    if (!caseData || caseData.AttorneyId !== attorneyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if selected slot is still available
    const isAvailable = await AdminCalendar.isSlotAvailable(
      selectedSlot.date,
      selectedSlot.time
    );
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Selected time slot is no longer available",
      });
    }

    // Update reschedule request
    await CaseReschedule.acceptSuggestedSlot(requestId, selectedSlot);

    // Update case with new schedule and approve it
    const { poolPromise } = require("../config/db");
    const pool = await poolPromise;

    await pool
      .request()
      .input("caseId", request.CaseId)
      .input("scheduledDate", selectedSlot.date)
      .input("scheduledTime", selectedSlot.time).query(`
        UPDATE dbo.Cases
        SET 
          ScheduledDate = @scheduledDate,
          ScheduledTime = @scheduledTime,
          AdminApprovalStatus = 'approved',
          AttorneyStatus = 'war_room',
          ApprovedAt = GETUTCDATE(),
          UpdatedAt = GETUTCDATE()
        WHERE CaseId = @caseId
      `);

    // Block the new time slot in admin calendar
    await AdminCalendar.blockSlotForCase(
      request.CaseId,
      selectedSlot.date,
      selectedSlot.time
    );

    // Notify admin that attorney accepted the reschedule
    await Notification.createNotification({
      userId: 1, // Admin ID
      userType: "admin",
      caseId: request.CaseId,
      type: "reschedule_accepted",
      title: "Attorney Accepted Reschedule",
      message: `Attorney accepted new time slot for case "${caseData.CaseTitle}": ${selectedSlot.date} at ${selectedSlot.time}`,
    });

    // Delete the reschedule request
    await CaseReschedule.deleteRescheduleRequest(requestId);

    res.json({
      success: true,
      message: "Time slot accepted and case approved successfully",
    });
  } catch (error) {
    console.error("Accept reschedule error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept reschedule",
    });
  }
});

// Request different time slots
router.post(
  "/reschedule-requests/:requestId/request-different",
  async (req, res) => {
    try {
      const { requestId } = req.params;
      const { message } = req.body;
      const attorneyId = req.user.id;

      const CaseReschedule = require("../models/CaseReschedule");
      const Case = require("../models/Case");
      const Notification = require("../models/Notification");

      // Get reschedule request
      const request = await CaseReschedule.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Reschedule request not found",
        });
      }

      // Verify attorney owns this case
      const caseData = await Case.findById(request.CaseId);
      if (!caseData || caseData.AttorneyId !== attorneyId) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Update reschedule request
      await CaseReschedule.requestDifferentSlots(
        requestId,
        message || "Attorney requested different time slots"
      );

      // Notify admin
      await Notification.createNotification({
        userId: 1, // Admin ID
        userType: "admin",
        caseId: request.CaseId,
        type: "reschedule_request_different",
        title: "Attorney Requests Different Times",
        message: `Attorney requests different time slots for case "${
          caseData.CaseTitle
        }". Message: ${message || "No message provided"}`,
      });

      res.json({
        success: true,
        message: "Request sent to admin successfully",
      });
    } catch (error) {
      console.error("Request different slots error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to request different slots",
      });
    }
  }
);

module.exports = router;
