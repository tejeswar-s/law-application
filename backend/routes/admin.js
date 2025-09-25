const express = require('express');
const router = express.Router();
const Attorney = require('../models/Attorney');
const Juror = require('../models/Juror');

// GET /api/admin/attorneys
router.get('/attorneys', async (req, res) => {
  try {
    // You can add pagination params if needed
    const { attorneys } = await Attorney.getAllAttorneys(1, 100); // page 1, 100 per page
    res.json(attorneys);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch attorneys" });
  }
});

// GET /api/admin/jurors
router.get('/jurors', async (req, res) => {
  try {
    const { jurors } = await Juror.getAllJurors(1, 100); // Adjust as per your model
    res.json(jurors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch jurors" });
  }
});

// POST /api/admin/attorneys/:id/verify
router.post('/attorneys/:id/verify', async (req, res) => {
  try {
    // Update both VerificationStatus and IsVerified
    await Attorney.updateVerificationStatus(req.params.id, "verified");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify attorney" });
  }
});

// POST /api/admin/jurors/:id/verify
router.post('/jurors/:id/verify', async (req, res) => {
  try {
    await Juror.updateVerificationStatus(req.params.id, "verified");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to verify juror" });
  }
});

module.exports = router;