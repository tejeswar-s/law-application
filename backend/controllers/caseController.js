// =============================================
// caseController.js - Complete Case Management
// =============================================

const Case = require("../models/Case");
const JurorApplication = require("../models/JurorApplication");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const Verdict = require("../models/Verdict");
const { poolPromise } = require("../config/db");

// Standard Part 1 questions (hardcoded for all cases)
const VOIR_DIRE_PART_1 = [
  "Do you know or recognize any of the parties involved in this case?",
  "Have you or a close family member ever had a dispute similar to the one in this case?",
  "Do you have any personal or financial interest in the outcome of this case?",
  "Do you have any bias, either for or against one of the parties, that could affect your ability to decide this case fairly?",
  "Is there any reason—personal, emotional, or otherwise—that would prevent you from being fair and impartial in this case?",
  "Do you have any health, time, or other personal issues that would prevent you from fully attending and completing your role as a juror in this case?",
  "Do you believe you can listen to all the evidence presented and base your decision solely on the facts and the law, regardless of personal feelings?",
];

/**
 * Create new case (Attorney submits case)
 */
async function createCase(req, res) {
  try {
    const attorneyId = req.user.id;
    const { voirDire2Questions, ...restOfBody } = req.body;

    console.log("=== CREATE CASE DEBUG ===");
    console.log("voirDire2Questions received:", voirDire2Questions);
    console.log("Type:", typeof voirDire2Questions);
    console.log("Is Array:", Array.isArray(voirDire2Questions));

    const caseData = {
      ...restOfBody,
      attorneyId,
      voirDire1Questions: VOIR_DIRE_PART_1,
      voirDire2Questions: [],
    };

    // Validate required fields
    const requiredFields = [
      "caseType",
      "caseTier",
      "county",
      "caseTitle",
      "scheduledDate",
      "scheduledTime",
    ];
    const missingFields = requiredFields.filter((field) => !caseData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Create the case
    const caseId = await Case.createCase(caseData);
    console.log("Case created with ID:", caseId);

    // Insert Part 2 questions into WarRoomVoirDire table
    if (
      voirDire2Questions &&
      Array.isArray(voirDire2Questions) &&
      voirDire2Questions.length > 0
    ) {
      console.log(
        "Inserting",
        voirDire2Questions.length,
        "questions into WarRoomVoirDire"
      );
      const pool = await poolPromise;
      for (const question of voirDire2Questions) {
        if (question && question.trim()) {
          console.log("Inserting question:", question);
          await pool
            .request()
            .input("caseId", caseId)
            .input("question", question.trim())
            .input("response", "")
            .input("addedBy", attorneyId).query(`
              INSERT INTO WarRoomVoirDire (CaseId, Question, Response, AddedBy, AddedAt)
              VALUES (@caseId, @question, @response, @addedBy, GETUTCDATE())
            `);
        }
      }
      console.log("All questions inserted successfully");
    } else {
      console.log("No voir dire 2 questions to insert");
    }

    // Create event for case creation
    await Event.createEvent({
      caseId,
      eventType: Event.EVENT_TYPES.CASE_CREATED,
      description: `Case "${caseData.caseTitle}" created and submitted for admin approval`,
      triggeredBy: attorneyId,
      userType: "attorney",
      metadata: { caseType: caseData.caseType, county: caseData.county },
    });

    res.json({
      success: true,
      message: "Case created successfully and submitted for admin approval",
      caseId,
      status: Case.ATTORNEY_CASE_STATES.PENDING_ADMIN_APPROVAL,
    });
  } catch (error) {
    console.error("Create case error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create case",
      error: error.message,
    });
  }
}

// ... rest of the file stays exactly the same ...
// (All other functions: getAttorneyCases, getCaseDetails, transitionCaseState, etc. remain unchanged)

/**
 * Get cases for attorney dashboard with filtering
 * UPDATED: Transform data to match frontend expectations
 */
