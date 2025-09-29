const { poolPromise } = require("../config/db");

/**
 * Case Model - Complete case management system
 * Handles all case states and transitions
 */

// Case States for Attorney
const ATTORNEY_CASE_STATES = {
  PENDING_ADMIN_APPROVAL: "pending_admin_approval",
  WAR_ROOM: "war_room",
  JOIN_TRIAL: "join_trial",
  VIEW_DETAILS: "view_details",
};

// Case States for Juror
const JUROR_CASE_STATES = {
  PENDING_APPROVAL: "pending_approval",
  AWAITING_TRIAL: "awaiting_trial",
  JOIN_TRIAL: "join_trial",
  GIVE_VERDICTS: "give_verdicts",
};

/**
 * Find case by ID with all related data
 * @param {number} caseId - Case ID
 * @returns {Object} Complete case data
 */
async function findById(caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT 
          c.*,
          a.FirstName + ' ' + a.LastName as AttorneyName,
          a.LawFirmName,
          a.Email as AttorneyEmail
        FROM dbo.Cases c
        INNER JOIN dbo.Attorneys a ON c.AttorneyId = a.AttorneyId
        WHERE c.CaseId = @caseId
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error finding case by ID:", error);
    throw error;
  }
}

/**
 * Create new case
 * @param {Object} caseData - Case creation data
 * @returns {number} New case ID
 */
async function createCase(caseData) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("attorneyId", caseData.attorneyId)
      .input("caseType", caseData.caseType) // 'state' or 'federal'
      .input("caseTier", caseData.caseTier)
      .input("county", caseData.county)
      .input("caseTitle", caseData.caseTitle)
      .input("caseDescription", caseData.caseDescription)
      .input("paymentMethod", caseData.paymentMethod)
      .input("paymentAmount", caseData.paymentAmount)
      .input("scheduledDate", caseData.scheduledDate)
      .input("scheduledTime", caseData.scheduledTime)
      .input("plaintiffGroups", JSON.stringify(caseData.plaintiffGroups || []))
      .input("defendantGroups", JSON.stringify(caseData.defendantGroups || []))
      .input(
        "voirDire1Questions",
        JSON.stringify(caseData.voirDire1Questions || [])
      )
      .input(
        "voirDire2Questions",
        JSON.stringify(caseData.voirDire2Questions || [])
      ).query(`
        INSERT INTO dbo.Cases (
          AttorneyId, CaseType, CaseTier, County, CaseTitle, CaseDescription,
          PaymentMethod, PaymentAmount, ScheduledDate, ScheduledTime,
          PlaintiffGroups, DefendantGroups, VoirDire1Questions, VoirDire2Questions,
          AttorneyStatus, JurorStatus, AdminApprovalStatus, RequiredJurors,
          CreatedAt, UpdatedAt
        ) VALUES (
          @attorneyId, @caseType, @caseTier, @county, @caseTitle, @caseDescription,
          @paymentMethod, @paymentAmount, @scheduledDate, @scheduledTime,
          @plaintiffGroups, @defendantGroups, @voirDire1Questions, @voirDire2Questions,
          '${ATTORNEY_CASE_STATES.PENDING_ADMIN_APPROVAL}', null, 'pending', 7,
          GETUTCDATE(), GETUTCDATE()
        );
        SELECT SCOPE_IDENTITY() as CaseId;
      `);

    return result.recordset[0].CaseId;
  } catch (error) {
    console.error("Error creating case:", error);
    throw error;
  }
}

/**
 * Get cases by attorney ID with filtering
 * @param {number} attorneyId - Attorney ID
 * @param {string} status - Optional status filter
 * @returns {Array} Array of cases
 */
