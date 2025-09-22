const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  findByEmail: findAttorneyByEmail,
  createAttorney,
  updateLastLogin: updateAttorneyLastLogin,
  checkStateBarNumberExists,
  updatePassword: updateAttorneyPassword,
} = require("../models/Attorney");
const {
  findByEmail: findJurorByEmail,
  createJuror,
  updateLastLogin: updateJurorLastLogin,
  updatePassword: updateJurorPassword,
} = require("../models/Juror");
const {
  validatePassword,
  validateEmail,
  validatePhone,
} = require("../utils/validator");
const { sendPasswordResetEmail } = require("../utils/email");
const { createAndSendEmailVerification } = require("../utils/email");
const { verifyEmailVerificationToken } = require("../utils/tokens");
const { checkEmailExists } = require("../utils/password");
const {
  createPasswordResetToken,
  verifyPasswordResetToken,
  markTokenAsUsed,
  getResetAttemptCount,
} = require("../models/PasswordReset");

/**
 * Attorney Signup
 */
async function attorneySignup(req, res) {
  console.log('✅ attorneySignup called, payload:', { ...req.body, password: req.body.password ? '[REDACTED]' : undefined });
  try {
    const {
      isAttorney,
      firstName,
      middleName,
      lastName,
      lawFirmName,
      phoneNumber,
      state,
      stateBarNumber,
      officeAddress1,
      officeAddress2,
      county,
      city,
      addressState,
      zipCode,
      email,
      password,
      userAgreementAccepted,
      verificationToken,
    } = req.body;
    // Require verification token
    if (!verificationToken) {
      return res
        .status(400)
        .json({
          message:
            "Email verification is required. Please verify your email before continuing.",
        });
    }
    // Validate verification token
    let decoded;
    try {
      decoded = verifyEmailVerificationToken(verificationToken);
    } catch (e) {
      if (e.name === "TokenExpiredError")
        return res
          .status(410)
          .json({
            message:
              "Verification link expired. Please request a new verification email.",
          });
      if (e.name === "JsonWebTokenError")
        return res.status(400).json({ message: "Invalid verification token." });
      return res
        .status(500)
        .json({ message: "Internal server error during verification." });
    }
    if (
      !decoded ||
      decoded.email !== email.toLowerCase().trim() ||
      decoded.userType !== "attorney"
    ) {
      return res
        .status(400)
        .json({
          message: "Verification token does not match the provided email.",
        });
    }

    // Basic validation
    const requiredFields = {
      isAttorney: "Attorney confirmation is required",
      firstName: "First name is required",
      lastName: "Last name is required",
      lawFirmName: "Law firm name is required",
      phoneNumber: "Phone number is required",
      state: "State is required",
      stateBarNumber: "State bar number is required",
      officeAddress1: "Office address is required",
      county: "County is required",
      city: "City is required",
      addressState: "Address state is required",
      zipCode: "ZIP code is required",
      email: "Email is required",
      password: "Password is required",
      userAgreementAccepted: "User agreement must be accepted",
    };

    // Check for missing required fields
    for (const [field, message] of Object.entries(requiredFields)) {
      if (!req.body[field] && field !== "userAgreementAccepted") {
        return res.status(400).json({ message });
      }
      if (field === "userAgreementAccepted" && !req.body[field]) {
        return res.status(400).json({ message });
      }
    }

    // Additional validations
    if (!isAttorney) {
      return res
        .status(400)
        .json({ message: "You must confirm you are the attorney registering" });
    }

    if (!userAgreementAccepted) {
      return res
        .status(400)
        .json({ message: "You must accept the user agreement" });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    // Validate phone number
    const phoneValidation = validatePhone(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ message: phoneValidation.error });
    }

    // Validate password
    const passwordValidation = validatePassword(
      password,
      firstName,
      lastName,
      email
    );
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.error });
    }

    // Check if email already exists
    const existingAttorney = await findAttorneyByEmail(
      email.toLowerCase().trim()
    );
    if (existingAttorney) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    // Check if state bar number already exists for this state
    const barNumberExists = await checkStateBarNumberExists(
      stateBarNumber,
      state
    );
    if (barNumberExists) {
      return res
        .status(409)
        .json({ message: "This state bar number is already registered" });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Prepare data for database
    const attorneyData = {
      isAttorney: Boolean(isAttorney),
      firstName: firstName.trim(),
      middleName: middleName?.trim() || null,
      lastName: lastName.trim(),
      lawFirmName: lawFirmName.trim(),
      phoneNumber: phoneNumber.trim(),
      state: state.trim(),
      stateBarNumber: stateBarNumber.trim(),
      officeAddress1: officeAddress1.trim(),
      officeAddress2: officeAddress2?.trim() || null,
      city: city.trim(),
      addressState: addressState.trim(),
      county: county.trim(), // <-- ADD THIS LINE
      zipCode: zipCode.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      userAgreementAccepted: Boolean(userAgreementAccepted),
    };

    // Create attorney record
    const attorneyId = await createAttorney(attorneyData);

    res.status(201).json({
      message: "Attorney account created successfully",
      attorneyId,
      status: "pending_verification",
    });
  } catch (error) {
    console.error("Attorney signup error:", error);
    res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
}

