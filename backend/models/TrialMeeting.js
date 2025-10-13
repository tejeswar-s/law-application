const { poolPromise } = require("../config/db");

/**
 * TrialMeeting Model - Manages virtual trial meetings
 */

async function createMeeting(caseId, threadId,roomId) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("caseId", caseId)
      .input("threadId", threadId)
      .input("roomId", roomId)
      .input("status", "created").query(`
        INSERT INTO dbo.TrialMeetings (CaseId, ThreadId,RoomId, Status, CreatedAt)
        VALUES (@caseId, @threadId,@roomId, @status, GETUTCDATE());
        SELECT SCOPE_IDENTITY() as MeetingId;
      `);
    return result.recordset[0].MeetingId;
  } catch (error) {
    console.error("Error creating trial meeting:", error);
    throw error;
  }
}

async function getMeetingByCaseId(caseId) {
  const { poolPromise } = require("../config/db");
  const pool = await poolPromise;
  
  const result = await pool.request()
    .input('caseId', caseId)
    .query(`
      SELECT MeetingId, CaseId, ThreadId, RoomId, Status, CreatedAt, StartedAt, EndedAt
      FROM dbo.TrialMeetings 
      WHERE CaseId = @caseId
    `);
  
  return result.recordset[0];
}

async function updateMeetingStatus(meetingId, status) {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("meetingId", meetingId)
      .input("status", status).query(`
        UPDATE dbo.TrialMeetings 
        SET Status = @status, 
            ${status === "active" ? "StartedAt = GETUTCDATE()" : ""}
            ${status === "ended" ? "EndedAt = GETUTCDATE()" : ""}
        WHERE MeetingId = @meetingId
      `);
  } catch (error) {
    console.error("Error updating meeting status:", error);
    throw error;
  }
}

async function addParticipant(meetingId, userId, userType, displayName, acsUserId) {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("meetingId", meetingId)
      .input("userId", userId)
      .input("userType", userType)
      .input("displayName", displayName)
      .input("acsUserId", acsUserId).query(`
        INSERT INTO dbo.TrialParticipants 
        (MeetingId, UserId, UserType, DisplayName, AcsUserId, JoinedAt)
        VALUES (@meetingId, @userId, @userType, @displayName, @acsUserId, GETUTCDATE())
      `);
  } catch (error) {
    console.error("Error adding participant:", error);
    throw error;
  }
}

async function getParticipants(meetingId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("meetingId", meetingId).query(`
      SELECT * FROM dbo.TrialParticipants 
      WHERE MeetingId = @meetingId 
      ORDER BY JoinedAt DESC
    `);
    return result.recordset;
  } catch (error) {
    console.error("Error getting participants:", error);
    throw error;
  }
}

module.exports = {
  createMeeting,
  getMeetingByCaseId,
  updateMeetingStatus,
  addParticipant,
  getParticipants,
};