async function getCasesByAttorney(attorneyId, status = null) {
  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM dbo.JurorApplications ja WHERE ja.CaseId = c.CaseId AND ja.Status = 'approved') as ApprovedJurors,
        (SELECT COUNT(*) FROM dbo.JurorApplications ja WHERE ja.CaseId = c.CaseId AND ja.Status = 'pending') as PendingApplications
      FROM dbo.Cases c
      WHERE c.AttorneyId = @attorneyId
    `;

    const request = pool.request().input("attorneyId", attorneyId);

    if (status) {
      query += ` AND c.AttorneyStatus = @status`;
      request.input("status", status);
    }

    query += ` ORDER BY c.CreatedAt DESC`;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Error getting cases by attorney:", error);
    throw error;
  }
}

/**
 * Get available cases for jurors (active cases needing jurors)
 * @param {string} county - Juror's county for case matching
 * @returns {Array} Available cases for application
 */
async function getAvailableCasesForJurors(county) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("county", county).query(`
        SELECT 
          c.CaseId,
          c.CaseTitle,
          c.CaseDescription,
          c.ScheduledDate,
          c.ScheduledTime,
          c.PaymentAmount,
          c.RequiredJurors,
          (SELECT COUNT(*) FROM dbo.JurorApplications ja WHERE ja.CaseId = c.CaseId AND ja.Status = 'approved') as ApprovedJurors,
          a.LawFirmName
        FROM dbo.Cases c
        INNER JOIN dbo.Attorneys a ON c.AttorneyId = a.AttorneyId
        WHERE c.County = @county 
          AND c.AttorneyStatus = '${ATTORNEY_CASE_STATES.WAR_ROOM}'
          AND c.AdminApprovalStatus = 'approved'
          AND (SELECT COUNT(*) FROM dbo.JurorApplications ja WHERE ja.CaseId = c.CaseId AND ja.Status = 'approved') < c.RequiredJurors
        ORDER BY c.ScheduledDate ASC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting available cases for jurors:", error);
    throw error;
  }
}

/**
 * Update case status
 * @param {number} caseId - Case ID
 * @param {Object} statusUpdate - Status update object
 */
async function updateCaseStatus(caseId, statusUpdate) {
  try {
    const pool = await poolPromise;
    const updates = [];
    const request = pool.request().input("caseId", caseId);

    if (statusUpdate.attorneyStatus) {
      updates.push("AttorneyStatus = @attorneyStatus");
      request.input("attorneyStatus", statusUpdate.attorneyStatus);
    }

    if (statusUpdate.adminApprovalStatus) {
      updates.push("AdminApprovalStatus = @adminApprovalStatus");
      request.input("adminApprovalStatus", statusUpdate.adminApprovalStatus);

      if (statusUpdate.adminApprovalStatus === "approved") {
        updates.push("ApprovedAt = GETUTCDATE()");
        updates.push("AttorneyStatus = @newAttorneyStatus");
        request.input("newAttorneyStatus", ATTORNEY_CASE_STATES.WAR_ROOM);
      }
    }

    if (statusUpdate.adminComments) {
      updates.push("AdminComments = @adminComments");
      request.input("adminComments", statusUpdate.adminComments);
    }

    updates.push("UpdatedAt = GETUTCDATE()");

    await request.query(`
      UPDATE dbo.Cases 
      SET ${updates.join(", ")}
      WHERE CaseId = @caseId
    `);
  } catch (error) {
    console.error("Error updating case status:", error);
    throw error;
  }
}

/**
 * Get cases requiring admin approval
 * @returns {Array} Cases pending admin approval
 */