/**
 * Juror Signup
 */
async function jurorSignup(req, res) {
  try {
    const {
      // Criteria and personal info
      criteriaResponses,
      name,
      phoneNumber,
      address1,
      address2,
      city,
      state,
      zipCode,
      county,

      // Optional demographics
      maritalStatus,
      spouseEmployer,
      employerName,
      employerAddress,
      yearsInCounty,
      ageRange,
      gender,
      education,

      // Payment and auth
      paymentMethod,
      email,
      password,
      userAgreementAccepted,
    } = req.body;

    // Basic validation
    const requiredFields = {
      name: "Name is required",
      phoneNumber: "Phone number is required",
      address1: "Address is required",
      city: "City is required",
      state: "State is required",
      zipCode: "ZIP code is required",
      county: "County is required",
      paymentMethod: "Payment method is required",
      email: "Email is required",
      password: "Password is required",
      userAgreementAccepted: "User agreement must be accepted",
    };

    // Check for missing required fields
    for (const [field, message] of Object.entries(requiredFields)) {
      if (!req.body[field] && field !== "userAgreementAccepted") {
        return res.status(400).json({ message });
      }
      if (field === "userAgreementAccepted" && !req.body[field]) {
        return res.status(400).json({ message });
      }
    }

    // Validate payment method
    const validPaymentMethods = ["venmo", "paypal", "cashapp"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res
        .status(400)
        .json({ message: "Invalid payment method selected" });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    // Validate phone number
    const phoneValidation = validatePhone(phoneNumber);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ message: phoneValidation.error });
    }

    // Validate password
    const passwordValidation = validatePassword(
      password,
      name.split(" ")[0],
      name.split(" ").pop(),
      email
    );
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.error });
    }

    // Validate ZIP code format
    if (!/^\d{5}(-\d{4})?$/.test(zipCode.trim())) {
      return res.status(400).json({ message: "Please enter a valid ZIP code" });
    }

    // Validate state format (2 letters)
    if (!/^[A-Z]{2}$/.test(state.trim().toUpperCase())) {
      return res
        .status(400)
        .json({ message: "State must be 2 letters (e.g., TX)" });
    }

    // Check eligibility based on criteria responses
    if (criteriaResponses) {
      try {
        const criteria = JSON.parse(criteriaResponses);

        // Check disqualifying responses
        if (criteria.age === "no") {
          return res.status(400).json({
            message: "You must be at least 18 years old to serve as a juror",
          });
        }
        if (criteria.citizen === "no") {
          return res
            .status(400)
            .json({ message: "You must be a US citizen to serve as a juror" });
        }
        if (criteria.indictment === "yes") {
          return res.status(400).json({
            message:
              "Individuals currently under indictment are not eligible to serve",
          });
        }
      } catch (error) {
        return res
          .status(400)
          .json({ message: "Invalid criteria responses format" });
      }
    }

    // Check if email already exists
    const existingJuror = await findJurorByEmail(email.toLowerCase().trim());
    if (existingJuror) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Prepare data for database
    const jurorData = {
      // Required fields
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      address1: address1.trim(),
      address2: address2?.trim() || null,
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zipCode: zipCode.trim(),
      county: county.trim(),

      // Optional demographics
      maritalStatus: maritalStatus?.trim() || null,
      spouseEmployer: spouseEmployer?.trim() || null,
      employerName: employerName?.trim() || null,
      employerAddress: employerAddress?.trim() || null,
      yearsInCounty: yearsInCounty || null,
      ageRange: ageRange || null,
      gender: gender || null,
      education: education || null,

      // Payment and auth
      paymentMethod: paymentMethod.toLowerCase(),
      email: email.toLowerCase().trim(),
      passwordHash,
      criteriaResponses: criteriaResponses || null,
      userAgreementAccepted: Boolean(userAgreementAccepted),
    };

    // Create juror record
    const jurorId = await createJuror(jurorData);

    res.status(201).json({
      message: "Juror account created successfully",
      jurorId,
      status: "pending_verification",
    });
  } catch (error) {
    console.error("Juror signup error:", error);
    res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
}

