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

// NEW: In-memory OTP storage (use Redis in production)
const otpStore = new Map(); // Format: { email: { otp, expiresAt } }

/**
 * Send OTP for Attorney Email Verification
 */
async function sendAttorneyOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailValidation = validateEmail(normalizedEmail);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    // Check if email already exists
    try {
      const existing = await findAttorneyByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({
          message: "An account with this email already exists",
        });
      }
    } catch (dbErr) {
      console.error("Database error during duplicate check:", dbErr);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 10 minute expiration
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(normalizedEmail, { otp, expiresAt });

    // Send OTP email
    const { sendOTPEmail } = require("../utils/email");
    const sent = await sendOTPEmail(normalizedEmail, otp, "attorney");

    if (!sent) {
      return res.status(500).json({
        message: "Failed to send verification code",
      });
    }

    console.log("✅ OTP sent to:", normalizedEmail, "| OTP:", otp); // For debugging

    return res.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Send attorney OTP error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

/**
 * Verify Attorney OTP
 */
async function verifyAttorneyOTP(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if OTP exists
    const stored = otpStore.get(normalizedEmail);

    if (!stored) {
      return res.status(400).json({
        message: "Verification code not found or expired",
      });
    }

    // Check if OTP expired
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({
        message: "Verification code has expired. Please request a new one",
      });
    }

    // Verify OTP
    if (stored.otp !== otp) {
      return res.status(400).json({
        message: "Invalid verification code",
      });
    }

    // OTP is valid - remove from store
    otpStore.delete(normalizedEmail);

    console.log("✅ OTP verified successfully for:", normalizedEmail);

    return res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify attorney OTP error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

/**
 * Attorney Signup - UPDATED
 */
async function attorneySignup(req, res) {
  console.log("✅ attorneySignup called");
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
      emailVerified, // NEW: Check email verification
    } = req.body;

    // Require email verification
    if (!emailVerified) {
      return res.status(400).json({
        message:
          "Email verification is required. Please verify your email before continuing.",
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

    for (const [field, message] of Object.entries(requiredFields)) {
      if (!req.body[field] && field !== "userAgreementAccepted") {
        return res.status(400).json({ message });
      }
      if (field === "userAgreementAccepted" && !req.body[field]) {
        return res.status(400).json({ message });
      }
    }

    if (!isAttorney) {
      return res.status(400).json({
        message: "You must confirm you are the attorney registering",
      });
    }

    if (!userAgreementAccepted) {
      return res.status(400).json({
        message: "You must accept the user agreement",
      });
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
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    // Check if state bar number already exists
    const barNumberExists = await checkStateBarNumberExists(
      stateBarNumber,
      state
    );
    if (barNumberExists) {
      return res.status(409).json({
        message: "This state bar number is already registered",
      });
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
      county: county.trim(),
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
    res.status(500).json({
      message: "Internal server error. Please try again later.",
    });
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
      cityCode,
      state,
      stateCode,
      zipCode,
      county,
      countyCode,

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

    console.log("Juror signup received data:", {
      name: name || "NOT PROVIDED",
      state: state || "NOT PROVIDED",
      county: county || "NOT PROVIDED",
      city: city || "NOT PROVIDED",
      email: email || "NOT PROVIDED",
      paymentMethod: paymentMethod || "NOT PROVIDED",
    });

    // Enhanced validation with better error messages
    const requiredFields = [
      { field: "name", value: name, message: "Name is required" },
      {
        field: "phoneNumber",
        value: phoneNumber,
        message: "Phone number is required",
      },
      { field: "address1", value: address1, message: "Address is required" },
      { field: "city", value: city, message: "City is required" },
      { field: "state", value: state, message: "State is required" },
      { field: "zipCode", value: zipCode, message: "ZIP code is required" },
      { field: "county", value: county, message: "County is required" },
      {
        field: "paymentMethod",
        value: paymentMethod,
        message: "Payment method is required",
      },
      { field: "email", value: email, message: "Email is required" },
      { field: "password", value: password, message: "Password is required" },
    ];

    // Check for missing or empty required fields
    for (const { field, value, message } of requiredFields) {
      if (!value || (typeof value === "string" && value.trim() === "")) {
        console.log(`Validation failed for field: ${field}, value:`, value);
        return res.status(400).json({ message });
      }
    }

    // Special validation for userAgreementAccepted
    if (!userAgreementAccepted) {
      return res
        .status(400)
        .json({ message: "User agreement must be accepted" });
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
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts[nameParts.length - 1] || "";

    const passwordValidation = validatePassword(
      password,
      firstName,
      lastName,
      email
    );
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.error });
    }

    // Validate ZIP code format
    if (!/^\d{5}(-\d{4})?$/.test(zipCode.trim())) {
      return res.status(400).json({ message: "Please enter a valid ZIP code" });
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
          return res.status(400).json({
            message: "You must be a US citizen to serve as a juror",
          });
        }
        if (criteria.indictment === "yes") {
          return res.status(400).json({
            message:
              "Individuals currently under indictment are not eligible to serve",
          });
        }
      } catch (error) {
        return res.status(400).json({
          message: "Invalid criteria responses format",
        });
      }
    }

    // Check if email already exists
    const existingJuror = await findJurorByEmail(email.toLowerCase().trim());
    if (existingJuror) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
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
      state: state.trim(),
      zipCode: zipCode.trim(),
      county: county.trim(),

      // Store codes if provided
      cityCode: cityCode?.trim() || null,
      stateCode: stateCode?.trim() || null,
      countyCode: countyCode?.trim() || null,

      // Optional demographics
      maritalStatus: maritalStatus?.trim() || null,
      spouseEmployer: spouseEmployer?.trim() || null,
      employerName: employerName?.trim() || null,
      employerAddress: employerAddress?.trim() || null,
      yearsInCounty: yearsInCounty?.trim() || null,
      ageRange: ageRange?.trim() || null,
      gender: gender?.trim() || null,
      education: education?.trim() || null,

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
    res.status(500).json({
      message: "Internal server error. Please try again later.",
    });
  }
}

