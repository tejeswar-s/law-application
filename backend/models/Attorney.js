const { poolPromise } = require("../config/db");

/**
 * Find attorney by email
 * @param {string} email - Attorney email
 * @returns {Object|null} Attorney record or null
 */
async function findByEmail(email) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("email", email).query(`
        SELECT 
          AttorneyId,
          IsAttorney,
          FirstName,
          MiddleName,
          LastName,
          LawFirmName,
          PhoneNumber,
          State,
          StateBarNumber,
          OfficeAddress1,
          OfficeAddress2,
          County,
          City,
          ZipCode,
          Email,
          PasswordHash,
          UserAgreementAccepted,
          AgreementAcceptedAt,
          IsVerified,
          VerificationStatus,
          VerifiedAt,
          CreatedAt,
          UpdatedAt,
          LastLoginAt
        FROM dbo.Attorneys 
        WHERE Email = @email
      `);
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error finding attorney by email:", error);
    throw error;
  }
}

/**
 * Find attorney by ID
 * @param {number} attorneyId - Attorney ID
 * @returns {Object|null} Attorney record or null
 */
async function findById(attorneyId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("attorneyId", attorneyId).query(`
        SELECT 
          AttorneyId,
          IsAttorney,
          FirstName,
          MiddleName,
          LastName,
          LawFirmName,
          PhoneNumber,
          State,
          StateBarNumber,
          OfficeAddress1,
          OfficeAddress2,
          County,
          City,
          ZipCode,
          Email,
          UserAgreementAccepted,
          AgreementAcceptedAt,
          IsVerified,
          VerificationStatus,
          VerifiedAt,
          CreatedAt,
          UpdatedAt,
          LastLoginAt
        FROM dbo.Attorneys 
        WHERE AttorneyId = @attorneyId
      `);
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error finding attorney by ID:", error);
    throw error;
  }
}

/**
 * Create new attorney record
 * @param {Object} data - Attorney registration data
 * @returns {number} New attorney ID
 */
async function createAttorney(data) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("isAttorney", data.isAttorney)
      .input("firstName", data.firstName)
      .input("middleName", data.middleName || null)
      .input("lastName", data.lastName)
      .input("lawFirmName", data.lawFirmName)
      .input("phoneNumber", data.phoneNumber)
      .input("state", data.state)
      .input("stateBarNumber", data.stateBarNumber)
      .input("officeAddress1", data.officeAddress1)
      .input("officeAddress2", data.officeAddress2 || null)
      .input("county", data.county)
      .input("city", data.city)
      .input("zipCode", data.zipCode)
      .input("email", data.email)
      .input("passwordHash", data.passwordHash)
      .input("userAgreementAccepted", data.userAgreementAccepted).query(`
        INSERT INTO dbo.Attorneys (
          IsAttorney,
          FirstName,
          MiddleName,
          LastName,
          LawFirmName,
          PhoneNumber,
          State,
          StateBarNumber,
          OfficeAddress1,
          OfficeAddress2,
          County,
          City,
          ZipCode,
          Email,
          PasswordHash,
          UserAgreementAccepted,
          AgreementAcceptedAt,
          IsVerified,
          VerificationStatus,
          CreatedAt,
          UpdatedAt
        ) VALUES (
          @isAttorney,
          @firstName,
          @middleName,
          @lastName,
          @lawFirmName,
          @phoneNumber,
          @state,
          @stateBarNumber,
          @officeAddress1,
          @officeAddress2,
          @county,
          @city,
          @zipCode,
          @email,
          @passwordHash,
          @userAgreementAccepted,
          CASE WHEN @userAgreementAccepted = 1 THEN GETUTCDATE() ELSE NULL END,
          0,
          'pending',
          GETUTCDATE(),
          GETUTCDATE()
        );
        SELECT SCOPE_IDENTITY() as AttorneyId;
      `);

    return result.recordset[0].AttorneyId;
  } catch (error) {
    console.error("Error creating attorney:", error);
    throw error;
  }
}

/**
 * Update attorney's last login time
 * @param {number} attorneyId - Attorney ID
 */
async function updateLastLogin(attorneyId) {
  try {
    const pool = await poolPromise;
    await pool.request().input("attorneyId", attorneyId).query(`
        UPDATE dbo.Attorneys 
        SET LastLoginAt = GETUTCDATE(),
            UpdatedAt = GETUTCDATE()
        WHERE AttorneyId = @attorneyId
      `);
  } catch (error) {
    console.error("Error updating last login:", error);
    throw error;
  }
}

/**
 * Update attorney verification status
 * @param {number} attorneyId - Attorney ID
 * @param {string} status - Verification status (pending, verified, rejected)
 */
