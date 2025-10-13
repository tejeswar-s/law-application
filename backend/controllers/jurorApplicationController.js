// =============================================
// jurorApplicationController.js - Juror Application Management
// =============================================

const JurorApplication = require("../models/JurorApplication");
const Case = require("../models/Case");
const Event = require("../models/Event");
const Notification = require("../models/Notification");

/**
 * Get juror applications for a specific case (Attorney War Room)
 */
async function getApplicationsForCase(req, res) {
  try {
    const { caseId } = req.params;
    const attorneyId = req.user.id;
    const { status } = req.query; // 'pending', 'approved', 'rejected', or all

    // Verify attorney owns this case
    const caseData = await Case.findById(caseId);
    if (!caseData || caseData.AttorneyId !== attorneyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const applications = await JurorApplication.getApplicationsByCase(
      caseId,
      status
    );

    // Parse JSON responses for easier frontend handling
    const applicationsWithParsedResponses = applications.map((app) => ({
      ...app,
      VoirDire1Responses: JSON.parse(app.VoirDire1Responses || "[]"),
      VoirDire2Responses: JSON.parse(app.VoirDire2Responses || "[]"),
    }));

    res.json({
      success: true,
      applications: applicationsWithParsedResponses,
      totalCount: applications.length,
      pendingCount: applications.filter((app) => app.Status === "pending")
        .length,
      approvedCount: applications.filter((app) => app.Status === "approved")
        .length,
      rejectedCount: applications.filter((app) => app.Status === "rejected")
        .length,
    });
  } catch (error) {
    console.error("Get applications for case error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve applications",
    });
  }
}

/**
 * Review juror application (Approve/Reject)
 */
async function reviewApplication(req, res) {
  try {
    const { caseId, applicationId } = req.params;
    const { decision, comments } = req.body; // 'approved' or 'rejected'
    const attorneyId = req.user.id;

    // Validate decision
    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be either "approved" or "rejected"',
      });
    }

    // Verify attorney owns this case
    const caseData = await Case.findById(caseId);
    if (!caseData || caseData.AttorneyId !== attorneyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get application details
    const application = await JurorApplication.findById(applicationId);
    if (!application || application.CaseId != caseId) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if we already have enough approved jurors
    if (decision === "approved") {
      const currentApprovedCount = await Case.getApprovedJurorsCount(caseId);
      if (currentApprovedCount >= caseData.RequiredJurors) {
        return res.status(400).json({
          success: false,
          message: `Case already has the required ${caseData.RequiredJurors} jurors`,
        });
      }
    }

    // Update application status
    await JurorApplication.updateApplicationStatus(
      applicationId,
      decision,
      attorneyId,
      comments
    );

    // Create event
    await Event.createEvent({
      caseId,
      eventType:
        decision === "approved"
          ? Event.EVENT_TYPES.JUROR_APPROVED
          : Event.EVENT_TYPES.JUROR_REJECTED,
      description: `Juror application ${decision}${
        comments ? ": " + comments : ""
      }`,
      triggeredBy: attorneyId,
      userType: "attorney",
      metadata: { jurorId: application.JurorId, applicationId },
    });

    // Notify juror of decision
    await Notification.createNotification({
      userId: application.JurorId,
      userType: "juror",
      caseId,
      type:
        decision === "approved"
          ? Notification.NOTIFICATION_TYPES.APPLICATION_APPROVED
          : Notification.NOTIFICATION_TYPES.APPLICATION_REJECTED,
      title: `Application ${decision === "approved" ? "Approved" : "Rejected"}`,
      message:
        decision === "approved"
          ? `Congratulations! You've been selected for the case "${caseData.CaseTitle}".`
          : `Your application for case "${
              caseData.CaseTitle
            }" was not selected.${comments ? " Reason: " + comments : ""}`,
    });

    // Check if case now has enough jurors to proceed
    const newApprovedCount = await Case.getApprovedJurorsCount(caseId);
    const canProceedToTrial = newApprovedCount >= caseData.RequiredJurors;

    res.json({
      success: true,
      message: `Application ${decision} successfully`,
      decision,
      canProceedToTrial,
      approvedJurorsCount: newApprovedCount,
      requiredJurors: caseData.RequiredJurors,
    });
  } catch (error) {
    console.error("Review application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to review application",
    });
  }
}

/**
 * Get voir dire questions for case application
 */
async function getVoirDireQuestions(req, res) {
  try {
    const { caseId } = req.params;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Parse voir dire questions
    const voirDire1Questions = JSON.parse(caseData.VoirDire1Questions || "[]");
    const voirDire2Questions = JSON.parse(caseData.VoirDire2Questions || "[]");

    res.json({
      success: true,
      voirDire1Questions,
      voirDire2Questions,
      caseTitle: caseData.CaseTitle,
    });
  } catch (error) {
    console.error("Get voir dire questions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve questions",
    });
  }
}

