const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");

// All routes require authentication
router.use(authMiddleware);

// Get all notifications for user
router.get("/notifications", getNotifications);

// Get unread count
router.get("/notifications/unread-count", getUnreadCount);

// Mark specific notification as read
router.put("/notifications/:notificationId/read", markAsRead);

// Mark all notifications as read
router.put("/notifications/read-all", markAllAsRead);

module.exports = router;
