const { poolPromise } = require("../config/db");

/**
 * Event Model - Handles case events and timeline
 */

// Event types
const EVENT_TYPES = {
  CASE_CREATED: "case_created",
  ADMIN_APPROVED: "admin_approved",
  ADMIN_REJECTED: "admin_rejected",
  JUROR_APPLIED: "juror_applied",
  JUROR_APPROVED: "juror_approved",
  JUROR_REJECTED: "juror_rejected",
  TRIAL_STARTED: "trial_started",
  TRIAL_COMPLETED: "trial_completed",
  VERDICT_SUBMITTED: "verdict_submitted",
};

/**
 * Create new event
 * @param {Object} eventData - Event data
 * @returns {number} New event ID
 */
async function createEvent(eventData) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("caseId", eventData.caseId)
      .input("eventType", eventData.eventType)
      .input("description", eventData.description)
      .input("triggeredBy", eventData.triggeredBy || null)
      .input("userType", eventData.userType || null) // 'attorney', 'juror', 'admin'
      .input("metadata", JSON.stringify(eventData.metadata || {})).query(`
        INSERT INTO dbo.Events (
          CaseId, EventType, Description, TriggeredBy, UserType,
          Metadata, CreatedAt
        ) VALUES (
          @caseId, @eventType, @description, @triggeredBy, @userType,
          @metadata, GETUTCDATE()
        );
        SELECT SCOPE_IDENTITY() as EventId;
      `);

    return result.recordset[0].EventId;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

/**
 * Get events by case ID
 * @param {number} caseId - Case ID
 * @returns {Array} Array of events ordered by creation time
 */
async function getEventsByCase(caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT 
          e.*,
          CASE 
            WHEN e.UserType = 'attorney' THEN a.FirstName + ' ' + a.LastName
            WHEN e.UserType = 'juror' THEN j.Name
            WHEN e.UserType = 'admin' THEN 'Admin'
            ELSE 'System'
          END as TriggeredByName
        FROM dbo.Events e
        LEFT JOIN dbo.Attorneys a ON e.TriggeredBy = a.AttorneyId AND e.UserType = 'attorney'
        LEFT JOIN dbo.Jurors j ON e.TriggeredBy = j.JurorId AND e.UserType = 'juror'
        WHERE e.CaseId = @caseId
        ORDER BY e.CreatedAt ASC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting events by case:", error);
    throw error;
  }
}

/**
 * Get recent events for dashboard
 * @param {number} limit - Number of events to return
 * @returns {Array} Array of recent events
 */
async function getRecentEvents(limit = 10) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("limit", limit).query(`
        SELECT TOP (@limit)
          e.*,
          c.CaseTitle,
          CASE 
            WHEN e.UserType = 'attorney' THEN a.FirstName + ' ' + a.LastName
            WHEN e.UserType = 'juror' THEN j.Name
            WHEN e.UserType = 'admin' THEN 'Admin'
            ELSE 'System'
          END as TriggeredByName
        FROM dbo.Events e
        INNER JOIN dbo.Cases c ON e.CaseId = c.CaseId
        LEFT JOIN dbo.Attorneys a ON e.TriggeredBy = a.AttorneyId AND e.UserType = 'attorney'
        LEFT JOIN dbo.Jurors j ON e.TriggeredBy = j.JurorId AND e.UserType = 'juror'
        ORDER BY e.CreatedAt DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting recent events:", error);
    throw error;
  }
}

/**
 * Get events by user (attorney or juror)
 * @param {number} userId - User ID
 * @param {string} userType - 'attorney' or 'juror'
 * @param {number} limit - Number of events to return
 * @returns {Array} Array of user's events
 */
async function getEventsByUser(userId, userType, limit = 20) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", userId)
      .input("userType", userType)
      .input("limit", limit).query(`
        SELECT TOP (@limit)
          e.*,
          c.CaseTitle,
          CASE 
            WHEN e.UserType = 'attorney' THEN a.FirstName + ' ' + a.LastName
            WHEN e.UserType = 'juror' THEN j.Name
            WHEN e.UserType = 'admin' THEN 'Admin'
            ELSE 'System'
          END as TriggeredByName
        FROM dbo.Events e
        INNER JOIN dbo.Cases c ON e.CaseId = c.CaseId
        LEFT JOIN dbo.Attorneys a ON e.TriggeredBy = a.AttorneyId AND e.UserType = 'attorney'
        LEFT JOIN dbo.Jurors j ON e.TriggeredBy = j.JurorId AND e.UserType = 'juror'
        WHERE e.TriggeredBy = @userId AND e.UserType = @userType
        ORDER BY e.CreatedAt DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting events by user:", error);
    throw error;
  }
}

/**
 * Get events by type
 * @param {string} eventType - Event type to filter by
 * @param {number} limit - Number of events to return
 * @returns {Array} Array of events of specified type
 */
async function getEventsByType(eventType, limit = 20) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("eventType", eventType)
      .input("limit", limit).query(`
        SELECT TOP (@limit)
          e.*,
          c.CaseTitle,
          CASE 
            WHEN e.UserType = 'attorney' THEN a.FirstName + ' ' + a.LastName
            WHEN e.UserType = 'juror' THEN j.Name
            WHEN e.UserType = 'admin' THEN 'Admin'
            ELSE 'System'
          END as TriggeredByName
        FROM dbo.Events e
        INNER JOIN dbo.Cases c ON e.CaseId = c.CaseId
        LEFT JOIN dbo.Attorneys a ON e.TriggeredBy = a.AttorneyId AND e.UserType = 'attorney'
        LEFT JOIN dbo.Jurors j ON e.TriggeredBy = j.JurorId AND e.UserType = 'juror'
        WHERE e.EventType = @eventType
        ORDER BY e.CreatedAt DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting events by type:", error);
    throw error;
  }
}

/**
 * Get event statistics for admin dashboard
 * @param {number} days - Number of days to look back
 * @returns {Object} Event statistics
 */
async function getEventStatistics(days = 7) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("days", days).query(`
        SELECT 
          EventType,
          COUNT(*) as EventCount,
          COUNT(DISTINCT CaseId) as UniqueCases
        FROM dbo.Events 
        WHERE CreatedAt >= DATEADD(day, -@days, GETUTCDATE())
        GROUP BY EventType
        ORDER BY EventCount DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting event statistics:", error);
    throw error;
  }
}

/**
 * Delete old events (for cleanup)
 * @param {number} daysToKeep - Number of days of events to keep
 * @returns {number} Number of events deleted
 */
async function deleteOldEvents(daysToKeep = 365) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("daysToKeep", daysToKeep).query(`
        DELETE FROM dbo.Events 
        WHERE CreatedAt < DATEADD(day, -@daysToKeep, GETUTCDATE());
        SELECT @@ROWCOUNT as DeletedCount;
      `);

    return result.recordset[0].DeletedCount;
  } catch (error) {
    console.error("Error deleting old events:", error);
    throw error;
  }
}

module.exports = {
  EVENT_TYPES,
  createEvent,
  getEventsByCase,
  getRecentEvents,
  getEventsByUser,
  getEventsByType,
  getEventStatistics,
  deleteOldEvents,
};
