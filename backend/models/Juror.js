/**
 * Update onboarding completion status
 * Automatically sets OnboardingCompleted = 1 when both video and quiz are completed
 * @param {number} jurorId - Juror ID
 */
async function updateOnboardingStatus(jurorId) {
  try {
    const pool = await poolPromise;
    await pool.request().input("jurorId", jurorId).query(`
      UPDATE dbo.Jurors
      SET OnboardingCompleted = CASE 
        WHEN IntroVideoCompleted = 1 AND JurorQuizCompleted = 1 THEN 1 
        ELSE 0 
      END,
      UpdatedAt = GETUTCDATE()
      WHERE JurorId = @jurorId
    `);
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    throw error;
  }
}

/**
 * Update juror profile
 * @param {number} jurorId - Juror ID
 * @param {Object} data - Fields to update: name, email, phone, passwordHash
 */
async function updateJurorProfile(jurorId, data) {
  try {
    const pool = await poolPromise;
    let query = "UPDATE dbo.Jurors SET ";
    const updates = [];
    if (data.name) updates.push(`Name = @name`);
    if (data.email) updates.push(`Email = @email`);
    if (data.phone) updates.push(`PhoneNumber = @phone`);
    if (data.passwordHash) updates.push(`PasswordHash = @passwordHash`);
    query += updates.join(", ");
    query += ", UpdatedAt = GETUTCDATE() WHERE JurorId = @jurorId";
    const request = pool.request().input("jurorId", jurorId);
    if (data.name) request.input("name", data.name);
    if (data.email) request.input("email", data.email);
    if (data.phone) request.input("phone", data.phone);
    if (data.passwordHash) request.input("passwordHash", data.passwordHash);
    await request.query(query);
  } catch (error) {
    console.error("Error updating juror profile:", error);
    throw error;
  }
}
const { poolPromise } = require("../config/db");

/**
 * Find juror by email
 * @param {string} email - Juror email
 * @returns {Object|null} Juror record or null
 */
async function findByEmail(email) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("email", email).query(`
        SELECT 
          JurorId,
          Name,
          PhoneNumber,
          Address1,
          Address2,
          City,
          State,
          ZipCode,
          County,
          MaritalStatus,
          SpouseEmployer,
          EmployerName,
          EmployerAddress,
          YearsInCounty,
          AgeRange,
          Gender,
          Education,
          PaymentMethod,
          Email,
          PasswordHash,
          CriteriaResponses,
          UserAgreementAccepted,
          AgreementAcceptedAt,
          IsVerified,
          VerificationStatus,
          VerifiedAt,
          IsActive,
          IntroVideoCompleted,
          JurorQuizCompleted,
          OnboardingCompleted,
          CreatedAt,
          UpdatedAt,
          LastLoginAt
        FROM dbo.Jurors 
        WHERE Email = @email
      `);
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error finding juror by email:", error);
    throw error;
  }
}

/**
 * Find juror by ID
 * @param {number} jurorId - Juror ID
 * @returns {Object|null} Juror record or null
 */
async function findById(jurorId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("jurorId", jurorId).query(`
        SELECT 
          JurorId,
          Name,
          PhoneNumber,
          Address1,
          Address2,
          City,
          State,
          ZipCode,
          County,
          MaritalStatus,
          SpouseEmployer,
          EmployerName,
          EmployerAddress,
          YearsInCounty,
          AgeRange,
          Gender,
          Education,
          PaymentMethod,
          Email,
          CriteriaResponses,
          UserAgreementAccepted,
          AgreementAcceptedAt,
          IsVerified,
          VerificationStatus,
          VerifiedAt,
          IsActive,
          IntroVideoCompleted,
          JurorQuizCompleted,
          OnboardingCompleted,
          CreatedAt,
          UpdatedAt,
          LastLoginAt
        FROM dbo.Jurors 
        WHERE JurorId = @jurorId
      `);
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error finding juror by ID:", error);
    throw error;
  }
}

/**
 * Create new juror record
 * @param {Object} data - Juror registration data
 * @returns {number} New juror ID
 */