async function getAttorneyCases(req, res) {
  try {
    const attorneyId = req.user.id;
    const { status } = req.query;

    const cases = await Case.getCasesByAttorney(attorneyId, status);

    // Transform to match frontend expectations (flat array format)
    const transformedCases = cases.map((c) => ({
      Id: c.CaseId,
      PlaintiffGroups: c.PlaintiffGroups,
      DefendantGroups: c.DefendantGroups,
      ScheduledDate: c.ScheduledDate,
      ScheduledTime: c.ScheduledTime,
      attorneyEmail: req.user.email,
      CaseTitle: c.CaseTitle,
      AttorneyStatus: c.AttorneyStatus,
      AdminApprovalStatus: c.AdminApprovalStatus,
    }));

    res.json(transformedCases);
  } catch (error) {
    console.error("Get attorney cases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve cases",
    });
  }
}

/**
 * Get single case details for attorney
 */
async function getCaseDetails(req, res) {
  try {
    const { caseId } = req.params;
    const attorneyId = req.user.id;

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Verify attorney owns this case
    if (caseData.AttorneyId !== attorneyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get related data
    const applications = await JurorApplication.getApplicationsByCase(caseId);
    const events = await Event.getEventsByCase(caseId);

    // Get verdicts if case is in final stage
    let verdicts = [];
    let verdictSummary = null;
    if (caseData.AttorneyStatus === "view_details") {
      verdicts = await Verdict.getVerdictsByCase(caseId, true);
      verdictSummary = await Verdict.getVerdictSummary(caseId);
    }

    res.json({
      success: true,
      case: caseData,
      applications,
      events,
      verdicts,
      verdictSummary,
      canTransitionToTrial:
        applications.filter((app) => app.Status === "approved").length >=
        caseData.RequiredJurors,
    });
  } catch (error) {
    console.error("Get case details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve case details",
    });
  }
}

/**
 * Transition case to next state (Attorney actions)
 */
async function transitionCaseState(req, res) {
  try {
    const { caseId } = req.params;
    const { newStatus } = req.body;
    const attorneyId = req.user.id;

    // Get case data first
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Verify attorney owns this case
    if (caseData.AttorneyId !== attorneyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate transition
    const validation = await Case.validateCaseStateTransition(
      caseId,
      newStatus
    );
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    // Update case status
    await Case.updateCaseStatus(caseId, { attorneyStatus: newStatus });

    // Create event
    await Event.createEvent({
      caseId,
      eventType: getEventTypeForTransition(newStatus),
      description: `Case transitioned to ${newStatus}`,
      triggeredBy: attorneyId,
      userType: "attorney",
    });

    // Handle specific transitions
    if (newStatus === Case.ATTORNEY_CASE_STATES.JOIN_TRIAL) {
      // Notify approved jurors that trial is starting
      const approvedJurors = await JurorApplication.getApprovedJurorsForCase(
        caseId
      );
      for (const juror of approvedJurors) {
        await Notification.createNotification({
          userId: juror.JurorId,
          userType: "juror",
          caseId,
          type: Notification.NOTIFICATION_TYPES.TRIAL_STARTING,
          title: "Trial Starting Soon",
          message: `The trial for case "${caseData.CaseTitle}" is ready to begin.`,
        });
      }
    } else if (newStatus === Case.ATTORNEY_CASE_STATES.VIEW_DETAILS) {
      // Notify approved jurors to submit verdicts
      const approvedJurors = await JurorApplication.getApprovedJurorsForCase(
        caseId
      );
      for (const juror of approvedJurors) {
        await Notification.createNotification({
          userId: juror.JurorId,
          userType: "juror",
          caseId,
          type: Notification.NOTIFICATION_TYPES.VERDICT_NEEDED,
          title: "Verdict Needed",
          message: `Please submit your verdict for case "${caseData.CaseTitle}".`,
        });
      }
    }

    res.json({
      success: true,
      message: `Case status updated to ${newStatus}`,
      newStatus,
    });
  } catch (error) {
    console.error("Transition case state error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update case status",
    });
  }
}

/**
 * Get available cases for juror job board
 */
