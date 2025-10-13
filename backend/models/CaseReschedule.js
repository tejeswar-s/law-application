const { poolPromise } = require("../config/db");

/**
 * CaseReschedule Model - Manage case reschedule requests
 */

/**
 * Create a reschedule request when admin rejects case due to scheduling conflict
 * @param {Object} rescheduleData - Reschedule request data
 * @returns {number} RequestId
 */
async function createRescheduleRequest(rescheduleData) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("caseId", rescheduleData.caseId)
      .input("rejectionReason", rescheduleData.rejectionReason)
      .input("adminComments", rescheduleData.adminComments || null)
      .input(
        "suggestedSlots",
        JSON.stringify(rescheduleData.suggestedSlots || [])
      ).query(`
        INSERT INTO dbo.CaseRescheduleRequests 
          (CaseId, RejectionReason, AdminComments, SuggestedSlots, AttorneyResponse, CreatedAt, UpdatedAt)
        VALUES 
          (@caseId, @rejectionReason, @adminComments, @suggestedSlots, 'pending', GETUTCDATE(), GETUTCDATE());
        SELECT SCOPE_IDENTITY() as RequestId;
      `);

    return result.recordset[0].RequestId;
  } catch (error) {
    console.error("Error creating reschedule request:", error);
    throw error;
  }
}

/**
 * Get reschedule request by case ID
 * @param {number} caseId - Case ID
 * @returns {Object} Reschedule request
 */
async function getRescheduleRequestByCase(caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT TOP 1 *
        FROM dbo.CaseRescheduleRequests
        WHERE CaseId = @caseId
        ORDER BY CreatedAt DESC
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error getting reschedule request:", error);
    throw error;
  }
}

/**
 * Get all pending reschedule requests for attorney
 * @param {number} attorneyId - Attorney ID
 * @returns {Array} Reschedule requests
 */
async function getPendingReschedulesByAttorney(attorneyId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("attorneyId", attorneyId).query(`
        SELECT 
          rr.*,
          c.CaseTitle,
          c.ScheduledDate as OriginalDate,
          c.ScheduledTime as OriginalTime
        FROM dbo.CaseRescheduleRequests rr
        INNER JOIN dbo.Cases c ON rr.CaseId = c.CaseId
        WHERE c.AttorneyId = @attorneyId
          AND rr.AttorneyResponse = 'pending'
        ORDER BY rr.CreatedAt DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting pending reschedules:", error);
    throw error;
  }
}

/**
 * Attorney accepts a suggested slot
 * @param {number} requestId - Request ID
 * @param {Object} selectedSlot - {date, time}
 */
async function acceptSuggestedSlot(requestId, selectedSlot) {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("requestId", requestId)
      .input("selectedSlot", JSON.stringify(selectedSlot)).query(`
        UPDATE dbo.CaseRescheduleRequests
        SET 
          AttorneyResponse = 'accepted',
          SelectedSlot = @selectedSlot,
          UpdatedAt = GETUTCDATE()
        WHERE RequestId = @requestId
      `);
  } catch (error) {
    console.error("Error accepting suggested slot:", error);
    throw error;
  }
}

/**
 * Attorney requests different time slots
 * @param {number} requestId - Request ID
 * @param {string} message - Message to admin
 */
async function requestDifferentSlots(requestId, message) {
  try {
    const pool = await poolPromise;
    await pool.request().input("requestId", requestId).input("message", message)
      .query(`
        UPDATE dbo.CaseRescheduleRequests
        SET 
          AttorneyResponse = 'requested_different',
          AdminComments = CONCAT(AdminComments, ' | Attorney reply: ', @message),
          UpdatedAt = GETUTCDATE()
        WHERE RequestId = @requestId
      `);
  } catch (error) {
    console.error("Error requesting different slots:", error);
    throw error;
  }
}

/**
 * Get reschedule request by ID
 * @param {number} requestId - Request ID
 * @returns {Object} Reschedule request
 */
async function findById(requestId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("requestId", requestId).query(`
        SELECT *
        FROM dbo.CaseRescheduleRequests
        WHERE RequestId = @requestId
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error finding reschedule request:", error);
    throw error;
  }
}

/**
 * Delete reschedule request (after case is approved with new time)
 * @param {number} requestId - Request ID
 */
async function deleteRescheduleRequest(requestId) {
  try {
    const pool = await poolPromise;
    await pool.request().input("requestId", requestId).query(`
        DELETE FROM dbo.CaseRescheduleRequests
        WHERE RequestId = @requestId
      `);
  } catch (error) {
    console.error("Error deleting reschedule request:", error);
    throw error;
  }
}

module.exports = {
  createRescheduleRequest,
  getRescheduleRequestByCase,
  getPendingReschedulesByAttorney,
  acceptSuggestedSlot,
  requestDifferentSlots,
  findById,
  deleteRescheduleRequest,
};
