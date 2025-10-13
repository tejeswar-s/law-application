const express = require("express");
const {
  CommunicationIdentityClient,
} = require("@azure/communication-identity");
const { authMiddleware } = require("../middleware/authMiddleware");
const TrialMeeting = require("../models/TrialMeeting");
const Case = require("../models/Case");
const { pool } = require("../config/db");
const JurorApplication = require("../models/JurorApplication");
const Notification = require("../models/Notification");

const router = express.Router();

// Initialize ACS client
const connectionString = process.env.ACS_CONNECTION_STRING;
const identityClient = new CommunicationIdentityClient(connectionString);
const {
  createRoom,
  addParticipantToRoom,
} = require("../services/acsRoomsService"); // ADD THIS LINE

// All routes require authentication
router.use(authMiddleware);
/**
 * Create meeting room when war room is submitted
 * Called from attorneyRoutes.js submit-war-room endpoint
 */

async function createTrialMeeting(caseId) {
  try {
    console.log("=== Creating trial meeting for case:", caseId);

    const existingMeeting = await TrialMeeting.getMeetingByCaseId(caseId);
    if (existingMeeting) {
      console.log(
        "Meeting already exists, returning existing:",
        existingMeeting.MeetingId
      );
      return existingMeeting;
    }

    console.log("No existing meeting, creating new ACS room...");

    const caseData = await Case.findById(caseId);

    // Parse dates more safely
    // Replace the date parsing block with this:
    let scheduledDateTime;
    try {
      // ScheduledDate is already a Date object from SQL
      const dateObj = new Date(caseData.ScheduledDate);
      const timeStr = caseData.ScheduledTime.replace(/\./g, ":");

      // Extract just the date part and combine with time
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");

      scheduledDateTime = new Date();

      if (isNaN(scheduledDateTime.getTime())) {
        scheduledDateTime = new Date(Date.now() + 60 * 60 * 1000);
      }
    } catch (err) {
      console.error("Error parsing scheduled date:", err);
      scheduledDateTime = new Date(Date.now() + 60 * 60 * 1000);
    }

    const validUntil = new Date(
      scheduledDateTime.getTime() + 8 * 60 * 60 * 1000
    ); // 8 hours later

    console.log("Scheduled time:", scheduledDateTime.toISOString());
    console.log("Valid until:", validUntil.toISOString());

    const room = await createRoom(
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ); // Valid NOW for 30 days
    console.log("ACS Room created successfully:", room.id);

    const threadId = `trial-case-${caseId}-${Date.now()}`;
    const meetingId = await TrialMeeting.createMeeting(
      caseId,
      threadId,
      room.id
    );

    console.log(
      `Trial meeting stored in DB, Meeting ID: ${meetingId}, Room ID: ${room.id}`
    );

    return {
      MeetingId: meetingId,
      CaseId: caseId,
      ThreadId: threadId,
      RoomId: room.id,
      Status: "created",
    };
  } catch (error) {
    console.error("Error creating trial meeting:", error);
    throw error;
  }
}
/**
 * GET /api/trial/meeting/:caseId
 * Get meeting details for a case
 */
