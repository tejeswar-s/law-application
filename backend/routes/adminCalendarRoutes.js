const express = require("express");
const router = express.Router();
const {
  getBlockedSlots,
  getAvailableSlots,
  blockSlot,
  unblockSlot,
  checkSlotAvailability,
} = require("../controllers/adminCalendarController");

// Apply authentication middleware if needed
// router.use(authMiddleware);
// router.use(requireAdmin);

// GET /api/admin/calendar/blocked - Get blocked slots
router.get("/blocked", getBlockedSlots);

// GET /api/admin/calendar/available - Get available slots
router.get("/available", getAvailableSlots);

// GET /api/admin/calendar/check - Check if specific slot is available
router.get("/check", checkSlotAvailability);

// POST /api/admin/calendar/block - Manually block a slot
router.post("/block", blockSlot);

// DELETE /api/admin/calendar/:calendarId - Unblock a slot
router.delete("/:calendarId", unblockSlot);

module.exports = router;
