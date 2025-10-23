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
  createChatThread,
  addParticipantToChat,
  ACS_ENDPOINT
} = require("../services/acsRoomsService");

console.log("ACS_ENDPOINT:", ACS_ENDPOINT);

// All routes require authentication
router.use(authMiddleware);

/**
 * Create meeting room AND chat thread when war room is submitted
 * Called from attorneyRoutes.js submit-war-room endpoint
 * 
 * ✅ FIXED: Creates chat thread immediately with service identity AND stores service user ID
 */
async function createTrialMeeting(caseId) {
  try {
    console.log("=== Creating trial meeting for case:", caseId);

    const existingMeeting = await TrialMeeting.getMeetingByCaseId(caseId);
    if (existingMeeting) {
      console.log("Meeting already exists, returning existing:", existingMeeting.MeetingId);
      return existingMeeting;
    }

    console.log("No existing meeting, creating new ACS room and chat...");
    const caseData = await Case.findById(caseId);

    // 1. Create ACS Room for video
    const room = await createRoom(
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );
    console.log("✅ ACS Room created:", room.id);

    // 2. Create Chat Thread immediately (not on first join!)
    const chatResult = await createChatThread(
      `Trial: ${caseData.CaseTitle || 'Case ' + caseId}`
    );
    console.log("✅ Chat thread created:", chatResult.chatThreadId);
    console.log("✅ Service user ID:", chatResult.serviceUserId);

    // 3. Store in database WITH chat thread ID AND service user ID
    const threadId = `trial-case-${caseId}-${Date.now()}`;
    const meetingId = await TrialMeeting.createMeeting(
      caseId,
      threadId,
      room.id,
      chatResult.chatThreadId,
      chatResult.serviceUserId  // Store the service user ID!
    );

    console.log(`✅ Trial meeting created successfully!`);
    console.log(`   Meeting ID: ${meetingId}`);
    console.log(`   Room ID: ${room.id}`);
    console.log(`   Chat Thread ID: ${chatResult.chatThreadId}`);
    console.log(`   Service User ID: ${chatResult.serviceUserId}`);

    return {
      MeetingId: meetingId,
      CaseId: caseId,
      ThreadId: threadId,
      RoomId: room.id,
      ChatThreadId: chatResult.chatThreadId,
      ChatServiceUserId: chatResult.serviceUserId,
      Status: "created",
    };
  } catch (error) {
    console.error("❌ Error creating trial meeting:", error);
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
        roomId: meeting.RoomId,
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
 * 
 * ✅ FIXED: Uses stored service user ID to add participants to chat
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

    const meeting = await TrialMeeting.getMeetingByCaseId(caseId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found. Please contact administrator." });
    }

    if (!meeting.ChatThreadId) {
      return res.status(500).json({ message: "Chat not available for this meeting." });
    }

    // Create ACS user identity and token WITH CHAT SCOPE
    const identityResponse = await identityClient.createUser();
    const acsUserId = identityResponse.communicationUserId;

    // Add participant to ACS Room (for video)
    await addParticipantToRoom(meeting.RoomId, acsUserId, participantRole);

    // Generate token with VoIP AND Chat scopes
    const tokenResponse = await identityClient.getToken(identityResponse, ["voip", "chat"]);

    // ✅ ADD USER TO CHAT THREAD using the stored service user ID
    if (meeting.ChatThreadId && meeting.ChatServiceUserId) {
      try {
        await addParticipantToChat(
          meeting.ChatThreadId, 
          meeting.ChatServiceUserId,  // Use the stored service user ID!
          acsUserId, 
          displayName
        );
      } catch (chatAddError) {
        console.error("Failed to add participant to chat:", chatAddError);
        // Continue anyway - they can still join video
      }
    }

    // Track participant in database
    await TrialMeeting.addParticipant(meeting.MeetingId, userId, userType, displayName, acsUserId);

    // Update meeting status to active if first join
    if (meeting.Status === "created") {
      await TrialMeeting.updateMeetingStatus(meeting.MeetingId, "active");
    }

    console.log(`✅ ${displayName} joined successfully`);
    console.log(`   ACS User ID: ${acsUserId}`);
    console.log(`   Chat Thread: ${meeting.ChatThreadId}`);

    res.json({
      success: true,
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn,
      userId: acsUserId,
      displayName: displayName,
      roomId: meeting.RoomId,
      chatThreadId: meeting.ChatThreadId,
      endpointUrl: ACS_ENDPOINT
    });
  } catch (error) {
    console.error("❌ Error joining trial:", error);
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

/**
 * GET /api/trial/case/:caseId/jurors
 * Get approved jurors for a trial
 */
router.get("/case/:caseId/jurors", async (req, res) => {
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

/**
 * POST /api/trial/juror-join/:caseId
 * Juror join endpoint
 * 
 * ✅ FIXED: Uses stored service user ID to add juror to chat
 */
router.post("/juror-join/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    const jurorId = req.user.id;

    const { poolPromise } = require("../config/db");
    const pool = await poolPromise;

    const verification = await pool
      .request()
      .input("caseId", caseId)
      .input("jurorId", jurorId).query(`
        SELECT ja.Status, tm.RoomId, tm.ChatThreadId, tm.ChatServiceUserId, tm.MeetingId, j.Name
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
    const chatServiceUserId = data.ChatServiceUserId;
    const meetingId = data.MeetingId;
    const jurorName = data.Name;

    // Create identity and token
    const identity = await identityClient.createUser();
    const token = await identityClient.getToken(identity, ["voip", "chat"]);

    // Add to room (for video)
    try {
      await addParticipantToRoom(roomId, identity.communicationUserId, "Attendee");
    } catch (err) {
      if (err.statusCode !== 409) throw err;
    }

    // ✅ ADD JUROR TO CHAT THREAD using the stored service user ID
    if (chatThreadId && chatServiceUserId) {
      try {
        await addParticipantToChat(
          chatThreadId, 
          chatServiceUserId,  // Use the stored service user ID!
          identity.communicationUserId, 
          `${jurorName} (Juror)`
        );
      } catch (chatAddError) {
        console.error("Failed to add juror to chat:", chatAddError);
        // Continue anyway - they can still join video
      }
    }

    // Track in database
    await TrialMeeting.addParticipant(
      meetingId,
      jurorId,
      "juror",
      `${jurorName} (Juror)`,
      identity.communicationUserId
    );

    console.log(`✅ Juror ${jurorName} joined successfully with chat access`);

    res.json({
      success: true,
      token: token.token,
      expiresOn: token.expiresOn,
      roomId: roomId,
      displayName: `${jurorName} (Juror)`,
      userId: identity.communicationUserId,
      chatThreadId: chatThreadId,
      endpointUrl: ACS_ENDPOINT
    });
  } catch (error) {
    console.error("❌ Error in juror join:", error);
    if (error.statusCode === 409) {
      return res.status(200).json({ message: "Already in room" });
    }
    res.status(500).json({ error: "Failed to join trial" });
  }
});

/**
 * GET /api/trial/admin/trials/today
 * Get today's scheduled trials for admin
 */
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

/**
 * POST /api/trial/admin-join/:caseId
 * Admin join trial
 * 
 * ✅ FIXED: Uses stored service user ID to add admin to chat
 */
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
          tm.ChatThreadId,
          tm.ChatServiceUserId
        FROM Cases c
        JOIN TrialMeetings tm ON c.CaseId = tm.CaseId
        WHERE c.CaseId = @caseId 
          AND c.AttorneyStatus IN ('approved', 'war_room', 'join_trial')
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

    // ✅ ADD ADMIN TO CHAT THREAD using the stored service user ID
    if (trial.ChatThreadId && trial.ChatServiceUserId) {
      try {
        await addParticipantToChat(
          trial.ChatThreadId, 
          trial.ChatServiceUserId,  // Use the stored service user ID!
          acsUserId, 
          "Court Administrator"
        );
      } catch (chatAddError) {
        console.error("Failed to add admin to chat:", chatAddError);
        // Continue anyway - they can still join video
      }
    }

    await TrialMeeting.addParticipant(
      trial.MeetingId,
      0,
      "admin",
      "Court Administrator",
      acsUserId
    );

    console.log(`✅ Admin joined trial ${caseId} with chat access`);

    res.json({
      success: true,
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOn,
      userId: acsUserId,
      displayName: "Court Administrator",
      roomId: trial.RoomId,
      chatThreadId: trial.ChatThreadId,
      endpointUrl: ACS_ENDPOINT
    });
  } catch (error) {
    console.error("❌ Error joining trial as admin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to join trial",
      error: error.message,
    });
  }
});

module.exports = router;
module.exports.createTrialMeeting = createTrialMeeting;