/**
 * Attorney Login
 */
async function attorneyLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find attorney by email
    const attorney = await findAttorneyByEmail(email.toLowerCase().trim());
    if (!attorney) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, attorney.PasswordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Update last login
    await updateAttorneyLastLogin(attorney.AttorneyId);

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: attorney.AttorneyId,
        email: attorney.Email,
        type: "attorney",
        verified: attorney.IsVerified,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Prepare user data (excluding password hash)
    const userData = {
      attorneyId: attorney.AttorneyId,
      firstName: attorney.FirstName,
      lastName: attorney.LastName,
      email: attorney.Email,
      lawFirmName: attorney.LawFirmName,
      isVerified: attorney.IsVerified,
      verificationStatus: attorney.VerificationStatus,
    };

    res.json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Attorney login error:", error);
    res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
}

/**
 * Juror Login
 */
async function jurorLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find juror by email
    const juror = await findJurorByEmail(email.toLowerCase().trim());
    if (!juror) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if account is active
    if (!juror.IsActive) {
      return res.status(403).json({
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, juror.PasswordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Update last login
    await updateJurorLastLogin(juror.JurorId);

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: juror.JurorId,
        email: juror.Email,
        type: "juror",
        verified: juror.IsVerified,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Prepare user data (excluding password hash)
    const userData = {
      jurorId: juror.JurorId,
      name: juror.Name,
      email: juror.Email,
      county: juror.County,
      isVerified: juror.IsVerified,
      verificationStatus: juror.VerificationStatus,
      onboardingCompleted: juror.OnboardingCompleted,
      introVideoCompleted: juror.IntroVideoCompleted,
      jurorQuizCompleted: juror.JurorQuizCompleted,
    };

    res.json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Juror login error:", error);
    res
      .status(500)
      .json({ message: "Internal server error. Please try again later." });
  }
}

/**
 * Request Password Reset
 */
async function requestPasswordReset(req, res) {
  try {
    const { email, userType } = req.body;

    // Basic validation
    if (!email || !userType) {
      return res.status(400).json({
        message: "Email and user type are required",
      });
    }

    // Validate user type
    if (!["attorney", "juror"].includes(userType)) {
      return res.status(400).json({
        message: "Invalid user type",
      });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = null;
    if (userType === "attorney") {
      user = await findAttorneyByEmail(normalizedEmail);
    } else {
      user = await findJurorByEmail(normalizedEmail);
      // Check if juror account is active
      if (user && !user.IsActive) {
        return res.status(403).json({
          message: "Your account has been deactivated. Please contact support.",
        });
      }
    }

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    if (user) {
      // Check rate limiting
      const attemptCount = await getResetAttemptCount(normalizedEmail);
      if (attemptCount >= 3) {
        return res.status(429).json({
          message:
            "Too many password reset requests. Please wait before trying again.",
        });
      }

      // Create reset token
      const { token } = await createPasswordResetToken(
        normalizedEmail,
        userType
      );

      // Send reset email
      const emailSent = await sendPasswordResetEmail(
        normalizedEmail,
        token,
        userType
      );

      if (!emailSent) {
        console.error(
          "Failed to send password reset email for:",
          normalizedEmail
        );
      }
    }

    // Always return success message
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      message: "Internal server error. Please try again later.",
    });
  }
}

/**
 * Reset Password
 */