router.get("/meeting/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userType = req.user.type;

    console.log("DEBUG - req.user:", req.user);
    console.log("DEBUG - userType:", userType);

    // Verify user has access to this case
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Check authorization
    if (userType === "attorney" && caseData.AttorneyId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (userType === "juror") {
      const application = await JurorApplication.findByJurorAndCase(
        userId,
        caseId
      );
      if (!application || application.Status !== "approved") {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Admin has access to all meetings

    const meeting = await TrialMeeting.getMeetingByCaseId(caseId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({
      success: true,
      meeting: {
        meetingId: meeting.MeetingId,
        threadId: meeting.ThreadId,
        status: meeting.Status,
        createdAt: meeting.CreatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting meeting:", error);
    res.status(500).json({ message: "Failed to get meeting details" });
  }
});

/**
 * POST /api/trial/join/:caseId
 * Generate ACS token for user to join trial
 */
router.post("/join/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userType = req.user.type;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Verify authorization
    let displayName = "";
    let participantRole = "Attendee";

    if (userType === "attorney") {
      if (caseData.AttorneyId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      displayName = `${req.user.firstName} ${req.user.lastName} (Attorney)`;
      participantRole = "Presenter"; // Attorney gets presenter role
    } else if (userType === "juror") {
      const application = await JurorApplication.findByJurorAndCase(
        userId,
        caseId
      );
      if (!application || application.Status !== "approved") {
        return res
          .status(403)
          .json({ message: "Access denied - not approved for this case" });
      }
      displayName = `${req.user.name} (Juror)`;
    } else if (userType === "admin") {
      displayName = "Court Administrator";
      participantRole = "Presenter"; // Admin gets presenter role
    } else {
      return res.status(403).json({ message: "Invalid user type" });
    }

    let meeting = await TrialMeeting.getMeetingByCaseId(caseId);
    if (!meeting) {
      return res
        .status(404)
        .json({ message: "Meeting not found. Please contact administrator." });
    }

    // Create ACS user identity and token
    const identityResponse = await identityClient.createUser();
    const acsUserId = identityResponse.communicationUserId;

    // Add participant to ACS Room
    const { addParticipantToRoom } = require("../services/acsRoomsService");
    await addParticipantToRoom(meeting.RoomId, acsUserId, participantRole);

    // Generate token with VoIP scope
    const tokenResponse = await identityClient.getToken(identityResponse, [
      "voip",
    ]);

    // Track participant in database
    await TrialMeeting.addParticipant(
      meeting.MeetingId,
      userId,
      userType,
      displayName,
      acsUserId
    );

    // Update meeting status to active if first join
    if (meeting.Status === "created") {
      await TrialMeeting.updateMeetingStatus(meeting.MeetingId, "active");
    }

    res.json({
      success: true,
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn,
      userId: acsUserId,
      displayName: displayName,
      roomId: meeting.RoomId, // Return Room ID instead of thread ID
    });
  } catch (error) {
    console.error("Error joining trial:", error);
    res.status(500).json({ message: "Failed to join trial" });
  }
});

/**
 * GET /api/trial/participants/:caseId
 * Get list of participants in a trial
 */
router.get("/participants/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;

    const meeting = await TrialMeeting.getMeetingByCaseId(caseId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const participants = await TrialMeeting.getParticipants(meeting.MeetingId);

    res.json({
      success: true,
      participants: participants,
    });
  } catch (error) {
    console.error("Error getting participants:", error);
    res.status(500).json({ message: "Failed to get participants" });
  }
});
// Get approved jurors for a trial (for attorney to see who can join)
router.get("/case/:caseId/jurors", authMiddleware, async (req, res) => {
  try {
    const { caseId } = req.params;

    const jurors = await pool.query(
      `SELECT j.id, j.name, j.email, ja.status 
       FROM juror_applications ja
       JOIN jurors j ON ja.juror_id = j.id
       WHERE ja.case_id = $1 AND ja.status = 'approved'`,
      [caseId]
    );

    res.json({ jurors: jurors.rows });
  } catch (error) {
    console.error("Error fetching jurors:", error);
    res.status(500).json({ error: "Failed to fetch jurors" });
  }
});

// Juror join endpoint
router.post("/juror-join/:caseId", authMiddleware, async (req, res) => {
  try {
    const { caseId } = req.params;
    const jurorId = req.user.id;

    const { poolPromise } = require("../config/db");
    const pool = await poolPromise;

    const verification = await pool
      .request()
      .input("caseId", caseId)
      .input("jurorId", jurorId).query(`
    SELECT ja.Status, tm.RoomId, j.Name
    FROM dbo.JurorApplications ja
    JOIN dbo.TrialMeetings tm ON ja.CaseId = tm.CaseId
    JOIN dbo.Jurors j ON ja.JurorId = j.JurorId
    WHERE ja.CaseId = @caseId AND ja.JurorId = @jurorId AND ja.Status = 'approved'
  `);

    if (verification.recordset.length === 0) {
      return res
        .status(403)
        .json({ error: "Not authorized to join this trial" });
    }

    const data = verification.recordset[0];
    const roomId = data.RoomId;

    const identity = await identityClient.createUser();
    const token = await identityClient.getToken(identity, ["voip"]);

    try {
      await addParticipantToRoom(
        roomId,
        identity.communicationUserId,
        "Attendee"
      );
    } catch (err) {
      if (err.statusCode !== 409) throw err; // Ignore if already added
    }

    res.json({
      token: token.token,
      roomId: roomId,
      displayName: `Juror - ${data.Name}`,
      userId: identity.communicationUserId,
    });
  } catch (error) {
    console.error("Error in juror join:", error);
    if (error.statusCode === 409) {
      return res.status(200).json({ message: "Already in room" });
    }
    res.status(500).json({ error: "Failed to join trial" });
  }
});

// In your trial routes file (e.g., trialRoutes.js)

// Get today's scheduled trials for admin
router.get("/admin/trials/today", async (req, res) => {
  try {
    const { poolPromise } = require("../config/db");
    const pool = await poolPromise;
    const sql = require("mssql");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await pool.request().input("today", sql.DateTime2, today)
      .query(`
        SELECT 
          c.CaseId,
          c.CaseTitle,
          c.CaseType,
          c.County,
          c.ScheduledDate,
          c.ScheduledTime,
          c.AttorneyStatus,
          tm.RoomId,
          CONCAT(a.FirstName, ' ', a.LastName) as AttorneyName,
          a.LawFirmName
        FROM Cases c
        LEFT JOIN TrialMeetings tm ON c.CaseId = tm.CaseId
        JOIN Attorneys a ON c.AttorneyId = a.AttorneyId
        WHERE CAST(c.ScheduledDate AS DATE) = CAST(@today AS DATE)
          AND c.AttorneyStatus IN ('approved', 'war_room', 'join_trial')
          AND tm.RoomId IS NOT NULL
        ORDER BY c.ScheduledTime
      `);

    console.log("Today's trials found:", result.recordset.length);
    res.json({ success: true, trials: result.recordset });
  } catch (error) {
    console.error("Error fetching today's trials:", error);
    res.status(500).json({ success: false, message: "Failed to fetch trials" });
  }
});

// Admin join trial
router.post("/admin-join/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    const { poolPromise } = require("../config/db");
    const pool = await poolPromise;
    const sql = require("mssql");

    // Get case and meeting details
    const result = await pool.request().input("caseId", sql.Int, caseId).query(`
        SELECT 
          c.CaseId,
          c.CaseTitle,
          c.ScheduledDate,
          c.ScheduledTime,
          tm.RoomId,
          tm.MeetingId
        FROM Cases c
        JOIN TrialMeetings tm ON c.CaseId = tm.CaseId
        WHERE c.CaseId = @caseId 
          AND c.AttorneyStatus IN ('approved', 'war_room')
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Trial not found or not approved",
      });
    }

    const trial = result.recordset[0];

    // Generate ACS token for admin
    const identityResponse = await identityClient.createUser();
    const acsUserId = identityResponse.communicationUserId;

    // Add admin to room as Presenter
    await addParticipantToRoom(trial.RoomId, acsUserId, "Presenter");

    // Generate token with VoIP scope
    const tokenResponse = await identityClient.getToken(identityResponse, [
      "voip",
    ]);

    // Track admin participation
    await TrialMeeting.addParticipant(
      trial.MeetingId,
      0, // Admin doesn't have a user ID in system
      "admin",
      "Admin Observer",
      acsUserId
    );

    res.json({
      success: true,
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn,
      userId: acsUserId,
      displayName: "Admin Observer",
      roomId: trial.RoomId,
    });
  } catch (error) {
    console.error("Error joining trial as admin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to join trial",
      error: error.message,
    });
  }
});

module.exports = router;
module.exports.createTrialMeeting = createTrialMeeting;
