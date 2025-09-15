const express = require('express');
const { authMiddleware, requireAttorney, requireVerified } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes here require authentication as attorney
router.use(authMiddleware);
router.use(requireAttorney);

// Get attorney dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const attorney = req.user;
    
    res.json({
      success: true,
      data: {
        attorney: {
          id: attorney.id,
          firstName: attorney.firstName,
          lastName: attorney.lastName,
          lawFirmName: attorney.lawFirmName,
          email: attorney.email,
          verified: attorney.verified,
          verificationStatus: attorney.verificationStatus
        },
        // Add more dashboard data as needed
        cases: [], // Placeholder for cases
        upcomingEvents: [] // Placeholder for events
      }
    });
  } catch (error) {
    console.error('Attorney dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get attorney profile
router.get('/profile', async (req, res) => {
  try {
    const attorney = req.user;
    
    res.json({
      success: true,
      attorney: {
        id: attorney.id,
        firstName: attorney.firstName,
        lastName: attorney.lastName,
        lawFirmName: attorney.lawFirmName,
        email: attorney.email,
        verified: attorney.verified,
        verificationStatus: attorney.verificationStatus
      }
    });
  } catch (error) {
    console.error('Get attorney profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update attorney profile (placeholder)
router.put('/profile', async (req, res) => {
  try {
    // Add profile update logic here
    res.json({
      success: true,
      message: 'Profile update functionality coming soon'
    });
  } catch (error) {
    console.error('Update attorney profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;