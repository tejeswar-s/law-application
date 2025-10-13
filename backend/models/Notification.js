const { poolPromise } = require("../config/db");

/**
 * Notification Model - Handles system notifications
 */

// Notification types
const NOTIFICATION_TYPES = {
  CASE_APPROVED: "case_approved",
  CASE_REJECTED: "case_rejected",
  APPLICATION_RECEIVED: "application_received",
  APPLICATION_APPROVED: "application_approved",
  APPLICATION_REJECTED: "application_rejected",
  TRIAL_STARTING: "trial_starting",
  VERDICT_NEEDED: "verdict_needed",
  VERDICT_SUBMITTED: "verdict_submitted",
  CASE_COMPLETED: "case_completed",
};

/**
 * Create notification
 * @param {Object} notificationData - Notification data
 * @returns {number} New notification ID
 */
async function createNotification(notificationData) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", notificationData.userId)
      .input("userType", notificationData.userType)
      .input("caseId", notificationData.caseId || null)
      .input("type", notificationData.type)
      .input("title", notificationData.title)
      .input("message", notificationData.message).query(`
        INSERT INTO dbo.Notifications (
          UserId, UserType, CaseId, Type, Title, Message, CreatedAt
        ) VALUES (
          @userId, @userType, @caseId, @type, @title, @message, GETUTCDATE()
        );
        SELECT SCOPE_IDENTITY() as NotificationId;
      `);

    return result.recordset[0].NotificationId;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Get notifications for user
 * @param {number} userId - User ID
 * @param {string} userType - User type ('attorney', 'juror', 'admin')
 * @param {boolean} unreadOnly - Whether to return only unread notifications
 * @returns {Array} Array of notifications
 */
async function getNotificationsForUser(userId, userType, unreadOnly = false) {
  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        n.*,
        c.CaseTitle
      FROM dbo.Notifications n
      LEFT JOIN dbo.Cases c ON n.CaseId = c.CaseId
      WHERE n.UserId = @userId AND n.UserType = @userType
    `;

    const request = pool
      .request()
      .input("userId", userId)
      .input("userType", userType);

    if (unreadOnly) {
      query += ` AND n.IsRead = 0`;
    }

    query += ` ORDER BY n.CreatedAt DESC`;

    const result = await request.query(query);
    return result.recordset;
  } catch (error) {
    console.error("Error getting notifications for user:", error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for security)
 */
async function markNotificationAsRead(notificationId, userId) {
  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("notificationId", notificationId)
      .input("userId", userId).query(`
        UPDATE dbo.Notifications 
        SET IsRead = 1, ReadAt = GETUTCDATE()
        WHERE NotificationId = @notificationId AND UserId = @userId
      `);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications as read for user
 * @param {number} userId - User ID
 * @param {string} userType - User type
 */
async function markAllNotificationsAsRead(userId, userType) {
  try {
    const pool = await poolPromise;
    await pool.request().input("userId", userId).input("userType", userType)
      .query(`
        UPDATE dbo.Notifications 
        SET IsRead = 1, ReadAt = GETUTCDATE()
        WHERE UserId = @userId AND UserType = @userType AND IsRead = 0
      `);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

/**
 * Get unread notification count
 * @param {number} userId - User ID
 * @param {string} userType - User type
 * @returns {number} Count of unread notifications
 */
async function getUnreadNotificationCount(userId, userType) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("userId", userId)
      .input("userType", userType).query(`
        SELECT COUNT(*) as count
        FROM dbo.Notifications
        WHERE UserId = @userId AND UserType = @userType AND IsRead = 0
      `);

    return result.recordset[0].count;
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    throw error;
  }
}

/**
 * Delete old notifications
 * @param {number} daysToKeep - Number of days of notifications to keep
 * @returns {number} Number of notifications deleted
 */
async function deleteOldNotifications(daysToKeep = 90) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("daysToKeep", daysToKeep).query(`
        DELETE FROM dbo.Notifications 
        WHERE CreatedAt < DATEADD(day, -@daysToKeep, GETUTCDATE())
          AND IsRead = 1;
        SELECT @@ROWCOUNT as DeletedCount;
      `);

    return result.recordset[0].DeletedCount;
  } catch (error) {
    console.error("Error deleting old notifications:", error);
    throw error;
  }
}

/**
 * Get notifications by type
 * @param {string} type - Notification type
 * @param {number} limit - Number of notifications to return
 * @returns {Array} Array of notifications
 */
async function getNotificationsByType(type, limit = 20) {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("type", type)
      .input("limit", limit).query(`
        SELECT TOP (@limit)
          n.*,
          c.CaseTitle,
          CASE 
            WHEN n.UserType = 'attorney' THEN a.FirstName + ' ' + a.LastName
            WHEN n.UserType = 'juror' THEN j.Name
            WHEN n.UserType = 'admin' THEN 'Admin'
            ELSE 'Unknown User'
          END as UserName
        FROM dbo.Notifications n
        LEFT JOIN dbo.Cases c ON n.CaseId = c.CaseId
        LEFT JOIN dbo.Attorneys a ON n.UserId = a.AttorneyId AND n.UserType = 'attorney'
        LEFT JOIN dbo.Jurors j ON n.UserId = j.JurorId AND n.UserType = 'juror'
        WHERE n.Type = @type
        ORDER BY n.CreatedAt DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting notifications by type:", error);
    throw error;
  }
}

