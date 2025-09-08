const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationHelper');

exports.createNotification = async (req, res) => {
    try {
        const { recipient, type, title, message } = req.body;
        
        if (!recipient || !type || !message) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
                alert: "Recipient, type, and message are required"
            });
        }

        const notification = await createNotification({
            recipient,
            type,
            title: title || 'Admin Message',
            message,
            sender: req.user.id
        });

        res.status(201).json({
            success: true,
            data: notification,
            message: "Notification sent successfully",
            alert: "Message sent to user successfully"
        });
    } catch (err) {
        console.error('Error creating notification:', err);
        res.status(500).json({
            success: false,
            message: "Error creating notification",
            error: err.message,
            alert: "Failed to send notification"
        });
    }
};

exports.getMyNotifications = async (req, res) => {
    try {
        const { type, isRead, page = 1, limit = 10, autoMarkSeen = true } = req.query;

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;

        let query = { recipient: req.user.id };
        if (type) query.type = type;
        if (isRead !== undefined) query.isRead = isRead === 'true';

        const [notifications, total, unreadCount, unseenCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            Notification.countDocuments(query),
            Notification.countDocuments({ 
                recipient: req.user.id, 
                isRead: false 
            }),
            Notification.countDocuments({
                recipient: req.user.id,
                isSeen: false
            })
        ]);
        
        // Automatically mark retrieved notifications as seen if requested
        if (autoMarkSeen === true || autoMarkSeen === 'true') {
            // Get the IDs of all notifications that were just fetched and aren't already seen
            const notificationIds = notifications
                .filter(notification => !notification.isSeen)
                .map(notification => notification._id);
            
            if (notificationIds.length > 0) {
                // Mark these notifications as seen
                await Notification.updateMany(
                    { _id: { $in: notificationIds } },
                    { $set: { isSeen: true } }
                );
                
                // Update the isSeen flag in the response data too
                notifications.forEach(notification => {
                    if (notificationIds.includes(notification._id)) {
                        notification.isSeen = true;
                    }
                });
            }
        }

        res.status(200).json({
            success: true,
            data: notifications,
            meta: {
                total,
                unreadCount,
                unseenCount,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                }
            },
            alert: unreadCount > 0 
                ? `You have ${unreadCount} unread notifications` 
                : "No new notifications"
        });
    } catch (err) {
        res.status(500).json({ 
            message: "Error fetching notifications", 
            error: err.message,
            alert: "Failed to load notifications"
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        // For marking all notifications as read
        if (req.path === '/all/read' || req.body.all) {
            const result = await Notification.updateMany(
                { recipient: req.user.id, isRead: false },
                { $set: { isRead: true, isSeen: true } }
            );

            return res.status(200).json({
                message: "All notifications marked as read",
                updatedCount: result.modifiedCount,
                data: [],  // Return empty array to match expected format
                meta: { unreadCount: 0, unseenCount: 0 },  // Update unread and unseen counts
                alert: `Marked ${result.modifiedCount} notifications as read`
            });
        }
        
        // For marking a single notification as read - the ID is in the URL params
        console.log('Marking notification as read:', {
            path: req.path,
            params: req.params,
            user: req.user.id
        });
        
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { $set: { isRead: true, isSeen: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ 
                message: "Notification not found",
                alert: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification marked as read",
            data: notification,  // Use consistent response format
            success: true,
            alert: "Notification marked as read"
        });
    } catch (err) {
        console.error('Error marking notification as read:', err, {
            path: req.path, 
            params: req.params
        });
        res.status(500).json({ 
            message: "Error updating notification", 
            error: err.message,
            alert: "Failed to update notification status"
        });
    }
};

exports.markAsSeen = async (req, res) => {
    try {
        // For marking all notifications as seen
        if (req.path === '/all/seen' || req.body.all) {
            const result = await Notification.updateMany(
                { recipient: req.user.id, isSeen: false },
                { $set: { isSeen: true } }
            );

            return res.status(200).json({
                message: "All notifications marked as seen",
                updatedCount: result.modifiedCount,
                data: [],  
                meta: { unseenCount: 0 },
                alert: `Marked ${result.modifiedCount} notifications as seen`
            });
        }
        
        // For marking a single notification as seen
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { $set: { isSeen: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ 
                message: "Notification not found",
                alert: "Notification not found"
            });
        }

        res.status(200).json({
            message: "Notification marked as seen",
            data: notification,
            success: true,
            alert: "Notification marked as seen"
        });
    } catch (err) {
        console.error('Error marking notification as seen:', err);
        res.status(500).json({ 
            message: "Error updating notification seen status", 
            error: err.message,
            alert: "Failed to update notification seen status"
        });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({ 
            _id: req.params.id, 
            recipient: req.user.id 
        });

        if (!notification) {
            return res.status(404).json({ 
                message: "Notification not found",
                alert: "Notification not found or already deleted"
            });
        }

        res.status(200).json({
            message: "Notification deleted",
            deletedNotification: {
                id: notification._id,
                type: notification.type,
                message: notification.message.substring(0, 50) + '...'
            },
            alert: "Notification deleted"
        });
    } catch (err) {
        res.status(500).json({ 
            message: "Error deleting notification", 
            error: err.message,
            alert: "Failed to delete notification"
        });
    }
};
