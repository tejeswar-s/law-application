const express = require("express");
const router = express.Router();
const witnessController = require("../controllers/witnessController");
const {
  authMiddleware,
  requireAttorney,
} = require("../middleware/authMiddleware");

// Attorney routes (protected) - require auth + attorney role
router.post(
  "/:caseId/witnesses",
  authMiddleware,
  requireAttorney,
  witnessController.saveWitnesses
);

router.put(
  "/witnesses/:witnessId",
  authMiddleware,
  requireAttorney,
  witnessController.updateWitness
);

router.delete(
  "/witnesses/:witnessId",
  authMiddleware,
  requireAttorney,
  witnessController.deleteWitness
);

// Get witnesses (accessible by attorney, admin, jurors - just needs auth)
router.get(
  "/:caseId/witnesses",
  authMiddleware,
  witnessController.getWitnesses
);

// NEW: Export witnesses as text (Admin/Attorney)
router.get("/:caseId/witnesses/export/text", witnessController.exportAsText);

module.exports = router;