async function updateVerificationStatus(attorneyId, status) {
  try {
    const pool = await poolPromise;
    await pool.request().input("attorneyId", attorneyId).input("status", status)
      .query(`
        UPDATE dbo.Attorneys 
        SET VerificationStatus = @status,
            IsVerified = CASE WHEN @status = 'verified' THEN 1 ELSE 0 END,
            VerifiedAt = CASE WHEN @status = 'verified' THEN GETUTCDATE() ELSE NULL END,
            UpdatedAt = GETUTCDATE()
        WHERE AttorneyId = @attorneyId
      `);
  } catch (error) {
    console.error("Error updating verification status:", error);
    throw error;
  }
}

/**
 * Check if state bar number already exists
 * @param {string} stateBarNumber - State bar number
 * @param {string} state - State
 * @returns {boolean} True if exists
 */
async function checkStateBarNumberExists(stateBarNumber, state) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("stateBarNumber", stateBarNumber)
      .input("state", state).query(`
        SELECT COUNT(*) as count 
        FROM dbo.Attorneys 
        WHERE StateBarNumber = @stateBarNumber AND State = @state
      `);
    return result.recordset[0].count > 0;
  } catch (error) {
    console.error("Error checking state bar number:", error);
    throw error;
  }
}

/**
 * Get all attorneys with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated attorneys list
 */
async function getAllAttorneys(page = 1, limit = 10) {
  try {
    const pool = await poolPromise;
    const offset = (page - 1) * limit;

    const result = await pool
      .request()
      .input("limit", limit)
      .input("offset", offset).query(`
        SELECT 
          AttorneyId,
          FirstName,
          LastName,
          LawFirmName,
          Email,
          State,
          VerificationStatus,
          IsVerified,
          CreatedAt
        FROM dbo.Attorneys
        ORDER BY CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
        
        SELECT COUNT(*) as total FROM dbo.Attorneys;
      `);

    return {
      attorneys: result.recordsets[0],
      total: result.recordsets[1][0].total,
      page,
      limit,
      totalPages: Math.ceil(result.recordsets[1][0].total / limit),
    };
  } catch (error) {
    console.error("Error getting all attorneys:", error);
    throw error;
  }
}

/**
 * Update attorney password
 * @param {number} attorneyId - Attorney ID
 * @param {string} passwordHash - New password hash
 */
async function updatePassword(attorneyId, passwordHash) {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("attorneyId", attorneyId)
      .input("passwordHash", passwordHash).query(`
        UPDATE dbo.Attorneys
        SET PasswordHash = @passwordHash,
            UpdatedAt = GETUTCDATE()
        WHERE AttorneyId = @attorneyId
      `);
  } catch (error) {
    console.error("Error updating attorney password:", error);
    throw error;
  }
}

/**
 * Update attorney profile
 * @param {number} attorneyId - Attorney ID
 * @param {Object} data - Profile data to update
 */
async function updateProfile(attorneyId, data) {
  try {
    const pool = await poolPromise;
    const updates = [];
    const inputs = [];

    if (data.firstName !== undefined) {
      updates.push("FirstName = @firstName");
      inputs.push({ name: "firstName", value: data.firstName });
    }
    if (data.lastName !== undefined) {
      updates.push("LastName = @lastName");
      inputs.push({ name: "lastName", value: data.lastName });
    }
    if (data.phoneNumber !== undefined) {
      updates.push("PhoneNumber = @phoneNumber");
      inputs.push({ name: "phoneNumber", value: data.phoneNumber });
    }

    if (updates.length === 0) {
      throw new Error("No fields to update");
    }

    updates.push("UpdatedAt = GETUTCDATE()");

    const request = pool.request().input("attorneyId", attorneyId);
    inputs.forEach((input) => request.input(input.name, input.value));

    await request.query(`
      UPDATE dbo.Attorneys
      SET ${updates.join(", ")}
      WHERE AttorneyId = @attorneyId
    `);
  } catch (error) {
    console.error("Error updating attorney profile:", error);
    throw error;
  }
}

/**
 * Delete attorney account
 * @param {number} attorneyId - Attorney ID
 */
async function deleteAttorney(attorneyId) {
  try {
    const pool = await poolPromise;
    await pool.request().input("attorneyId", attorneyId).query(`
      DELETE FROM dbo.Attorneys
      WHERE AttorneyId = @attorneyId
    `);
  } catch (error) {
    console.error("Error deleting attorney:", error);
    throw error;
  }
}

module.exports = {
  findByEmail,
  findById,
  createAttorney,
  updateLastLogin,
  updateVerificationStatus,
  checkStateBarNumberExists,
  getAllAttorneys,
  updatePassword,
  updateProfile,
  deleteAttorney,
};
