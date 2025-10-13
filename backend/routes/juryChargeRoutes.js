const express = require("express");
const router = express.Router();
const juryChargeController = require("../controllers/juryChargeController");
const {
  authMiddleware,
  requireAttorney,
  requireAdmin,
} = require("../middleware/authMiddleware");

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

// Get questions (accessible by attorney and admin)
router.get(
  "/:caseId/jury-charge",
  authMiddleware,
  juryChargeController.getJuryChargeQuestions
);

// Export routes (Admin)
router.get(
  "/:caseId/jury-charge/export/text",
  authMiddleware,
  juryChargeController.exportAsText
);
router.get(
  "/:caseId/jury-charge/export/ms-forms",
  authMiddleware,
  juryChargeController.exportAsMSFormsTemplate
);

module.exports = router;
