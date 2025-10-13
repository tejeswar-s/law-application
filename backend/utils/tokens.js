const jwt = require("jsonwebtoken");

/**
 * Create a short-lived email verification token (JWT, stateless)
 * Encodes: purpose, email, userType
 */
function createEmailVerificationToken(email, userType = "juror") {
  const payload = { purpose: "verify_email", email, userType };
  const expiresIn = process.env.EMAIL_VERIFICATION_EXPIRES_IN || "24h";
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/**
 * Verify an email verification token and return decoded payload
 */
function verifyEmailVerificationToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded || decoded.purpose !== "verify_email") {
    const err = new Error("Invalid token purpose");
    err.name = "JsonWebTokenError";
    throw err;
  }
  return decoded; // {purpose,email,userType,iat,exp}
}

module.exports = {
  createEmailVerificationToken,
  verifyEmailVerificationToken,
};