/**
 * Attorney Login
 */
async function attorneyLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const attorney = await findAttorneyByEmail(email.toLowerCase().trim());
    if (!attorney) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, attorney.PasswordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await updateAttorneyLastLogin(attorney.AttorneyId);

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

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const juror = await findJurorByEmail(email.toLowerCase().trim());
    if (!juror) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!juror.IsActive) {
      return res.status(403).json({
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, juror.PasswordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await updateJurorLastLogin(juror.JurorId);

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

    if (!email || !userType) {
      return res.status(400).json({
        message: "Email and user type are required",
      });
    }

    if (!["attorney", "juror"].includes(userType)) {
      return res.status(400).json({
        message: "Invalid user type",
      });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    if (userType === "attorney") {
      user = await findAttorneyByEmail(normalizedEmail);
    } else {
      user = await findJurorByEmail(normalizedEmail);
      if (user && !user.IsActive) {
        return res.status(403).json({
          message: "Your account has been deactivated. Please contact support.",
        });
      }
    }

    if (user) {
      const attemptCount = await getResetAttemptCount(normalizedEmail);
      if (attemptCount >= 3) {
        return res.status(429).json({
          message:
            "Too many password reset requests. Please wait before trying again.",
        });
      }

      const { token } = await createPasswordResetToken(
        normalizedEmail,
        userType
      );

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

    if (!token || !userType || !newPassword) {
      return res.status(400).json({
        message: "Token, user type, and new password are required",
      });
    }

    if (!["attorney", "juror"].includes(userType)) {
      return res.status(400).json({
        message: "Invalid user type",
      });
    }

    const tokenData = await verifyPasswordResetToken(token, userType);
    if (!tokenData) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

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

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    if (userType === "attorney") {
      await updateAttorneyPassword(user.AttorneyId, passwordHash);
    } else {
      await updateJurorPassword(user.JurorId, passwordHash);
    }

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

/**
 * Send Juror Email Verification (OLD - still needed for juror signup)
 */
async function sendJurorEmailVerification(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.toLowerCase().trim();

    // Check email existence
    try {
      const exists = await checkEmailExists(normalizedEmail);
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

    // Check for duplicates
    try {
      const existing = await findJurorByEmail(normalizedEmail);
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
      normalizedEmail,
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
}

/**
 * Verify Email Verification Token (OLD - still needed for juror signup)
 */
async function verifyEmailVerificationTokenEndpoint(req, res) {
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
}

/**
 * Send Attorney Email Verification (OLD - kept for backward compatibility)
 */
async function sendAttorneyEmailVerification(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicates
    try {
      const existing = await findAttorneyByEmail(normalizedEmail);
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
      normalizedEmail,
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
}

/**
 * Send OTP for Juror Email Verification
 */
async function sendJurorOTP(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailValidation = validateEmail(normalizedEmail);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    // Check if email already exists
    try {
      const existing = await findJurorByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({
          message: "An account with this email already exists",
        });
      }
    } catch (dbErr) {
      console.error("Database error during duplicate check:", dbErr);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 10 minute expiration
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(normalizedEmail, { otp, expiresAt });

    // Send OTP email
    const { sendOTPEmail } = require("../utils/email");
    const sent = await sendOTPEmail(normalizedEmail, otp, "juror");

    if (!sent) {
      return res.status(500).json({
        message: "Failed to send verification code",
      });
    }

    console.log("✅ OTP sent to:", normalizedEmail, "| OTP:", otp); // For debugging

    return res.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Send juror OTP error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

/**
 * Verify Juror OTP
 */
async function verifyJurorOTP(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if OTP exists
    const stored = otpStore.get(normalizedEmail);

    if (!stored) {
      return res.status(400).json({
        message: "Verification code not found or expired",
      });
    }

    // Check if OTP expired
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({
        message: "Verification code has expired. Please request a new one",
      });
    }

    // Verify OTP
    if (stored.otp !== otp) {
      return res.status(400).json({
        message: "Invalid verification code",
      });
    }

    // OTP is valid - remove from store
    otpStore.delete(normalizedEmail);

    console.log("✅ OTP verified successfully for:", normalizedEmail);

    return res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify juror OTP error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
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
  sendJurorEmailVerification,
  verifyEmailVerificationToken: verifyEmailVerificationTokenEndpoint,
  sendAttorneyEmailVerification,
  sendAttorneyOTP, // NEW
  verifyAttorneyOTP, // NEW
  sendJurorOTP, // NEW
  verifyJurorOTP, // NEW
};
