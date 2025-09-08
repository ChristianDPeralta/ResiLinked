const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const auth = require('../middleware/auth');

// Notifications
router.get('/', auth.verify, notificationController.getMyNotifications);
router.post('/', auth.verify, notificationController.createNotification);
router.patch('/:id/read', auth.verify, notificationController.markAsRead);
router.patch('/all/read', auth.verify, notificationController.markAsRead);
router.patch('/:id/seen', auth.verify, notificationController.markAsSeen);
router.patch('/all/seen', auth.verify, notificationController.markAsSeen);
router.delete('/:id', auth.verify, notificationController.deleteNotification);

module.exports = router;