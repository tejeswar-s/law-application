const { poolPromise } = require("../config/db");
const crypto = require("crypto");

/**
 * Create a password reset token
 * @param {string} email - User email
 * @param {string} userType - 'attorney' or 'juror'
 * @returns {Object} Reset token details
 */
async function createPasswordResetToken(email, userType) {
  try {
    const pool = await poolPromise;

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set expiration time (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this email
    await pool.request().input("email", email).input("userType", userType)
      .query(`
        DELETE FROM PasswordResets 
        WHERE Email = @email AND UserType = @userType
      `);

    // Insert new reset token
    await pool
      .request()
      .input("email", email)
      .input("userType", userType)
      .input("hashedToken", hashedToken)
      .input("expiresAt", expiresAt).query(`
        INSERT INTO PasswordResets (Email, UserType, TokenHash, ExpiresAt, CreatedAt)
        VALUES (@email, @userType, @hashedToken, @expiresAt, GETUTCDATE())
      `);

    return {
      token: resetToken,
      expiresAt,
    };
  } catch (error) {
    console.error("Error creating password reset token:", error);
    throw error;
  }
}

/**
 * Verify password reset token
 * @param {string} token - Reset token
 * @param {string} userType - 'attorney' or 'juror'
 * @returns {Object|null} Token details or null if invalid
 */
async function verifyPasswordResetToken(token, userType) {
  try {
    const pool = await poolPromise;

    // Hash the provided token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const result = await pool
      .request()
      .input("hashedToken", hashedToken)
      .input("userType", userType).query(`
        SELECT Email, ExpiresAt, CreatedAt
        FROM PasswordResets 
        WHERE TokenHash = @hashedToken 
          AND UserType = @userType 
          AND ExpiresAt > GETUTCDATE()
          AND UsedAt IS NULL
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    return result.recordset[0];
  } catch (error) {
    console.error("Error verifying password reset token:", error);
    throw error;
  }
}

/**
 * Mark password reset token as used
 * @param {string} token - Reset token
 * @param {string} userType - 'attorney' or 'juror'
 */
async function markTokenAsUsed(token, userType) {
  try {
    const pool = await poolPromise;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await pool
      .request()
      .input("hashedToken", hashedToken)
      .input("userType", userType).query(`
        UPDATE PasswordResets 
        SET UsedAt = GETUTCDATE() 
        WHERE TokenHash = @hashedToken AND UserType = @userType
      `);
  } catch (error) {
    console.error("Error marking token as used:", error);
    throw error;
  }
}

/**
 * Clean up expired tokens (run periodically)
 */
async function cleanupExpiredTokens() {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
        DELETE FROM PasswordResets 
        WHERE ExpiresAt < GETUTCDATE() OR UsedAt IS NOT NULL
      `);

    console.log(
      `Cleaned up ${result.rowsAffected[0]} expired/used password reset tokens`
    );
    return result.rowsAffected[0];
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
    throw error;
  }
}

/**
 * Get reset attempt count for email (to prevent abuse)
 * @param {string} email - User email
 * @param {number} timeWindowMinutes - Time window in minutes (default: 15)
 * @returns {number} Number of attempts in time window
 */
async function getResetAttemptCount(email, timeWindowMinutes = 15) {
  try {
    const pool = await poolPromise;

    const windowStart = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    const result = await pool
      .request()
      .input("email", email)
      .input("windowStart", windowStart).query(`
        SELECT COUNT(*) as count
        FROM PasswordResets 
        WHERE Email = @email AND CreatedAt > @windowStart
      `);

    return result.recordset[0].count;
  } catch (error) {
    console.error("Error getting reset attempt count:", error);
    throw error;
  }
}

module.exports = {
  createPasswordResetToken,
  verifyPasswordResetToken,
  markTokenAsUsed,
  cleanupExpiredTokens,
  getResetAttemptCount,
};
