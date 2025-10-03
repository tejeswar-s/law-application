const AdminCalendar = require("../models/AdminCalendar");
const CaseReschedule = require("../models/CaseReschedule");
const Case = require("../models/Case");
const Notification = require("../models/Notification");

/**
 * Get all blocked slots for admin calendar view
 */
async function getBlockedSlots(req, res) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const blockedSlots = await AdminCalendar.getBlockedSlots(
      startDate,
      endDate
    );

    res.json({
      success: true,
      blockedSlots,
    });
  } catch (error) {
    console.error("Get blocked slots error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve blocked slots",
    });
  }
}

/**
 * Get available slots for a date range
 */
async function getAvailableSlots(req, res) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const availableSlots = await AdminCalendar.getAvailableSlots(
      startDate,
      endDate
    );

    res.json({
      success: true,
      availableSlots,
    });
  } catch (error) {
    console.error("Get available slots error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve available slots",
    });
  }
}

/**
 * Manually block a time slot
 */
async function blockSlot(req, res) {
  try {
    const { blockedDate, blockedTime, duration, reason } = req.body;

    if (!blockedDate || !blockedTime) {
      return res.status(400).json({
        success: false,
        message: "blockedDate and blockedTime are required",
      });
    }

    // Check if slot is already blocked
    const isAvailable = await AdminCalendar.isSlotAvailable(
      blockedDate,
      blockedTime
    );
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already blocked",
      });
    }

    const calendarId = await AdminCalendar.blockSlot({
      blockedDate,
      blockedTime,
      duration: duration || 480,
      reason: reason || "Manually blocked by admin",
    });

    res.json({
      success: true,
      message: "Time slot blocked successfully",
      calendarId,
    });
  } catch (error) {
    console.error("Block slot error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to block time slot",
    });
  }
}

/**
 * Unblock a time slot
 */
async function unblockSlot(req, res) {
  try {
    const { calendarId } = req.params;

    await AdminCalendar.unblockSlot(calendarId);

    res.json({
      success: true,
      message: "Time slot unblocked successfully",
    });
  } catch (error) {
    console.error("Unblock slot error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unblock time slot",
    });
  }
}

/**
 * Check if a specific slot is available
 */
async function checkSlotAvailability(req, res) {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "date and time are required",
      });
    }

    const isAvailable = await AdminCalendar.isSlotAvailable(date, time);

    res.json({
      success: true,
      available: isAvailable,
    });
  } catch (error) {
    console.error("Check slot availability error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check slot availability",
    });
  }
}

module.exports = {
  getBlockedSlots,
  getAvailableSlots,
  blockSlot,
  unblockSlot,
  checkSlotAvailability,
};