/**
 * Bulk approve/reject applications
 */
async function bulkReviewApplications(req, res) {
  try {
    const { caseId } = req.params;
    const { applicationIds, decision, comments } = req.body;
    const attorneyId = req.user.id;

    // Validate inputs
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Application IDs array is required",
      });
    }

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be either "approved" or "rejected"',
      });
    }

    // Verify attorney owns this case
    const caseData = await Case.findById(caseId);
    if (!caseData || caseData.AttorneyId !== attorneyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const results = {
      processed: 0,
      errors: [],
    };

    // Process each application
    for (const applicationId of applicationIds) {
      try {
        const application = await JurorApplication.findById(applicationId);
        if (!application || application.CaseId != caseId) {
          results.errors.push(`Application ${applicationId} not found`);
          continue;
        }

        // Check juror limits for approvals
        if (decision === "approved") {
          const currentApprovedCount = await Case.getApprovedJurorsCount(
            caseId
          );
          if (currentApprovedCount >= caseData.RequiredJurors) {
            results.errors.push(`Case already has enough jurors`);
            break;
          }
        }

        // Update application
        await JurorApplication.updateApplicationStatus(
          applicationId,
          decision,
          attorneyId,
          comments
        );

        // Create event
        await Event.createEvent({
          caseId,
          eventType:
            decision === "approved"
              ? Event.EVENT_TYPES.JUROR_APPROVED
              : Event.EVENT_TYPES.JUROR_REJECTED,
          description: `Juror application ${decision} (bulk action)${
            comments ? ": " + comments : ""
          }`,
          triggeredBy: attorneyId,
          userType: "attorney",
          metadata: {
            jurorId: application.JurorId,
            applicationId,
            bulkAction: true,
          },
        });

        // Notify juror
        await Notification.createNotification({
          userId: application.JurorId,
          userType: "juror",
          caseId,
          type:
            decision === "approved"
              ? Notification.NOTIFICATION_TYPES.APPLICATION_APPROVED
              : Notification.NOTIFICATION_TYPES.APPLICATION_REJECTED,
          title: `Application ${
            decision === "approved" ? "Approved" : "Rejected"
          }`,
          message:
            decision === "approved"
              ? `Congratulations! You've been selected for the case "${caseData.CaseTitle}".`
              : `Your application for case "${
                  caseData.CaseTitle
                }" was not selected.${comments ? " Reason: " + comments : ""}`,
        });

        results.processed++;
      } catch (appError) {
        console.error(
          `Error processing application ${applicationId}:`,
          appError
        );
        results.errors.push(`Failed to process application ${applicationId}`);
      }
    }

    res.json({
      success: true,
      message: `Bulk ${decision} completed`,
      results,
    });
  } catch (error) {
    console.error("Bulk review applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process bulk review",
    });
  }
}

/**
 * Get application statistics for a case
 */
async function getApplicationStatistics(req, res) {
  try {
    const { caseId } = req.params;
    const attorneyId = req.user.id;

    // Verify attorney owns this case
    const caseData = await Case.findById(caseId);
    if (!caseData || caseData.AttorneyId !== attorneyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const applications = await JurorApplication.getApplicationsByCase(caseId);

    const statistics = {
      totalApplications: applications.length,
      pendingApplications: applications.filter(
        (app) => app.Status === "pending"
      ).length,
      approvedApplications: applications.filter(
        (app) => app.Status === "approved"
      ).length,
      rejectedApplications: applications.filter(
        (app) => app.Status === "rejected"
      ).length,
      requiredJurors: caseData.RequiredJurors,
      canProceedToTrial:
        applications.filter((app) => app.Status === "approved").length >=
        caseData.RequiredJurors,
      applicationsByCounty: {},
    };

    // Group applications by county
    applications.forEach((app) => {
      const county = app.County || "Unknown";
      if (!statistics.applicationsByCounty[county]) {
        statistics.applicationsByCounty[county] = 0;
      }
      statistics.applicationsByCounty[county]++;
    });

    res.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error("Get application statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve application statistics",
    });
  }
}

/**
 * Get application details by ID
 */
async function getApplicationDetails(req, res) {
  try {
    const { applicationId } = req.params;
    const attorneyId = req.user.id;

    const application = await JurorApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Verify attorney owns the case
    if (application.AttorneyId !== attorneyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Parse responses
    const applicationWithParsedResponses = {
      ...application,
      VoirDire1Responses: JSON.parse(application.VoirDire1Responses || "[]"),
      VoirDire2Responses: JSON.parse(application.VoirDire2Responses || "[]"),
    };

    res.json({
      success: true,
      application: applicationWithParsedResponses,
    });
  } catch (error) {
    console.error("Get application details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve application details",
    });
  }
}

module.exports = {
  getApplicationsForCase,
  reviewApplication,
  getVoirDireQuestions,
  bulkReviewApplications,
  getApplicationStatistics,
  getApplicationDetails,
};