async function getJobBoard(req, res) {
  try {
    const jurorId = req.user.id;
    const juror = req.user;

    const availableCases = await Case.getAvailableCasesForJurors(juror.county);

    // Filter out cases juror already applied to
    const casesWithApplicationStatus = [];
    for (const caseItem of availableCases) {
      const hasApplied = await JurorApplication.hasJurorAppliedToCase(
        jurorId,
        caseItem.CaseId
      );
      if (!hasApplied) {
        casesWithApplicationStatus.push({
          ...caseItem,
          canApply: true,
        });
      }
    }

    res.json({
      success: true,
      availableCases: casesWithApplicationStatus,
    });
  } catch (error) {
    console.error("Get job board error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve available cases",
    });
  }
}

/**
 * Get case details for juror (limited info for security)
 */
async function getJurorCaseDetails(req, res) {
  try {
    const { caseId } = req.params;
    const jurorId = req.user.id;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    // Check if juror has applied or is approved for this case
    const hasApplied = await JurorApplication.hasJurorAppliedToCase(
      jurorId,
      caseId
    );
    if (!hasApplied) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Return limited case info (no sensitive documents, etc.)
    res.json({
      success: true,
      case: {
        CaseId: caseData.CaseId,
        CaseTitle: caseData.CaseTitle,
        CaseDescription: caseData.CaseDescription,
        ScheduledDate: caseData.ScheduledDate,
        ScheduledTime: caseData.ScheduledTime,
        PaymentAmount: caseData.PaymentAmount,
        LawFirmName: caseData.LawFirmName,
        VoirDire1Questions: JSON.parse(caseData.VoirDire1Questions || "[]"),
        VoirDire2Questions: JSON.parse(caseData.VoirDire2Questions || "[]"),
      },
    });
  } catch (error) {
    console.error("Get juror case details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve case details",
    });
  }
}

/**
 * Apply to case (submit voir dire responses)
 */
async function applyToCase(req, res) {
  try {
    const { caseId } = req.params;
    const jurorId = req.user.id;
    const { voirDire1Responses, voirDire2Responses } = req.body;

    // Check if already applied
    const hasApplied = await JurorApplication.hasJurorAppliedToCase(
      jurorId,
      caseId
    );
    if (hasApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this case",
      });
    }

    // Validate that the case is accepting applications
    const caseData = await Case.findById(caseId);
    if (!caseData || caseData.AttorneyStatus !== "war_room") {
      return res.status(400).json({
        success: false,
        message: "This case is not currently accepting applications",
      });
    }

    // Create application
    const applicationId = await JurorApplication.createApplication({
      jurorId,
      caseId,
      voirDire1Responses,
      voirDire2Responses,
    });

    // Create event
    await Event.createEvent({
      caseId,
      eventType: Event.EVENT_TYPES.JUROR_APPLIED,
      description: `Juror applied to case`,
      triggeredBy: jurorId,
      userType: "juror",
    });

    // Notify attorney about new application
    await Notification.createNotification({
      userId: caseData.AttorneyId,
      userType: "attorney",
      caseId,
      type: Notification.NOTIFICATION_TYPES.APPLICATION_RECEIVED,
      title: "New Juror Application",
      message: `A new juror has applied to case "${caseData.CaseTitle}"`,
    });

    res.json({
      success: true,
      message:
        "Application submitted successfully. You will be notified of the decision.",
      applicationId,
    });
  } catch (error) {
    console.error("Apply to case error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application",
    });
  }
}

/**
 * Get juror's case assignments (dashboard)
 */
async function getJurorCases(req, res) {
  try {
    const jurorId = req.user.id;

    const applications = await JurorApplication.getApplicationsByJuror(jurorId);

    // Group by status for dashboard display
    const casesByStatus = {
      pending_approval: [],
      awaiting_trial: [],
      join_trial: [],
      give_verdicts: [],
    };

    applications.forEach((app) => {
      let status = "pending_approval"; // default

      if (app.Status === "approved") {
        switch (app.CaseStatus) {
          case "war_room":
            status = "awaiting_trial";
            break;
          case "join_trial":
            status = "join_trial";
            break;
          case "view_details":
            status = "give_verdicts";
            break;
        }
      }

      casesByStatus[status].push({
        ...app,
        jurorStatus: status,
      });
    });

    res.json({
      success: true,
      cases: casesByStatus,
    });
  } catch (error) {
    console.error("Get juror cases error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve case assignments",
    });
  }
}

