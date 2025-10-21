const express = require("express");
const router = express.Router();
const juryChargeController = require("../controllers/juryChargeController");
const {
  authMiddleware,
  requireAttorney,
  requireAdmin,
} = require("../middleware/authMiddleware");

// IMPORTANT: Export routes MUST come BEFORE the general /:caseId/jury-charge route

// Export routes - NO AUTH (so admin dashboard can download without login)
router.get(
  "/:caseId/jury-charge/export/text",
  juryChargeController.exportAsText
);

router.get(
  "/:caseId/jury-charge/export/ms-forms",
  juryChargeController.exportAsMSFormsTemplate
);

// Get questions (accessible by attorney and admin)
router.get(
  "/:caseId/jury-charge",
  authMiddleware,
  juryChargeController.getJuryChargeQuestions
);

// Attorney routes (protected)
router.post(
  "/:caseId/jury-charge",
  authMiddleware,
  requireAttorney,
  juryChargeController.saveJuryChargeQuestions
);

router.put(
  "/jury-charge/:questionId",
  authMiddleware,
  requireAttorney,
  juryChargeController.updateJuryChargeQuestion
);

router.delete(
  "/jury-charge/:questionId",
  authMiddleware,
  requireAttorney,
  juryChargeController.deleteJuryChargeQuestion
);

module.exports = router;
