const { poolPromise } = require("../config/db");

/**
 * AdminCalendar Model - Manage admin's blocked time slots
 */

/**
 * Check if a time slot is available (not blocked by admin)
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM:SS format
 * @returns {boolean} True if available, false if blocked
 */
async function isSlotAvailable(date, time) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("date", date).input("time", time)
      .query(`
        SELECT COUNT(*) as count
        FROM dbo.AdminCalendar
        WHERE BlockedDate = @date 
          AND BlockedTime = @time
      `);

    return result.recordset[0].count === 0;
  } catch (error) {
    console.error("Error checking slot availability:", error);
    throw error;
  }
}

/**
 * Get all blocked slots for a date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} Array of blocked slots
 */
async function getBlockedSlots(startDate, endDate) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("startDate", startDate)
      .input("endDate", endDate).query(`
        SELECT 
          ac.*,
          c.CaseTitle,
          c.CaseId
        FROM dbo.AdminCalendar ac
        LEFT JOIN dbo.Cases c ON ac.CaseId = c.CaseId
        WHERE ac.BlockedDate BETWEEN @startDate AND @endDate
        ORDER BY ac.BlockedDate, ac.BlockedTime
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting blocked slots:", error);
    throw error;
  }
}

/**
 * Block a time slot (manual or for approved case)
 * @param {Object} slotData - Slot blocking data
 * @returns {number} CalendarId
 */
async function blockSlot(slotData) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("blockedDate", slotData.blockedDate)
      .input("blockedTime", slotData.blockedTime)
      .input("duration", slotData.duration || 480) // 8 hours default
      .input("caseId", slotData.caseId || null)
      .input("reason", slotData.reason || null).query(`
        INSERT INTO dbo.AdminCalendar 
          (BlockedDate, BlockedTime, Duration, CaseId, Reason, CreatedAt)
        VALUES 
          (@blockedDate, @blockedTime, @duration, @caseId, @reason, GETUTCDATE());
        SELECT SCOPE_IDENTITY() as CalendarId;
      `);

    return result.recordset[0].CalendarId;
  } catch (error) {
    console.error("Error blocking slot:", error);
    throw error;
  }
}

/**
 * Remove a blocked slot
 * @param {number} calendarId - Calendar ID to remove
 */
async function unblockSlot(calendarId) {
  try {
    const pool = await poolPromise;
    await pool.request().input("calendarId", calendarId).query(`
        DELETE FROM dbo.AdminCalendar
        WHERE CalendarId = @calendarId
      `);
  } catch (error) {
    console.error("Error unblocking slot:", error);
    throw error;
  }
}

/**
 * Block slot when case is approved
 * @param {number} caseId - Case ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:MM:SS format
 */
async function blockSlotForCase(caseId, date, time) {
  try {
    return await blockSlot({
      blockedDate: date,
      blockedTime: time,
      duration: 480, // 8 hours
      caseId: caseId,
      reason: "Approved case trial scheduled",
    });
  } catch (error) {
    console.error("Error blocking slot for case:", error);
    throw error;
  }
}

/**
 * Get all available slots for a date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Array} Available time slots
 */
async function getAvailableSlots(startDate, endDate) {
  try {
    // Get all blocked slots first
    const blockedSlots = await getBlockedSlots(startDate, endDate);

    // Define available time slots (business hours)
    const timeSlots = [
      "09:00:00",
      "09:30:00",
      "10:00:00",
      "10:30:00",
      "11:00:00",
      "11:30:00",
      "12:00:00",
      "12:30:00",
      "13:00:00",
      "13:30:00",
      "14:00:00",
      "14:30:00",
      "15:00:00",
      "15:30:00",
      "16:00:00",
      "16:30:00",
      "17:00:00",
    ];

    // Generate all dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const availableSlots = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      timeSlots.forEach((time) => {
        const isBlocked = blockedSlots.some(
          (slot) =>
            slot.BlockedDate.toISOString().split("T")[0] === dateStr &&
            slot.BlockedTime === time
        );

        if (!isBlocked) {
          availableSlots.push({
            date: dateStr,
            time: time,
            available: true,
          });
        }
      });
    }

    return availableSlots;
  } catch (error) {
    console.error("Error getting available slots:", error);
    throw error;
  }
}

module.exports = {
  isSlotAvailable,
  getBlockedSlots,
  blockSlot,
  unblockSlot,
  blockSlotForCase,
  getAvailableSlots,
};
