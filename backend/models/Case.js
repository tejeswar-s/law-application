// =============================================
// Case Model - Complete Case Management
// =============================================

const { poolPromise } = require("../config/db");

// Case status constants
const ATTORNEY_CASE_STATES = {
  PENDING_ADMIN_APPROVAL: "pending",
  WAR_ROOM: "war_room",
  JOIN_TRIAL: "join_trial",
  VIEW_DETAILS: "view_details",
};

const ADMIN_APPROVAL_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

/**
 * Create new case
 */
async function createCase(caseData) {
  try {
    const pool = await poolPromise;

    // Parse groups if they're strings
    const plaintiffGroups =
      typeof caseData.plaintiffGroups === "string"
        ? JSON.parse(caseData.plaintiffGroups)
        : caseData.plaintiffGroups;
    const defendantGroups =
      typeof caseData.defendantGroups === "string"
        ? JSON.parse(caseData.defendantGroups)
        : caseData.defendantGroups;

    const result = await pool
      .request()
      .input("attorneyId", caseData.attorneyId)
      .input("caseType", caseData.caseType)
      .input("caseTier", caseData.caseTier)
      .input("county", caseData.county)
      .input("caseTitle", caseData.caseTitle)
      .input("caseDescription", caseData.caseDescription || "")
      .input("paymentMethod", caseData.paymentMethod || "")
      .input("paymentAmount", parseFloat(caseData.paymentAmount) || 0)
      .input("scheduledDate", caseData.scheduledDate)
      .input("scheduledTime", caseData.scheduledTime)
      .input("plaintiffGroups", JSON.stringify(plaintiffGroups))
      .input("defendantGroups", JSON.stringify(defendantGroups))
      .input("voirDire1Questions", JSON.stringify(caseData.voirDire1Questions || []))
      .input("voirDire2Questions", JSON.stringify(caseData.voirDire2Questions || []))
      .input("attorneyStatus", ATTORNEY_CASE_STATES.PENDING_ADMIN_APPROVAL) // CRITICAL: Start as pending
      .input("adminApprovalStatus", ADMIN_APPROVAL_STATUSES.PENDING) // CRITICAL: Pending admin approval
      .query(`
        INSERT INTO dbo.Cases (
          AttorneyId, CaseType, CaseTier, County,
          CaseTitle, CaseDescription, PaymentMethod, PaymentAmount,
          ScheduledDate, ScheduledTime,
          PlaintiffGroups, DefendantGroups,
          VoirDire1Questions, VoirDire2Questions,
          AttorneyStatus, AdminApprovalStatus,
          CreatedAt, UpdatedAt
        )
        VALUES (
          @attorneyId, @caseType, @caseTier, @county,
          @caseTitle, @caseDescription, @paymentMethod, @paymentAmount,
          @scheduledDate, @scheduledTime,
          @plaintiffGroups, @defendantGroups,
          @voirDire1Questions, @voirDire2Questions,
          @attorneyStatus, @adminApprovalStatus,
          GETUTCDATE(), GETUTCDATE()
        );
        SELECT SCOPE_IDENTITY() AS CaseId;
      `);

    return result.recordset[0].CaseId;
  } catch (error) {
    console.error("Create case error:", error);
    throw error;
  }
}

/**
 * Find case by ID
 */
async function findById(caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT 
          c.*,
          a.FirstName + ' ' + a.LastName AS AttorneyName,
          a.Email AS AttorneyEmail,
          a.LawFirmName
        FROM dbo.Cases c
        LEFT JOIN dbo.Attorneys a ON c.AttorneyId = a.AttorneyId
        WHERE c.CaseId = @caseId
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("Find case by ID error:", error);
    throw error;
  }
}

/**
 * Get cases by attorney
 */
async function getCasesByAttorney(attorneyId, status = null) {
  try {
    const pool = await poolPromise;
    let query = `
      SELECT * FROM dbo.Cases 
      WHERE AttorneyId = @attorneyId
    `;

    if (status) {
      query += ` AND AttorneyStatus = @status`;
    }

    query += ` ORDER BY CreatedAt DESC`;

    const request = pool.request().input("attorneyId", attorneyId);

    if (status) {
      request.input("status", status);
    }

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Get cases by attorney error:", error);
    throw error;
  }
}

/**
 * Get cases pending admin approval
 */
async function getCasesPendingAdminApproval() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        c.*,
        a.FirstName + ' ' + a.LastName AS AttorneyName,
        a.Email AS AttorneyEmail,
        a.LawFirmName
      FROM dbo.Cases c
      LEFT JOIN dbo.Attorneys a ON c.AttorneyId = a.AttorneyId
      WHERE c.AdminApprovalStatus = 'pending'
      ORDER BY c.CreatedAt DESC
    `);

    return result.recordset;
  } catch (error) {
    console.error("Get pending cases error:", error);
    throw error;
  }
}

/**
 * Get available cases for jurors (war_room status and approved by admin)
 */
async function getAvailableCasesForJurors(county = null) {
  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        c.*,
        a.FirstName + ' ' + a.LastName AS AttorneyName,
        a.LawFirmName
      FROM dbo.Cases c
      LEFT JOIN dbo.Attorneys a ON c.AttorneyId = a.AttorneyId
      WHERE c.AttorneyStatus = 'war_room'
        AND c.AdminApprovalStatus = 'approved'
    `;

    if (county) {
      query += ` AND c.County = @county`;
    }

    query += ` ORDER BY c.ScheduledDate ASC`;

    const request = pool.request();
    if (county) {
      request.input("county", county);
    }

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Get available cases for jurors error:", error);
    throw error;
  }
}