/**
 * Submit verdict (Juror)
 */
async function submitVerdict(req, res) {
  try {
    const { caseId } = req.params;
    const jurorId = req.user.id;
    const verdictData = {
      caseId,
      jurorId,
      ...req.body,
    };

    // Validate juror is approved for this case
    const applications = await JurorApplication.getApplicationsByCase(caseId);
    const jurorApp = applications.find(
      (app) => app.JurorId === jurorId && app.Status === "approved"
    );

    if (!jurorApp) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to submit a verdict for this case",
      });
    }

    // Check if verdict already submitted
    const hasSubmitted = await Verdict.hasJurorSubmittedVerdict(
      jurorId,
      caseId
    );
    if (hasSubmitted) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted your verdict for this case",
      });
    }

    // Validate required fields
    if (!verdictData.decision) {
      return res.status(400).json({
        success: false,
        message: "Verdict decision is required",
      });
    }

    // Submit verdict
    const verdictId = await Verdict.submitVerdict(verdictData);

    // Create event
    await Event.createEvent({
      caseId,
      eventType: Event.EVENT_TYPES.VERDICT_SUBMITTED,
      description: `Juror submitted verdict: ${verdictData.decision}`,
      triggeredBy: jurorId,
      userType: "juror",
      metadata: { verdictId, decision: verdictData.decision },
    });

    // Get case details for notification
    const caseData = await Case.findById(caseId);

    // Notify attorney of new verdict
    await Notification.createNotification({
      userId: caseData.AttorneyId,
      userType: "attorney",
      caseId,
      type: Notification.NOTIFICATION_TYPES.VERDICT_SUBMITTED,
      title: "New Verdict Submitted",
      message: `A juror has submitted their verdict for case "${caseData.CaseTitle}"`,
    });

    // Check if all verdicts are in
    const completionStatus = await Verdict.getVerdictCompletionStatus(caseId);

    if (completionStatus.IsComplete) {
      // All verdicts submitted - notify attorney case is complete
      await Notification.createNotification({
        userId: caseData.AttorneyId,
        userType: "attorney",
        caseId,
        type: Notification.NOTIFICATION_TYPES.CASE_COMPLETED,
        title: "All Verdicts Collected",
        message: `All jurors have submitted their verdicts for case "${caseData.CaseTitle}". You can now view the complete results.`,
      });
    }

    res.json({
      success: true,
      message: "Verdict submitted successfully",
      verdictId,
      allVerdictsReceived: completionStatus.IsComplete,
    });
  } catch (error) {
    console.error("Submit verdict error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit verdict",
    });
  }
}

/**
 * Get cases needing verdicts for juror
 */
async function getCasesNeedingVerdicts(req, res) {
  try {
    const jurorId = req.user.id;
    const cases = await Verdict.getCasesNeedingVerdicts(jurorId);

    res.json({
      success: true,
      cases,
      count: cases.length,
    });
  } catch (error) {
    console.error("Get cases needing verdicts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve cases needing verdicts",
    });
  }
}

/**
 * Get case events/timeline
 */
async function getCaseEvents(req, res) {
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

    const events = await Event.getEventsByCase(caseId);

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Get case events error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve case events",
    });
  }
}

// Helper function for event types
function getEventTypeForTransition(status) {
  switch (status) {
    case Case.ATTORNEY_CASE_STATES.JOIN_TRIAL:
      return Event.EVENT_TYPES.TRIAL_STARTED;
    case Case.ATTORNEY_CASE_STATES.VIEW_DETAILS:
      return Event.EVENT_TYPES.TRIAL_COMPLETED;
    default:
      return "status_change";
  }
}

module.exports = {
  // Case management
  createCase,
  getAttorneyCases,
  getCaseDetails,
  transitionCaseState,
  getCaseEvents,

  // Juror functions
  getJobBoard,
  getJurorCaseDetails,
  applyToCase,
  getJurorCases,
  submitVerdict,
  getCasesNeedingVerdicts,
};
