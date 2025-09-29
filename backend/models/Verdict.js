const { poolPromise } = require("../config/db");

/**
 * Verdict Model - Handles jury verdict collection and analysis
 */

// Verdict decisions
const VERDICT_DECISIONS = {
  PLAINTIFF: "plaintiff",
  DEFENDANT: "defendant",
  SPLIT: "split",
};

/**
 * Submit verdict from juror
 * @param {Object} verdictData - Verdict submission data
 * @returns {number} New verdict ID
 */
async function submitVerdict(verdictData) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("caseId", verdictData.caseId)
      .input("jurorId", verdictData.jurorId)
      .input("decision", verdictData.decision)
      .input("damageAmount", verdictData.damageAmount || null)
      .input("reasoning", verdictData.reasoning || null)
      .input("confidenceLevel", verdictData.confidenceLevel || null)
      .input(
        "verdictResponses",
        JSON.stringify(verdictData.verdictResponses || [])
      )
      .input("isAnonymous", verdictData.isAnonymous !== false) // Default to true
      .query(`
        INSERT INTO dbo.Verdicts (
          CaseId, JurorId, Decision, DamageAmount, Reasoning,
          ConfidenceLevel, VerdictResponses, IsAnonymous,
          SubmittedAt, CreatedAt
        ) VALUES (
          @caseId, @jurorId, @decision, @damageAmount, @reasoning,
          @confidenceLevel, @verdictResponses, @isAnonymous,
          GETUTCDATE(), GETUTCDATE()
        );
        SELECT SCOPE_IDENTITY() as VerdictId;
      `);

    return result.recordset[0].VerdictId;
  } catch (error) {
    console.error("Error submitting verdict:", error);
    throw error;
  }
}

/**
 * Get verdicts by case ID
 * @param {number} caseId - Case ID
 * @param {boolean} includeJurorInfo - Whether to include juror information
 * @returns {Array} Array of verdicts
 */
async function getVerdictsByCase(caseId, includeJurorInfo = false) {
  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        v.*,
        ${includeJurorInfo ? "j.Name as JurorName, j.Email as JurorEmail," : ""}
        CASE 
          WHEN v.IsAnonymous = 1 THEN 'Anonymous Juror'
          ELSE j.Name
        END as DisplayName
      FROM dbo.Verdicts v
      ${
        includeJurorInfo ? "INNER" : "LEFT"
      } JOIN dbo.Jurors j ON v.JurorId = j.JurorId
      WHERE v.CaseId = @caseId
      ORDER BY v.SubmittedAt ASC
    `;

    const result = await pool.request().input("caseId", caseId).query(query);

    return result.recordset;
  } catch (error) {
    console.error("Error getting verdicts by case:", error);
    throw error;
  }
}

/**
 * Get verdict summary/analysis for a case
 * @param {number} caseId - Case ID
 * @returns {Object} Verdict analysis summary
 */
async function getVerdictSummary(caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT 
          COUNT(*) as TotalVerdicts,
          SUM(CASE WHEN Decision = 'plaintiff' THEN 1 ELSE 0 END) as PlaintiffVotes,
          SUM(CASE WHEN Decision = 'defendant' THEN 1 ELSE 0 END) as DefendantVotes,
          SUM(CASE WHEN Decision = 'split' THEN 1 ELSE 0 END) as SplitVotes,
          AVG(CAST(DamageAmount as FLOAT)) as AverageDamageAmount,
          MIN(DamageAmount) as MinDamageAmount,
          MAX(DamageAmount) as MaxDamageAmount,
          AVG(CAST(ConfidenceLevel as FLOAT)) as AverageConfidence
        FROM dbo.Verdicts 
        WHERE CaseId = @caseId
      `);

    const summary = result.recordset[0];

    // Calculate percentages
    if (summary.TotalVerdicts > 0) {
      summary.PlaintiffPercentage =
        (summary.PlaintiffVotes / summary.TotalVerdicts) * 100;
      summary.DefendantPercentage =
        (summary.DefendantVotes / summary.TotalVerdicts) * 100;
      summary.SplitPercentage =
        (summary.SplitVotes / summary.TotalVerdicts) * 100;
    }

    // Determine majority decision
    if (
      summary.PlaintiffVotes > summary.DefendantVotes &&
      summary.PlaintiffVotes > summary.SplitVotes
    ) {
      summary.MajorityDecision = "plaintiff";
    } else if (
      summary.DefendantVotes > summary.PlaintiffVotes &&
      summary.DefendantVotes > summary.SplitVotes
    ) {
      summary.MajorityDecision = "defendant";
    } else if (
      summary.SplitVotes > summary.PlaintiffVotes &&
      summary.SplitVotes > summary.DefendantVotes
    ) {
      summary.MajorityDecision = "split";
    } else {
      summary.MajorityDecision = "tied";
    }

    return summary;
  } catch (error) {
    console.error("Error getting verdict summary:", error);
    throw error;
  }
}