/**
 * Update case status
 */
async function updateCaseStatus(caseId, statusUpdates) {
  try {
    const pool = await poolPromise;
    const { attorneyStatus, adminApprovalStatus, adminComments } =
      statusUpdates;

    let query = `UPDATE dbo.Cases SET UpdatedAt = GETUTCDATE()`;
    const request = pool.request().input("caseId", caseId);

    if (attorneyStatus !== undefined) {
      query += `, AttorneyStatus = @attorneyStatus`;
      request.input("attorneyStatus", attorneyStatus);
    }

    if (adminApprovalStatus !== undefined) {
      query += `, AdminApprovalStatus = @adminApprovalStatus`;
      request.input("adminApprovalStatus", adminApprovalStatus);

      // When admin approves, transition to war_room
      if (adminApprovalStatus === "approved") {
        query += `, AttorneyStatus = @warRoomStatus, ApprovedAt = GETUTCDATE()`;
        request.input("warRoomStatus", ATTORNEY_CASE_STATES.WAR_ROOM);
      }
    }

    if (adminComments !== undefined) {
      query += `, AdminComments = @adminComments`;
      request.input("adminComments", adminComments);
    }

    query += ` WHERE CaseId = @caseId`;

    await request.query(query);
    return true;
  } catch (error) {
    console.error("Update case status error:", error);
    throw error;
  }
}

/**
 * Validate case state transition
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
      pending: [], // Cannot transition from pending until admin approves
      war_room: ["join_trial"],
      join_trial: ["view_details"],
      view_details: [], // Final state
    };

    if (!validTransitions[currentStatus]) {
      return { valid: false, message: "Invalid current status" };
    }

    if (!validTransitions[currentStatus].includes(newStatus)) {
      return {
        valid: false,
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
      };
    }

    // Additional validation for specific transitions
    if (newStatus === ATTORNEY_CASE_STATES.JOIN_TRIAL) {
      // Check if case is approved by admin
      if (caseData.AdminApprovalStatus !== "approved") {
        return {
          valid: false,
          message: "Case must be approved by admin before starting trial",
        };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error("Validate case state transition error:", error);
    throw error;
  }
}

/**
 * Get case statistics for admin dashboard
 */
async function getCaseStatistics() {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as TotalCases,
        SUM(CASE WHEN AdminApprovalStatus = 'pending' THEN 1 ELSE 0 END) as PendingApproval,
        SUM(CASE WHEN AdminApprovalStatus = 'approved' THEN 1 ELSE 0 END) as Approved,
        SUM(CASE WHEN AdminApprovalStatus = 'rejected' THEN 1 ELSE 0 END) as Rejected,
        SUM(CASE WHEN AttorneyStatus = 'war_room' THEN 1 ELSE 0 END) as InWarRoom,
        SUM(CASE WHEN AttorneyStatus = 'join_trial' THEN 1 ELSE 0 END) as InTrial,
        SUM(CASE WHEN AttorneyStatus = 'view_details' THEN 1 ELSE 0 END) as Completed
      FROM dbo.Cases
    `);

    return result.recordset[0];
  } catch (error) {
    console.error("Get case statistics error:", error);
    throw error;
  }
}

module.exports = {
  createCase,
  findById,
  getCasesByAttorney,
  getCasesPendingAdminApproval,
  getAvailableCasesForJurors,
  updateCaseStatus,
  validateCaseStateTransition,
  getCaseStatistics,
  ATTORNEY_CASE_STATES,
  ADMIN_APPROVAL_STATUSES,
};
// ```

// **Critical Changes:**
// - ✅ **Line 28-29**: Cases now start with `PENDING_ADMIN_APPROVAL` status
// - ✅ **Line 151**: When admin approves a case, it automatically transitions to `war_room` status
// - ✅ **Line 211-217**: Validation ensures cases can't move from pending until admin approves
// - ✅ **Updated comments** to clarify the correct flow

// ---

// ## **Flow Summary:**

// ### ✅ **Correct Case Status Flow:**
// ```
// 1. Attorney creates case
//    ↓
//    Status: "pending" (Pending Admin Approval)
//    ↓
// 2. Admin approves case
//    ↓
//    Status: "war_room" (Open for juror applications)
//    ↓
// 3. Attorney submits war room
//    ↓
//    Status: "join_trial" (Ready for trial)
//    ↓
// 4. Trial completes
//    ↓
//    Status: "view_details" (View verdicts)