/**
 * Get notification statistics for admin dashboard
 * @param {number} days - Number of days to look back
 * @returns {Object} Notification statistics
 */
async function getNotificationStatistics(days = 7) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("days", days).query(`
        SELECT 
          Type,
          UserType,
          COUNT(*) as NotificationCount,
          SUM(CASE WHEN IsRead = 1 THEN 1 ELSE 0 END) as ReadCount,
          SUM(CASE WHEN IsRead = 0 THEN 1 ELSE 0 END) as UnreadCount
        FROM dbo.Notifications 
        WHERE CreatedAt >= DATEADD(day, -@days, GETUTCDATE())
        GROUP BY Type, UserType
        ORDER BY NotificationCount DESC
      `);

    return result.recordset;
  } catch (error) {
    console.error("Error getting notification statistics:", error);
    throw error;
  }
}

/**
 * Find notification by ID
 * @param {number} notificationId - Notification ID
 * @returns {Object} Notification details
 */
async function findById(notificationId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("notificationId", notificationId)
      .query(`
        SELECT 
          n.*,
          c.CaseTitle
        FROM dbo.Notifications n
        LEFT JOIN dbo.Cases c ON n.CaseId = c.CaseId
        WHERE n.NotificationId = @notificationId
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error finding notification by ID:", error);
    throw error;
  }
}

/**
 * Create bulk notifications for multiple users
 * @param {Array} notificationList - Array of notification objects
 * @returns {Array} Array of created notification IDs
 */
async function createBulkNotifications(notificationList) {
  try {
    const pool = await poolPromise;
    const createdIds = [];

    for (const notification of notificationList) {
      const result = await pool
        .request()
        .input("userId", notification.userId)
        .input("userType", notification.userType)
        .input("caseId", notification.caseId || null)
        .input("type", notification.type)
        .input("title", notification.title)
        .input("message", notification.message).query(`
          INSERT INTO dbo.Notifications (
            UserId, UserType, CaseId, Type, Title, Message, CreatedAt
          ) VALUES (
            @userId, @userType, @caseId, @type, @title, @message, GETUTCDATE()
          );
          SELECT SCOPE_IDENTITY() as NotificationId;
        `);

      createdIds.push(result.recordset[0].NotificationId);
    }

    return createdIds;
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    throw error;
  }
}

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteOldNotifications,
  getNotificationsByType,
  getNotificationStatistics,
  findById,
  createBulkNotifications,
};
