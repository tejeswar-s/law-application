const { poolPromise } = require("../config/db");

/**
 * JurorApplication Model - Handles juror applications to cases
 */

// Application statuses
const APPLICATION_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

/**
 * Create new juror application
 * @param {Object} applicationData - Application data
 * @returns {number} New application ID
 */
async function createApplication(applicationData) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("jurorId", applicationData.jurorId)
      .input("caseId", applicationData.caseId)
      .input(
        "voirDire1Responses",
        JSON.stringify(applicationData.voirDire1Responses || [])
      )
      .input(
        "voirDire2Responses",
        JSON.stringify(applicationData.voirDire2Responses || [])
      ).query(`
        INSERT INTO dbo.JurorApplications (
          JurorId, CaseId, VoirDire1Responses, VoirDire2Responses,
          Status, AppliedAt, CreatedAt, UpdatedAt
        ) VALUES (
          @jurorId, @caseId, @voirDire1Responses, @voirDire2Responses,
          '${APPLICATION_STATUSES.PENDING}', GETUTCDATE(), GETUTCDATE(), GETUTCDATE()
        );
        SELECT SCOPE_IDENTITY() as ApplicationId;
      `);

    return result.recordset[0].ApplicationId;
  } catch (error) {
    console.error("Error creating juror application:", error);
    throw error;
  }
}

/**
 * Get applications by case ID for attorney review
 * @param {number} caseId - Case ID
 * @param {string} status - Optional status filter
 * @returns {Array} Array of applications with juror details
 */
async function getApplicationsByCase(caseId, status = null) {
  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        ja.*,
        j.Name as JurorName,
        j.Email as JurorEmail,
        j.PhoneNumber,
        j.County,
        j.IsVerified as JurorVerified
      FROM dbo.JurorApplications ja
      INNER JOIN dbo.Jurors j ON ja.JurorId = j.JurorId
      WHERE ja.CaseId = @caseId
    `;

    const request = pool.request().input("caseId", caseId);

    if (status) {
      query += ` AND ja.Status = @status`;
      request.input("status", status);
    }

    query += ` ORDER BY ja.AppliedAt ASC`;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Error getting applications by case:", error);
    throw error;
  }
}

/**
 * Get applications by juror ID
 * @param {number} jurorId - Juror ID
 * @returns {Array} Array of applications with case details
 */
async function getApplicationsByJuror(jurorId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("jurorId", jurorId).query(`
        SELECT 
          ja.*,
          c.CaseTitle,
          c.CaseDescription,
          c.ScheduledDate,
          c.ScheduledTime,
          c.PaymentAmount,
          c.AttorneyStatus,
          a.LawFirmName
        FROM dbo.JurorApplications ja
        INNER JOIN dbo.Cases c ON ja.CaseId = c.CaseId
        INNER JOIN dbo.Attorneys a ON c.AttorneyId = a.AttorneyId
        WHERE ja.JurorId = @jurorId
        ORDER BY ja.AppliedAt DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting applications by juror:", error);
    throw error;
  }
}

/**
 * Update application status (approve/reject)
 * @param {number} applicationId - Application ID
 * @param {string} status - New status
 * @param {number} reviewedBy - Attorney ID who made the decision
 * @param {string} comments - Optional comments
 */
async function updateApplicationStatus(
  applicationId,
  status,
  reviewedBy,
  comments = null
) {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("applicationId", applicationId)
      .input("status", status)
      .input("reviewedBy", reviewedBy)
      .input("comments", comments).query(`
        UPDATE dbo.JurorApplications 
        SET Status = @status,
            ReviewedBy = @reviewedBy,
            ReviewedAt = GETUTCDATE(),
            ReviewComments = @comments,
            UpdatedAt = GETUTCDATE()
        WHERE ApplicationId = @applicationId
      `);
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
}

/**
 * Check if juror already applied to case
 * @param {number} jurorId - Juror ID
 * @param {number} caseId - Case ID
 * @returns {boolean} True if already applied
 */
async function hasJurorAppliedToCase(jurorId, caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("jurorId", jurorId)
      .input("caseId", caseId).query(`
        SELECT COUNT(*) as count
        FROM dbo.JurorApplications
        WHERE JurorId = @jurorId AND CaseId = @caseId
      `);

    return result.recordset[0].count > 0;
  } catch (error) {
    console.error("Error checking if juror applied to case:", error);
    throw error;
  }
}

/**
 * Get approved jurors for a case
 * @param {number} caseId - Case ID
 * @returns {Array} Array of approved jurors
 */
async function getApprovedJurorsForCase(caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT 
          ja.*,
          j.Name as JurorName,
          j.Email as JurorEmail,
          j.PhoneNumber
        FROM dbo.JurorApplications ja
        INNER JOIN dbo.Jurors j ON ja.JurorId = j.JurorId
        WHERE ja.CaseId = @caseId AND ja.Status = '${APPLICATION_STATUSES.APPROVED}'
        ORDER BY ja.ReviewedAt ASC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting approved jurors for case:", error);
    throw error;
  }
}

/**
 * Get pending applications count for a case
 * @param {number} caseId - Case ID
 * @returns {number} Number of pending applications
 */
async function getPendingApplicationsCount(caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT COUNT(*) as count
        FROM dbo.JurorApplications
        WHERE CaseId = @caseId AND Status = '${APPLICATION_STATUSES.PENDING}'
      `);

    return result.recordset[0].count;
  } catch (error) {
    console.error("Error getting pending applications count:", error);
    throw error;
  }
}

/**
 * Get application by ID with full details
 * @param {number} applicationId - Application ID
 * @returns {Object} Application with juror and case details
 */
async function findById(applicationId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("applicationId", applicationId)
      .query(`
        SELECT 
          ja.*,
          j.Name as JurorName,
          j.Email as JurorEmail,
          j.PhoneNumber,
          j.County as JurorCounty,
          c.CaseTitle,
          c.AttorneyId,
          a.FirstName + ' ' + a.LastName as AttorneyName
        FROM dbo.JurorApplications ja
        INNER JOIN dbo.Jurors j ON ja.JurorId = j.JurorId
        INNER JOIN dbo.Cases c ON ja.CaseId = c.CaseId
        INNER JOIN dbo.Attorneys a ON c.AttorneyId = a.AttorneyId
        WHERE ja.ApplicationId = @applicationId
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error finding application by ID:", error);
    throw error;
  }
}

/**
 * Find application by juror and case
 * @param {number} jurorId - Juror ID
 * @param {number} caseId - Case ID
 * @returns {Object|null} Application or null
 */
async function findByJurorAndCase(jurorId, caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("jurorId", jurorId)
      .input("caseId", caseId).query(`
        SELECT * FROM dbo.JurorApplications
        WHERE JurorId = @jurorId AND CaseId = @caseId
      `);
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error finding application by juror and case:", error);
    throw error;
  }
}

module.exports = {
  APPLICATION_STATUSES,
  createApplication,
  getApplicationsByCase,
  getApplicationsByJuror,
  updateApplicationStatus,
  hasJurorAppliedToCase,
  getApprovedJurorsForCase,
  getPendingApplicationsCount,
  findById,
  findByJurorAndCase,
};