async function resetPassword(req, res) {
  try {
    const { token, userType, newPassword } = req.body;

    // Basic validation
    if (!token || !userType || !newPassword) {
      return res.status(400).json({
        message: "Token, user type, and new password are required",
      });
    }

    // Validate user type
    if (!["attorney", "juror"].includes(userType)) {
      return res.status(400).json({
        message: "Invalid user type",
      });
    }

    // Verify the reset token
    const tokenData = await verifyPasswordResetToken(token, userType);
    if (!tokenData) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // Find the user to get their name for password validation
    let user = null;
    if (userType === "attorney") {
      user = await findAttorneyByEmail(tokenData.Email);
    } else {
      user = await findJurorByEmail(tokenData.Email);
    }

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    // Validate new password
    let firstName, lastName;
    if (userType === "attorney") {
      firstName = user.FirstName;
      lastName = user.LastName;
    } else {
      const nameParts = user.Name.split(" ");
      firstName = nameParts[0];
      lastName = nameParts[nameParts.length - 1];
    }

    const passwordValidation = validatePassword(
      newPassword,
      firstName,
      lastName,
      tokenData.Email
    );
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.error });
    }

    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    if (userType === "attorney") {
      await updateAttorneyPassword(user.AttorneyId, passwordHash);
    } else {
      await updateJurorPassword(user.JurorId, passwordHash);
    }

    // Mark token as used
    await markTokenAsUsed(token, userType);

    res.json({
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      message: "Internal server error. Please try again later.",
    });
  }
}

/**
 * Token verification for protected routes
 */
async function verifyToken(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user based on type
    let user = null;
    if (decoded.type === "attorney") {
      const attorney = await findAttorneyByEmail(decoded.email);
      if (attorney) {
        user = {
          id: attorney.AttorneyId,
          email: attorney.Email,
          type: "attorney",
          firstName: attorney.FirstName,
          lastName: attorney.LastName,
          verified: attorney.IsVerified,
        };
      }
    } else if (decoded.type === "juror") {
      const juror = await findJurorByEmail(decoded.email);
      if (juror && juror.IsActive) {
        user = {
          id: juror.JurorId,
          email: juror.Email,
          type: "juror",
          name: juror.Name,
          verified: juror.IsVerified,
        };
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    res.json({
      valid: true,
      user,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    console.error("Token verification error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  attorneySignup,
  jurorSignup,
  attorneyLogin,
  jurorLogin,
  requestPasswordReset,
  resetPassword,
  verifyToken,
  // new endpoints
  sendJurorEmailVerification: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });
      // Re-check real email existence to prevent bounces and surface error to UI
      try {
        const exists = await checkEmailExists(email.toLowerCase().trim());
        if (!exists) {
          return res
            .status(422)
            .json({ message: "Email address does not exist" });
        }
      } catch (verifyErr) {
        console.error(
          "Email existence recheck error:",
          verifyErr?.message || verifyErr
        );
      }
      // Attempt duplicate check but do not fail hard on DB errors
      try {
        const existing = await findJurorByEmail(email.toLowerCase().trim());
        if (existing)
          return res
            .status(409)
            .json({ message: "An account with this email already exists" });
      } catch (dbErr) {
        console.error(
          "Duplicate check (send verification) DB error:",
          dbErr?.message || dbErr
        );
      }
      const { sent } = await createAndSendEmailVerification(
        email.toLowerCase().trim(),
        "juror"
      );
      if (!sent)
        return res
          .status(500)
          .json({ message: "Failed to send verification email" });
      return res.json({ ok: true });
    } catch (e) {
      console.error("sendJurorEmailVerification error:", e);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  verifyEmailVerificationToken: async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) return res.status(400).json({ message: "Token is required" });
      const decoded = verifyEmailVerificationToken(token);
      return res.json({
        ok: true,
        email: decoded.email,
        userType: decoded.userType,
      });
    } catch (e) {
      if (e.name === "TokenExpiredError")
        return res.status(410).json({ message: "Verification link expired" });
      if (e.name === "JsonWebTokenError")
        return res.status(400).json({ message: "Invalid verification link" });
      console.error("verifyEmailVerificationToken error:", e);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  sendAttorneyEmailVerification: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });
      // Optional duplicate check; ignore DB connectivity errors
      try {
        const existing = await findAttorneyByEmail(email.toLowerCase().trim());
        if (existing) {
          return res
            .status(409)
            .json({ message: "An account with this email already exists" });
        }
      } catch (dbErr) {
        console.error(
          "Duplicate check (attorney verification) DB error (ignored):",
          dbErr?.message || dbErr
        );
      }

      const { sent } = await createAndSendEmailVerification(
        email.toLowerCase().trim(),
        "attorney"
      );
      if (!sent)
        return res
          .status(500)
          .json({ message: "Failed to send verification email" });
      return res.json({ ok: true });
    } catch (e) {
      console.error("sendAttorneyEmailVerification error:", e);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};