/**
 * Check if juror has submitted verdict for case
 * @param {number} jurorId - Juror ID
 * @param {number} caseId - Case ID
 * @returns {boolean} True if verdict submitted
 */
async function hasJurorSubmittedVerdict(jurorId, caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("jurorId", jurorId)
      .input("caseId", caseId).query(`
        SELECT COUNT(*) as count
        FROM dbo.Verdicts
        WHERE JurorId = @jurorId AND CaseId = @caseId
      `);

    return result.recordset[0].count > 0;
  } catch (error) {
    console.error("Error checking if juror submitted verdict:", error);
    throw error;
  }
}

/**
 * Get cases needing verdicts for a juror
 * @param {number} jurorId - Juror ID
 * @returns {Array} Cases where juror needs to submit verdict
 */
async function getCasesNeedingVerdicts(jurorId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("jurorId", jurorId).query(`
        SELECT 
          c.CaseId,
          c.CaseTitle,
          c.CaseDescription,
          c.ScheduledDate,
          c.PaymentAmount,
          a.LawFirmName
        FROM dbo.Cases c
        INNER JOIN dbo.JurorApplications ja ON c.CaseId = ja.CaseId
        INNER JOIN dbo.Attorneys a ON c.AttorneyId = a.AttorneyId
        WHERE ja.JurorId = @jurorId 
          AND ja.Status = 'approved'
          AND c.AttorneyStatus = 'view_details'
          AND NOT EXISTS (
            SELECT 1 FROM dbo.Verdicts v 
            WHERE v.CaseId = c.CaseId AND v.JurorId = @jurorId
          )
        ORDER BY c.ScheduledDate ASC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting cases needing verdicts:", error);
    throw error;
  }
}

/**
 * Get verdict by ID
 * @param {number} verdictId - Verdict ID
 * @returns {Object} Verdict details
 */
async function findById(verdictId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("verdictId", verdictId).query(`
        SELECT 
          v.*,
          c.CaseTitle,
          j.Name as JurorName,
          CASE 
            WHEN v.IsAnonymous = 1 THEN 'Anonymous Juror'
            ELSE j.Name
          END as DisplayName
        FROM dbo.Verdicts v
        INNER JOIN dbo.Cases c ON v.CaseId = c.CaseId
        LEFT JOIN dbo.Jurors j ON v.JurorId = j.JurorId
        WHERE v.VerdictId = @verdictId
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error finding verdict by ID:", error);
    throw error;
  }
}

/**
 * Get verdict completion status for a case
 * @param {number} caseId - Case ID
 * @returns {Object} Completion status and progress
 */
async function getVerdictCompletionStatus(caseId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("caseId", caseId).query(`
        SELECT 
          (SELECT COUNT(*) FROM dbo.JurorApplications WHERE CaseId = @caseId AND Status = 'approved') as RequiredVerdicts,
          (SELECT COUNT(*) FROM dbo.Verdicts WHERE CaseId = @caseId) as SubmittedVerdicts
      `);

    const status = result.recordset[0];
    status.IsComplete = status.SubmittedVerdicts >= status.RequiredVerdicts;
    status.CompletionPercentage =
      status.RequiredVerdicts > 0
        ? (status.SubmittedVerdicts / status.RequiredVerdicts) * 100
        : 0;

    return status;
  } catch (error) {
    console.error("Error getting verdict completion status:", error);
    throw error;
  }
}

/**
 * Get recent verdicts for admin dashboard
 * @param {number} limit - Number of verdicts to return
 * @returns {Array} Recent verdicts
 */
async function getRecentVerdicts(limit = 10) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("limit", limit).query(`
        SELECT TOP (@limit)
          v.*,
          c.CaseTitle,
          CASE 
            WHEN v.IsAnonymous = 1 THEN 'Anonymous Juror'
            ELSE j.Name
          END as DisplayName
        FROM dbo.Verdicts v
        INNER JOIN dbo.Cases c ON v.CaseId = c.CaseId
        LEFT JOIN dbo.Jurors j ON v.JurorId = j.JurorId
        ORDER BY v.SubmittedAt DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting recent verdicts:", error);
    throw error;
  }
}

module.exports = {
  VERDICT_DECISIONS,
  submitVerdict,
  getVerdictsByCase,
  getVerdictSummary,
  hasJurorSubmittedVerdict,
  getCasesNeedingVerdicts,
  findById,
  getVerdictCompletionStatus,
  getRecentVerdicts,
};
