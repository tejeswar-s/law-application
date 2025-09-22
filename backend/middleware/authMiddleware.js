const jwt = require("jsonwebtoken");
const { findByEmail: findAttorneyByEmail } = require("../models/Attorney");
const { findByEmail: findJurorByEmail } = require("../models/Juror");

/**
 * Middleware to authenticate JWT tokens
 * Adds user information to req.user if token is valid
 */
async function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
        code: "NO_TOKEN",
      });
    }

    // Expected format: "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access denied. Invalid token format.",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user based on token type
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
          lawFirmName: attorney.LawFirmName,
          phoneNumber: attorney.PhoneNumber,
          verified: attorney.IsVerified,
          verificationStatus: attorney.VerificationStatus,
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
          phone: juror.PhoneNumber,
          county: juror.County,
          verified: juror.IsVerified,
          verificationStatus: juror.VerificationStatus,
          onboardingCompleted: juror.OnboardingCompleted,
        };
      }
    }

    if (!user) {
      return res.status(401).json({
        message: "Access denied. User not found or inactive.",
        code: "USER_NOT_FOUND",
      });
    }

    // Add user to request object
    req.user = user;
    req.token = decoded;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Access denied. Invalid token.",
        code: "INVALID_TOKEN",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Access denied. Token has expired.",
        code: "TOKEN_EXPIRED",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      message: "Internal server error during authentication.",
      code: "AUTH_ERROR",
    });
  }
}

/**
 * Middleware to check if user is an attorney
 */
function requireAttorney(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required.",
      code: "AUTH_REQUIRED",
    });
  }

  if (req.user.type !== "attorney") {
    return res.status(403).json({
      message: "Access denied. Attorney privileges required.",
      code: "ATTORNEY_REQUIRED",
    });
  }

  next();
}

/**
 * Middleware to check if user is a juror
 */
function requireJuror(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required.",
      code: "AUTH_REQUIRED",
    });
  }

  if (req.user.type !== "juror") {
    return res.status(403).json({
      message: "Access denied. Juror privileges required.",
      code: "JUROR_REQUIRED",
    });
  }

  next();
}

/**
 * Middleware to check if user is verified
 */
function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required.",
      code: "AUTH_REQUIRED",
    });
  }

  if (!req.user.verified) {
    return res.status(403).json({
      message: "Access denied. Account verification required.",
      code: "VERIFICATION_REQUIRED",
      verificationStatus: req.user.verificationStatus,
    });
  }

  next();
}

/**
 * Middleware to check if juror has completed onboarding
 */
function requireJurorOnboarding(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required.",
      code: "AUTH_REQUIRED",
    });
  }

  if (req.user.type !== "juror") {
    return res.status(403).json({
      message: "Access denied. Juror privileges required.",
      code: "JUROR_REQUIRED",
    });
  }

  if (!req.user.onboardingCompleted) {
    return res.status(403).json({
      message: "Access denied. Please complete onboarding first.",
      code: "ONBOARDING_REQUIRED",
    });
  }

  next();
}

/**
 * Optional auth middleware - doesn't fail if no token, but adds user if valid token
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
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

    if (user) {
      req.user = user;
      req.token = decoded;
    }

    next();
  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    next();
  }
}

module.exports = {
  authMiddleware,
  requireAttorney,
  requireJuror,
  requireVerified,
  requireJurorOnboarding,
  optionalAuth,
};