async function getCasesPendingAdminApproval() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        c.*,
        a.FirstName + ' ' + a.LastName as AttorneyName,
        a.LawFirmName,
        a.Email as AttorneyEmail,
        a.StateBarNumber
      FROM dbo.Cases c
      INNER JOIN dbo.Attorneys a ON c.AttorneyId = a.AttorneyId
      WHERE c.AdminApprovalStatus = 'pending'
      ORDER BY c.CreatedAt ASC
    `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting cases pending admin approval:", error);
    throw error;
  }
}

/**
 * Check if attorney can transition case to next state
 * @param {number} caseId - Case ID
 * @param {string} newStatus - Desired new status
 * @returns {Object} Validation result
 */
async function validateCaseStateTransition(caseId, newStatus) {
  try {
    const caseData = await findById(caseId);
    if (!caseData) {
      return { valid: false, message: "Case not found" };
    }

    const currentStatus = caseData.AttorneyStatus;

    // Define valid transitions
    const validTransitions = {
      [ATTORNEY_CASE_STATES.PENDING_ADMIN_APPROVAL]: [
        ATTORNEY_CASE_STATES.WAR_ROOM,
      ],
      [ATTORNEY_CASE_STATES.WAR_ROOM]: [ATTORNEY_CASE_STATES.JOIN_TRIAL],
      [ATTORNEY_CASE_STATES.JOIN_TRIAL]: [ATTORNEY_CASE_STATES.VIEW_DETAILS],
    };

    if (
      !validTransitions[currentStatus] ||
      !validTransitions[currentStatus].includes(newStatus)
    ) {
      return {
        valid: false,
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
      };
    }

    // Additional validation based on specific transitions
    if (newStatus === ATTORNEY_CASE_STATES.JOIN_TRIAL) {
      const approvedJurors = await getApprovedJurorsCount(caseId);
      if (approvedJurors < caseData.RequiredJurors) {
        return {
          valid: false,
          message: `Need ${caseData.RequiredJurors} approved jurors, only have ${approvedJurors}`,
        };
      }
    }

    return { valid: true, message: "Transition allowed" };
  } catch (error) {
    console.error("Error validating case state transition:", error);
    throw error;
  }
}

/**
 * Get count of approved jurors for a case
 * @param {number} caseId - Case ID
 * @returns {number} Count of approved jurors
 */
async function getApprovedJurorsCount(caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT COUNT(*) as count
        FROM dbo.JurorApplications
        WHERE CaseId = @caseId AND Status = 'approved'
      `);

    return result.recordset[0].count;
  } catch (error) {
    console.error("Error getting approved jurors count:", error);
    throw error;
  }
}

/**
 * Legacy support: Get cases in ScheduledTrials format for backwards compatibility
 * @param {number} attorneyId - Attorney ID
 * @returns {Array} Cases in legacy format
 */
async function getCasesLegacyFormat(attorneyId) {
  try {
    const cases = await getCasesByAttorney(attorneyId);

    // Transform to match legacy ScheduledTrials format
    return cases.map((caseItem) => ({
      Id: caseItem.CaseId,
      County: caseItem.County,
      CaseType: caseItem.CaseType,
      CaseTier: caseItem.CaseTier,
      CaseDescription: caseItem.CaseDescription,
      PaymentMethod: caseItem.PaymentMethod,
      PaymentAmount: caseItem.PaymentAmount,
      PlaintiffGroups: caseItem.PlaintiffGroups,
      DefendantGroups: caseItem.DefendantGroups,
      ScheduledDate: caseItem.ScheduledDate,
      ScheduledTime: caseItem.ScheduledTime,
      Name: caseItem.CaseTitle, // Map title back to name for legacy support
      Email: "", // Will be filled by route handler
      UserId: attorneyId,
      AttorneyStatus: caseItem.AttorneyStatus,
      AdminApprovalStatus: caseItem.AdminApprovalStatus,
    }));
  } catch (error) {
    console.error("Error getting cases in legacy format:", error);
    throw error;
  }
}

module.exports = {
  ATTORNEY_CASE_STATES,
  JUROR_CASE_STATES,
  findById,
  createCase,
  getCasesByAttorney,
  getAvailableCasesForJurors,
  updateCaseStatus,
  getCasesPendingAdminApproval,
  validateCaseStateTransition,
  getApprovedJurorsCount,
  getCasesLegacyFormat,
};
