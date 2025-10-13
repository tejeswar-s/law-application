const Notification = require("../models/Notification");

/**
 * Get notifications for authenticated user
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const userType = req.user.type;
    const { unreadOnly } = req.query;

    const notifications = await Notification.getNotificationsForUser(
      userId,
      userType,
      unreadOnly === "true"
    );

    res.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
}

/**
 * Get unread notification count
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const userType = req.user.type;

    const count = await Notification.getUnreadNotificationCount(
      userId,
      userType
    );

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
    });
  }
}

/**
 * Mark notification as read
 */
async function markAsRead(req, res) {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    await Notification.markNotificationAsRead(notificationId, userId);

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    const userType = req.user.type;

    await Notification.markAllNotificationsAsRead(userId, userType);

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
