const express = require('express');
const rateLimit = require('express-rate-limit');
const { attorneySignup, jurorSignup, attorneyLogin, jurorLogin, verifyToken } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow more login attempts than signup
  message: {
    error: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Attorney routes
router.post('/attorney/signup', authLimiter, attorneySignup);
router.post('/attorney/login', loginLimiter, attorneyLogin);

// Juror routes  
router.post('/juror/signup', authLimiter, jurorSignup);
router.post('/juror/login', loginLimiter, jurorLogin);

// Token verification - both POST and GET methods
router.post('/verify-token', verifyToken);
router.get('/verify-token', verifyToken);

// Protected route example - get current user info
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // authMiddleware adds user info to req.user
    const { user } = req;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        type: user.type,
        verified: user.verified,
        ...user // includes other user-specific fields
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'auth'
  });
});

module.exports = router;