async function createJuror(data) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("name", data.name)
      .input("phoneNumber", data.phoneNumber)
      .input("address1", data.address1)
      .input("address2", data.address2 || null)
      .input("city", data.city)
      .input("state", data.state)
      .input("zipCode", data.zipCode)
      .input("county", data.county)
      .input("maritalStatus", data.maritalStatus || null)
      .input("spouseEmployer", data.spouseEmployer || null)
      .input("employerName", data.employerName || null)
      .input("employerAddress", data.employerAddress || null)
      .input("yearsInCounty", data.yearsInCounty || null)
      .input("ageRange", data.ageRange || null)
      .input("gender", data.gender || null)
      .input("education", data.education || null)
      .input("paymentMethod", data.paymentMethod)
      .input("email", data.email)
      .input("passwordHash", data.passwordHash)
      .input("criteriaResponses", data.criteriaResponses || null)
      .input("userAgreementAccepted", data.userAgreementAccepted).query(`
        INSERT INTO dbo.Jurors (
          Name,
          PhoneNumber,
          Address1,
          Address2,
          City,
          State,
          ZipCode,
          County,
          MaritalStatus,
          SpouseEmployer,
          EmployerName,
          EmployerAddress,
          YearsInCounty,
          AgeRange,
          Gender,
          Education,
          PaymentMethod,
          Email,
          PasswordHash,
          CriteriaResponses,
          UserAgreementAccepted,
          AgreementAcceptedAt,
          IsVerified,
          VerificationStatus,
          IsActive,
          IntroVideoCompleted,
          JurorQuizCompleted,
          OnboardingCompleted,
          CreatedAt,
          UpdatedAt
        ) VALUES (
          @name,
          @phoneNumber,
          @address1,
          @address2,
          @city,
          @state,
          @zipCode,
          @county,
          @maritalStatus,
          @spouseEmployer,
          @employerName,
          @employerAddress,
          @yearsInCounty,
          @ageRange,
          @gender,
          @education,
          @paymentMethod,
          @email,
          @passwordHash,
          @criteriaResponses,
          @userAgreementAccepted,
          CASE WHEN @userAgreementAccepted = 1 THEN GETUTCDATE() ELSE NULL END,
          0,
          'pending',
          1,
          0,
          0,
          0,
          GETUTCDATE(),
          GETUTCDATE()
        );
        SELECT SCOPE_IDENTITY() as JurorId;
      `);

    return result.recordset[0].JurorId;
  } catch (error) {
    console.error("Error creating juror:", error);
    throw error;
  }
}

/**
 * Update juror's last login time
 * @param {number} jurorId - Juror ID
 */
async function updateLastLogin(jurorId) {
  try {
    const pool = await poolPromise;
    await pool.request().input("jurorId", jurorId).query(`
        UPDATE dbo.Jurors 
        SET LastLoginAt = GETUTCDATE(),
            UpdatedAt = GETUTCDATE()
        WHERE JurorId = @jurorId
      `);
  } catch (error) {
    console.error("Error updating last login:", error);
    throw error;
  }
}

/**
 * Update juror verification status
 * @param {number} jurorId - Juror ID
 * @param {string} status - Verification status (pending, verified, rejected)
 */
async function updateVerificationStatus(jurorId, status) {
  try {
    const pool = await poolPromise;
    await pool.request().input("jurorId", jurorId).input("status", status)
      .query(`
        UPDATE dbo.Jurors 
        SET VerificationStatus = @status,
            IsVerified = CASE WHEN @status = 'verified' THEN 1 ELSE 0 END,
            VerifiedAt = CASE WHEN @status = 'verified' THEN GETUTCDATE() ELSE NULL END,
            UpdatedAt = GETUTCDATE()
        WHERE JurorId = @jurorId
      `);
  } catch (error) {
    console.error("Error updating verification status:", error);
    throw error;
  }
}

/**
 * Update task completion status
 * @param {number} jurorId - Juror ID
 * @param {string} task - Task type (intro_video, juror_quiz, onboarding)
 * @param {boolean} completed - Completion status
 */
