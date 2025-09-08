import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../api';

// Create the context
export const NotificationContext = createContext();

// Custom hook for easy access to the context
export const useNotifications = () => useContext(NotificationContext);

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unseenCount, setUnseenCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { isAuthenticated } = useAuth();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setUnseenCount(0);
      return;
    }
    
    // Extract options with defaults
    const { 
      silent = false, // If true, don't show loading state (for background polling)
      autoMarkSeen = true, // Control auto-marking as seen
      ...restOptions 
    } = options;
    
    try {
      // Only show loading indicator if not in silent mode
      if (!silent) {
        setLoading(true);
      }
      
      // Avoid duplicate requests by adding a cache buster
      const response = await apiService.getNotifications({ 
        ...restOptions, 
        autoMarkSeen,
        _t: Date.now() // Cache buster
      });
      
      if (response?.data) {
        setNotifications(response.data);
        setUnreadCount(response.meta?.unreadCount || 0);
        setUnseenCount(response.meta?.unseenCount || 0);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  // Fetch notifications on initial load and when auth state changes
  useEffect(() => {
    let isMounted = true;
    
    // Initial fetch
    if (isMounted) {
      fetchNotifications();
    }
    
    // Poll for new notifications every 2 minutes (increased from 30 seconds to reduce API load)
    const intervalId = setInterval(() => {
      // Only fetch if component is still mounted and user is authenticated
      if (isMounted && isAuthenticated) {
        fetchNotifications({ silent: true }); // Add silent option to reduce UI flicker
      }
    }, 120000); // 2 minutes
    
    // Clean up interval on unmount
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isAuthenticated]); // Remove fetchNotifications from the dependency array

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      console.log('Mark as read response:', response);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true,
          isSeen: true
        }))
      );
      
      // Reset counts
      setUnreadCount(0);
      setUnseenCount(0);
      
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  };
  
  // Mark a notification as seen
  const markAsSeen = async (notificationId) => {
    try {
      await apiService.markNotificationAsSeen(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isSeen: true } 
            : notification
        )
      );
      
      // Update unseen count
      setUnseenCount(prevCount => Math.max(0, prevCount - 1));
      
      return true;
    } catch (err) {
      console.error('Error marking notification as seen:', err);
      return false;
    }
  };
  
  // Mark all notifications as seen
  const markAllAsSeen = async () => {
    try {
      await apiService.markAllNotificationsAsSeen();
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          isSeen: true
        }))
      );
      
      // Reset unseen count
      setUnseenCount(0);
      
      return true;
    } catch (err) {
      console.error('Error marking all notifications as seen:', err);
      return false;
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      await apiService.deleteNotification(notificationId);
      
      // Update local state
      const updatedNotifications = notifications.filter(
        notification => notification._id !== notificationId
      );
      
      setNotifications(updatedNotifications);
      
      // Update unread count if needed
      const deleted = notifications.find(n => n._id === notificationId);
      if (deleted && !deleted.isRead) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_applied':
        return '📄';
      case 'job_assigned':
        return '🔔';
      case 'job_completed':
        return '✅';
      case 'payment':
        return '💰';
      case 'goal_created':
        return '🎯';
      case 'goal_completed':
        return '🏆';
      case 'rating':
        return '⭐';
      case 'message':
        return '✉️';
      case 'admin':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const value = {
    notifications,
    unreadCount,
    unseenCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    markAsSeen,
    markAllAsSeen,
    deleteNotification,
    getNotificationIcon
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
