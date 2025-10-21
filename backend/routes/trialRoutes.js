const express = require("express");
const {
  CommunicationIdentityClient,
} = require("@azure/communication-identity");
const { ChatClient } = require("@azure/communication-chat"); // ADD THIS
const { AzureCommunicationTokenCredential } = require("@azure/communication-common"); // ADD THIS
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

// Get ACS endpoint from connection string
const ACS_ENDPOINT = connectionString.match(/endpoint=(https:\/\/[^;]+)/)?.[1] || 
                     process.env.ACS_ENDPOINT;
console.log("ACS_ENDPOINT extracted:", ACS_ENDPOINT);

const {
  createRoom,
  addParticipantToRoom,
} = require("../services/acsRoomsService");

// All routes require authentication
router.use(authMiddleware);

/**
 * Create meeting room AND chat thread when war room is submitted
 * Called from attorneyRoutes.js submit-war-room endpoint
 */
async function createTrialMeeting(caseId) {
  try {
    console.log("=== Creating trial meeting for case:", caseId);

    const existingMeeting = await TrialMeeting.getMeetingByCaseId(caseId);
    if (existingMeeting) {
      console.log("Meeting already exists, returning existing:", existingMeeting.MeetingId);
      return existingMeeting;
    }

    console.log("No existing meeting, creating new ACS room...");
    const caseData = await Case.findById(caseId);

    // ... date parsing code stays the same ...

    // 1. Create ACS Room ONLY (no chat thread yet)
    const room = await createRoom(
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );
    console.log("ACS Room created successfully:", room.id);

    // 2. NO CHAT THREAD CREATION HERE - we'll create it on first join

    // 3. Store in database WITHOUT chat thread ID
    const threadId = `trial-case-${caseId}-${Date.now()}`;
    const meetingId = await TrialMeeting.createMeeting(
      caseId,
      threadId,
      room.id,
      null // chatThreadId is null initially
    );

    console.log(`Trial meeting stored, Meeting ID: ${meetingId}, Room ID: ${room.id}`);

    return {
      MeetingId: meetingId,
      CaseId: caseId,
      ThreadId: threadId,
      RoomId: room.id,
      ChatThreadId: null,
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

    const meeting = await TrialMeeting.getMeetingByCaseId(caseId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({
      success: true,
      meeting: {
        meetingId: meeting.MeetingId,
        threadId: meeting.ThreadId,
        chatThreadId: meeting.ChatThreadId,
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
 * Generate ACS token for user to join trial with chat support
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

    // Verify authorization and set display name
    let displayName = "";
    let participantRole = "Attendee";

    if (userType === "attorney") {
      if (caseData.AttorneyId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      displayName = `${req.user.firstName} ${req.user.lastName} (Attorney)`;
      participantRole = "Presenter";
    } else if (userType === "juror") {
      const application = await JurorApplication.findByJurorAndCase(userId, caseId);
      if (!application || application.Status !== "approved") {
        return res.status(403).json({ message: "Access denied - not approved for this case" });
      }
      displayName = `${req.user.name} (Juror)`;
    } else if (userType === "admin") {
      displayName = "Court Administrator";
      participantRole = "Presenter";
    } else {
      return res.status(403).json({ message: "Invalid user type" });
    }

    let meeting = await TrialMeeting.getMeetingByCaseId(caseId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found. Please contact administrator." });
    }

    // Create ACS user identity and token WITH CHAT SCOPE
    const identityResponse = await identityClient.createUser();
    const acsUserId = identityResponse.communicationUserId;

    // Add participant to ACS Room
    await addParticipantToRoom(meeting.RoomId, acsUserId, participantRole);

    // Generate token with VoIP AND Chat scopes
    const tokenResponse = await identityClient.getToken(identityResponse, ["voip", "chat"]);

    // CREATE CHAT THREAD if it doesn't exist (first person to join)
    let chatThreadId = meeting.ChatThreadId;
    if (!chatThreadId) {
      try {
        console.log("First person joining - creating chat thread...");
        const credential = new AzureCommunicationTokenCredential(tokenResponse.token);
        const chatClient = new ChatClient(ACS_ENDPOINT, credential);
        
        const createChatThreadResult = await chatClient.createChatThread({
          topic: `Trial Case ${caseId} - ${caseData.CaseTitle}`
        });
        
        chatThreadId = createChatThreadResult.chatThread.id;
        
        // Update database with chat thread ID
        const { poolPromise } = require("../config/db");
        const pool = await poolPromise;
        await pool.request()
          .input("chatThreadId", chatThreadId)
          .input("meetingId", meeting.MeetingId)
          .query(`UPDATE dbo.TrialMeetings SET ChatThreadId = @chatThreadId WHERE MeetingId = @meetingId`);
        
        console.log("Chat thread created successfully:", chatThreadId);
      } catch (chatError) {
        console.error("Failed to create chat thread:", chatError);
        // Continue without chat
      }
    }

    // Track participant in database
    await TrialMeeting.addParticipant(meeting.MeetingId, userId, userType, displayName, acsUserId);

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
      roomId: meeting.RoomId,
      chatThreadId: chatThreadId,
      endpointUrl: ACS_ENDPOINT
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

// Get approved jurors for a trial
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
// Juror join endpoint - FIXED VERSION
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
        SELECT ja.Status, tm.RoomId, tm.ChatThreadId, j.Name
        FROM dbo.JurorApplications ja
        JOIN dbo.TrialMeetings tm ON ja.CaseId = tm.CaseId
        JOIN dbo.Jurors j ON ja.JurorId = j.JurorId
        WHERE ja.CaseId = @caseId AND ja.JurorId = @jurorId AND ja.Status = 'approved'
      `);

    if (verification.recordset.length === 0) {
      return res.status(403).json({ error: "Not authorized to join this trial" });
    }

    const data = verification.recordset[0];
    const roomId = data.RoomId;
    const chatThreadId = data.ChatThreadId;

    const identity = await identityClient.createUser();
    const token = await identityClient.getToken(identity, ["voip", "chat"]);

    try {
      await addParticipantToRoom(roomId, identity.communicationUserId, "Attendee");
    } catch (err) {
      if (err.statusCode !== 409) throw err;
    }

    // ✅ REMOVED: Manual chat participant addition
    // Users are automatically added when they send their first message
    // This avoids the 403 permission error
    
    console.log(`Juror ${data.Name} prepared to join - will be added to chat on first message`);

    res.json({
      token: token.token,
      roomId: roomId,
      displayName: `${data.Name} (Juror)`,
      userId: identity.communicationUserId,
      chatThreadId: chatThreadId,
      endpointUrl: ACS_ENDPOINT
    });
  } catch (error) {
    console.error("Error in juror join:", error);
    if (error.statusCode === 409) {
      return res.status(200).json({ message: "Already in room" });
    }
    res.status(500).json({ error: "Failed to join trial" });
  }
});
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

    const result = await pool.request().input("caseId", sql.Int, caseId).query(`
        SELECT 
          c.CaseId,
          c.CaseTitle,
          c.ScheduledDate,
          c.ScheduledTime,
          tm.RoomId,
          tm.MeetingId,
          tm.ChatThreadId
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

    const identityResponse = await identityClient.createUser();
    const acsUserId = identityResponse.communicationUserId;

    await addParticipantToRoom(trial.RoomId, acsUserId, "Presenter");

    const tokenResponse = await identityClient.getToken(identityResponse, [
      "voip",
      "chat"
    ]);

    // Note: Admin will be automatically added to chat when they send first message
    // No manual adding needed

    await TrialMeeting.addParticipant(
      trial.MeetingId,
      0,
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
      chatThreadId: trial.ChatThreadId,
      endpointUrl: ACS_ENDPOINT
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