async function updateTaskCompletion(jurorId, task, completed = true) {
  try {
    const pool = await poolPromise;
    let query = "";

    switch (task) {
      case "intro_video":
        query = `
          UPDATE dbo.Jurors 
          SET IntroVideoCompleted = @completed,
              UpdatedAt = GETUTCDATE()
          WHERE JurorId = @jurorId
        `;
        break;
      case "juror_quiz":
        query = `
          UPDATE dbo.Jurors 
          SET JurorQuizCompleted = @completed,
              UpdatedAt = GETUTCDATE()
          WHERE JurorId = @jurorId
        `;
        break;
      case "onboarding":
        query = `
          UPDATE dbo.Jurors 
          SET OnboardingCompleted = @completed,
              UpdatedAt = GETUTCDATE()
          WHERE JurorId = @jurorId
        `;
        break;
      default:
        throw new Error("Invalid task type");
    }

    await pool
      .request()
      .input("jurorId", jurorId)
      .input("completed", completed)
      .query(query);
  } catch (error) {
    console.error("Error updating task completion:", error);
    throw error;
  }
}

/**
 * Get active jurors by county
 * @param {string} county - County name
 * @param {number} limit - Number of jurors to return
 * @returns {Array} List of active jurors
 */
async function getActiveJurorsByCounty(county, limit = 50) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("county", county)
      .input("limit", limit).query(`
        SELECT TOP(@limit)
          JurorId,
          Name,
          County,
          VerificationStatus,
          IsVerified,
          OnboardingCompleted,
          CreatedAt
        FROM dbo.Jurors
        WHERE County = @county 
          AND IsActive = 1 
          AND IsVerified = 1 
          AND OnboardingCompleted = 1
        ORDER BY CreatedAt DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting active jurors by county:", error);
    throw error;
  }
}

/**
 * Get all jurors with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated jurors list
 */
async function getAllJurors(page = 1, limit = 10) {
  try {
    const pool = await poolPromise;
    const offset = (page - 1) * limit;

    const result = await pool
      .request()
      .input("limit", limit)
      .input("offset", offset).query(`
        SELECT 
          JurorId,
          Name,
          Email,
          County,
          State,
          VerificationStatus,
          IsVerified,
          IsActive,
          OnboardingCompleted,
          CreatedAt
        FROM dbo.Jurors
        ORDER BY CreatedAt DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
        
        SELECT COUNT(*) as total FROM dbo.Jurors;
      `);

    return {
      jurors: result.recordsets[0],
      total: result.recordsets[1][0].total,
      page,
      limit,
      totalPages: Math.ceil(result.recordsets[1][0].total / limit),
    };
  } catch (error) {
    console.error("Error getting all jurors:", error);
    throw error;
  }
}

/**
 * Deactivate juror account
 * @param {number} jurorId - Juror ID
 */
async function deactivateJuror(jurorId) {
  try {
    const pool = await poolPromise;
    await pool.request().input("jurorId", jurorId).query(`
        UPDATE dbo.Jurors 
        SET IsActive = 0,
            UpdatedAt = GETUTCDATE()
        WHERE JurorId = @jurorId
      `);
  } catch (error) {
    console.error("Error deactivating juror:", error);
    throw error;
  }
}

/**
 * Update juror password
 * @param {number} jurorId - Juror ID
 * @param {string} passwordHash - New password hash
 */
async function updatePassword(jurorId, passwordHash) {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("jurorId", jurorId)
      .input("passwordHash", passwordHash).query(`
        UPDATE dbo.Jurors 
        SET PasswordHash = @passwordHash,
            UpdatedAt = GETUTCDATE()
        WHERE JurorId = @jurorId
      `);
  } catch (error) {
    console.error("Error updating juror password:", error);
    throw error;
  }
}

module.exports = {
  findByEmail,
  findById,
  createJuror,
  updateLastLogin,
  updateVerificationStatus,
  updateTaskCompletion,
  getActiveJurorsByCounty,
  getAllJurors,
  deactivateJuror,
  updatePassword,
  updateJurorProfile,
  updateOnboardingStatus,
};
