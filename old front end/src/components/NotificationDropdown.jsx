import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { 
    notifications, 
    unreadCount,
    unseenCount,
    markAsRead, 
    markAllAsRead,
    markAsSeen,
    markAllAsSeen,
    deleteNotification,
    getNotificationIcon,
    fetchNotifications,
    loading
  } = useNotifications();
  
  const dropdownRef = useRef(null);
  
  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Track if this is the first time opening the dropdown
  const firstOpenRef = useRef(true);
  
  // Refresh notifications when dropdown is opened
  useEffect(() => {
    // Only fetch notifications when dropdown is opened
    if (isOpen) {
      // Add a flag to prevent fetching on every render
      if (firstOpenRef.current) {
        // First open: fetch and update first open status
        fetchNotifications({ autoMarkSeen: false });
        firstOpenRef.current = false;
      }
      
      // If there are unseen notifications, mark them all as seen after dropdown opens
      if (unseenCount > 0) {
        // Add a small delay to ensure the dropdown is fully opened before marking as seen
        const timer = setTimeout(() => {
          markAllAsSeen();
        }, 300);
        
        return () => clearTimeout(timer);
      }
    } else {
      // Reset the first open status when the dropdown is closed
      firstOpenRef.current = true;
    }
  }, [isOpen, unseenCount, markAllAsSeen]);

  // Refresh button states removed
  
  const toggleDropdown = () => {
    // Toggle dropdown state without triggering additional fetches
    setIsOpen(prevState => {
      // If we're about to open and have no notifications, 
      // we'll let the useEffect handle the fetch
      const willOpen = !prevState;
      
      // Return new state
      return willOpen;
    });
  };
  
  // View notification details and mark as read
  const handleNotificationClick = async (notification) => {
    try {
      // Create a local copy of the notification to avoid direct state mutation
      const notificationCopy = { ...notification };
      
      // Always mark as seen when clicked
      if (!notificationCopy.isSeen) {
        console.log('Marking notification as seen:', notificationCopy._id);
        await markAsSeen(notificationCopy._id);
        // Update the local copy (UI will be updated via context)
        notificationCopy.isSeen = true;
      }
      
      // Mark as read only when viewing details in the modal
      if (!notificationCopy.isRead) {
        console.log('Marking notification as read:', notificationCopy._id);
        await markAsRead(notificationCopy._id);
        // Update the local copy (UI will be updated via context)
        notificationCopy.isRead = true;
      }
      
      // Open modal with notification details
      setSelectedNotification(notificationCopy);
      setShowModal(true);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };
  
  // Close the notification detail modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedNotification(null);
  };
  
  const handleClearAll = async (e) => {
    if (!notifications.length) return;
    
    try {
      // Show loading state on the button
      const buttonText = e.target.innerText;
      e.target.innerText = 'Marking...';
      e.target.disabled = true;
      
      const success = await markAllAsRead();
      
      if (!success) {
        console.error('Failed to mark all notifications as read');
        // Reset button if operation failed
        e.target.innerText = buttonText;
        e.target.disabled = false;
      } else {
        // Update button text to show success feedback temporarily
        e.target.innerText = 'Done!';
        setTimeout(() => {
          if (e.target) {
            e.target.innerText = buttonText;
            e.target.disabled = false;
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      // Reset button if an error occurred
      if (e.target) {
        e.target.innerText = 'Mark all as read';
        e.target.disabled = false;
      }
    }
  };
  
  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      // Show some visual feedback that delete is in progress
      e.target.innerText = '...';
      e.target.disabled = true;
      
      const success = await deleteNotification(notificationId);
      if (!success) {
        console.error('Failed to delete notification');
        // Reset the button if deletion failed
        e.target.innerText = '×';
        e.target.disabled = false;
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Reset the button if an error occurred
      e.target.innerText = '×';
      e.target.disabled = false;
    }
  };
  
  const formatTime = (dateString) => {
    try {
      if (!dateString) return 'Just now';
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown time';
      }
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      
      // Enhanced fallback if date-fns fails
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          const now = new Date();
          const diffMs = now - date;
          
          // Calculate time differences in various units
          const diffSecs = Math.floor(diffMs / 1000);
          if (diffSecs < 60) return diffSecs <= 5 ? 'just now' : `${diffSecs} second${diffSecs !== 1 ? 's' : ''} ago`;
          
          const diffMins = Math.floor(diffSecs / 60);
          if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
          
          const diffHours = Math.floor(diffMins / 60);
          if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
          
          const diffDays = Math.floor(diffHours / 24);
          if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
          
          const diffWeeks = Math.floor(diffDays / 7);
          if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
          
          const diffMonths = Math.floor(diffDays / 30);
          if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
          
          const diffYears = Math.floor(diffDays / 365);
          return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
        }
      } catch (e) {
        // Ignore any errors in the fallback
        console.error('Error in fallback date formatting:', e);
      }
      
      return 'Recently';
    }
  };

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button 
        className={`notification-bell ${unseenCount > 0 ? 'has-unseen' : ''}`}
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
        {unseenCount > 0 && (
          <span className="unseen-indicator" title={`${unseenCount} new notifications`}></span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {/* Actions removed as requested */}
            </div>
          </div>
          
          <div className="notification-list">
            {loading && (
              <div className="notification-loading">
                <span className="loading-spinner"></span>
                <p>Loading notifications...</p>
              </div>
            )}
            
            {!loading && notifications.length === 0 && (
              <div className="empty-notifications">
                <div className="empty-icon">📪</div>
                <p>No notifications yet</p>
                <button 
                  className="refresh-btn"
                  onClick={() => fetchNotifications()}
                >
                  Refresh
                </button>
              </div>
            )}
            
            {!loading && notifications.length > 0 && notifications
              .slice(0, showAllNotifications ? notifications.length : 5)
              .map((notification) => (
                <div 
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : 'read'} ${!notification.isSeen ? 'unseen' : 'seen'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon-container">
                    <span className={`notification-type-icon ${!notification.isRead ? 'unread-icon' : ''} ${!notification.isSeen ? 'unseen-icon' : ''}`}>
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  <div className="notification-content">
                    <div className={`notification-message ${!notification.isRead ? 'unread-text' : ''} ${!notification.isSeen ? 'unseen-text' : ''}`}>
                      {notification.message}
                    </div>
                    <div className="notification-time">{formatTime(notification.createdAt)}</div>
                  </div>
                  <div className="notification-indicators">
                    {!notification.isRead && <span className="unread-dot" title="Unread"></span>}
                    {notification.isSeen === false && <span className="unseen-glow" title="New"></span>}
                    <button 
                      className="delete-notification"
                      onClick={(e) => handleDelete(e, notification._id)}
                      aria-label="Delete notification"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
          </div>
          
          {!loading && notifications.length > 5 && (
            <div className="notification-footer">
              <button 
                onClick={() => setShowAllNotifications(!showAllNotifications)}
                style={{
                  backgroundColor: '#8a3ffc', // Pure purple background
                  color: 'white', // White text
                  border: 'none',
                  borderRadius: '30px', // Fully rounded corners
                  padding: '12px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '90%',
                  margin: '0 auto',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 10px rgba(138, 63, 252, 0.3)', // Purple shadow
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#7b2ff2';
                  e.currentTarget.style.boxShadow = '0 3px 12px rgba(138, 63, 252, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#8a3ffc';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(138, 63, 252, 0.3)';
                }}
              >
                {showAllNotifications ? 'Show less' : `View all (${notifications.length})`}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Notification Detail Modal */}
      {showModal && selectedNotification && (
        <div className="notification-modal-overlay" onClick={closeModal}>
          <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Notification Details</h3>
              <button className="close-modal" onClick={closeModal} aria-label="Close">×</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-icon-container">
                <span className="modal-type-icon">
                  {getNotificationIcon(selectedNotification.type)}
                </span>
              </div>
              
              <div className="modal-notification-content">
                <h4 className="modal-notification-type">
                  {selectedNotification.type?.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </h4>
                <p className="modal-notification-message">{selectedNotification.message}</p>
                <div className="modal-notification-time">
                  {formatTime(selectedNotification.createdAt)}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="modal-actions">
                {!selectedNotification.isRead && (
                  <button 
                    className="modal-action-btn mark-read" 
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(selectedNotification._id);
                    }}
                  >
                    Mark as read
                  </button>
                )}
                <button 
                  className="modal-action-btn close" 
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .notification-container {
          position: relative;
        }
        
        .notification-bell {
          background: none;
          border: none;
          cursor: pointer;
          position: relative;
          padding: var(--spacing-2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .notification-bell:hover {
          transform: scale(1.1);
        }
        
        .notification-bell.has-unseen {
          animation: bellShake 2s cubic-bezier(.36,.07,.19,.97) infinite;
          transform-origin: top center;
        }
        
        @keyframes bellShake {
          0%, 20%, 50%, 80%, 100% { transform: rotate(0); }
          40% { transform: rotate(6deg); }
          60% { transform: rotate(-6deg); }
        }
        
        .notification-icon {
          font-size: 1.5rem;
          color: white;
        }
        
        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: var(--error-500);
          color: white;
          border-radius: 50%;
          font-size: 0.7rem;
          font-weight: 600;
          height: 18px;
          width: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--primary-700);
        }
        
        .unseen-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          background-color: var(--primary-400);
          border-radius: 50%;
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
        }
        
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(66, 153, 225, 0); }
          100% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0); }
        }
        
        .notification-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          width: 320px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          border: none;
          animation: fadeIn 0.2s ease;
          padding: 8px 0;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .notification-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-4);
          border-bottom: none;
          background: white;
        }
        
        .notification-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #333333;
          font-weight: 600;
        }
        
        .notification-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          margin-left: auto;
        }
        
        /* Base styles for all header action buttons */
        .header-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gray-100);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-md);
          color: var(--gray-700);
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          height: 28px;
          padding: 0 var(--spacing-2);
        }
        
        .header-action-btn:hover {
          background: var(--primary-50);
          border-color: var(--primary-200);
          color: var(--primary-700);
        }
        
        .header-action-btn:active {
          transform: translateY(1px);
        }
        
        .btn-icon {
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .refresh-icon {
          font-size: 1.2rem !important;
          font-weight: bold !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        .btn-text {
          margin-left: var(--spacing-1);
          white-space: nowrap;
        }
        
        /* Specific styles for mark read button */
        .mark-read-btn {
          background: var(--primary-50);
          border-color: var(--primary-100);
          color: var(--primary-700);
        }
        
        .mark-read-btn:hover {
          background: var(--primary-100);
          border-color: var(--primary-200);
          color: var(--primary-800);
        }
        
        /* Specific styles for refresh button - explicitly square */
        .refresh-btn {
          width: 32px !important; /* Force width */
          height: 32px !important; /* Force height to match width exactly */
          min-width: 32px !important;
          max-width: 32px !important;
          min-height: 32px !important;
          max-height: 32px !important;
          padding: 0 !important; /* Remove any padding */
          margin: 0 !important; /* Remove any margin */
          border-radius: 4px !important; /* Slightly rounded corners */
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background-color: var(--gray-100) !important;
          border: 1px solid var(--gray-300) !important;
          box-shadow: var(--shadow-xs) !important;
          flex: 0 0 32px !important; /* Don't grow or shrink */
          box-sizing: border-box !important;
        }
        
        .refresh-btn:hover {
          transform: rotate(180deg);
          background-color: var(--primary-100);
          border-color: var(--primary-300);
        }
        
        .refresh-btn:active {
          transform: scale(0.9) rotate(180deg);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .notification-list {
          max-height: 400px;
          overflow-y: auto;
          flex: 1;
          overscroll-behavior: contain; /* Prevents scroll chaining */
          -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
        }
        
        .notification-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-6);
          color: var(--gray-500);
          gap: var(--spacing-4);
        }
        
        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: var(--primary-500);
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .notification-loading p {
          margin-top: var(--spacing-2);
          color: var(--gray-600);
          font-size: 0.9rem;
        }
        
        .empty-notifications {
          text-align: center;
          padding: var(--spacing-6);
          color: var(--gray-500);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-3);
        }
        
        .empty-icon {
          font-size: 2rem;
          margin-bottom: var(--spacing-2);
        }
        
        .refresh-btn {
          background: var(--primary-50);
          border: 1px solid var(--primary-200);
          color: var(--primary-700);
          padding: var(--spacing-1) var(--spacing-3);
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          cursor: pointer;
          margin-top: var(--spacing-2);
          transition: all 0.2s;
        }
        
        .refresh-btn:hover {
          background: var(--primary-100);
          border-color: var(--primary-300);
        }
        
        .notification-item {
          display: flex;
          padding: 12px 16px;
          border-bottom: none;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          gap: 12px;
          align-items: flex-start;
          min-height: 64px; /* Ensure consistent height for better UI */
        }
        
        .notification-item:hover {
          background: #f9f9f9;
        }
        
        .notification-item.unread {
          background: white;
          position: relative;
          border-left: none;
        }
        
        .notification-item.read {
          background: white;
          position: relative;
          border-left: none;
          opacity: 0.8;
        }
        
        .notification-item.unseen {
          box-shadow: 0 0 0 2px rgba(0, 100, 255, 0.15);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 100, 255, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(0, 100, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 100, 255, 0); }
        }
        
        .notification-item.unread:hover {
          background: var(--primary-100);
        }
        
        .notification-item.read:hover {
          background: var(--gray-100);
        }
        
        .notification-item.unseen:hover {
          background: var(--primary-50);
        }
        
        .notification-icon-container {
          flex-shrink: 0;
        }
        
        .notification-type-icon {
          font-size: 1.2rem;
          background: var(--gray-100);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }
        
        .notification-type-icon.unread-icon {
          background: var(--primary-100);
          box-shadow: 0 0 0 2px var(--primary-200);
        }
        
        .notification-type-icon.unseen-icon {
          background: var(--primary-200);
          box-shadow: 0 0 6px var(--primary-400);
        }
        
        .notification-content {
          flex: 1;
          min-width: 0;
        }
        
        .notification-message {
          font-size: 0.9rem;
          color: var(--gray-800);
          margin-bottom: var(--spacing-1);
          word-break: break-word;
          line-height: 1.4;
          transition: all 0.2s;
        }
        
        .notification-message.unread-text {
          font-weight: 600;
          color: var(--gray-900);
        }
        
        .notification-message.unseen-text {
          color: var(--primary-700);
        }
        
        .notification-time {
          font-size: 0.75rem;
          color: var(--gray-500);
        }
        
        .notification-indicators {
          display: flex;
          align-items: center;
        }
        
        .unread-dot {
          width: 8px;
          height: 8px;
          background-color: var(--primary-500);
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .unseen-glow {
          width: 10px;
          height: 10px;
          background-color: var(--primary-400);
          border-radius: 50%;
          margin-right: 8px;
          animation: glow 1.5s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
          from {
            box-shadow: 0 0 4px var(--primary-300);
          }
          to {
            box-shadow: 0 0 8px 2px var(--primary-500);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .delete-notification {
          opacity: 0;
          background: none;
          border: none;
          color: var(--gray-400);
          cursor: pointer;
          font-size: 1.2rem;
          line-height: 1;
          padding: 2px;
          transition: all 0.2s;
        }
        
        .notification-item:hover .delete-notification {
          opacity: 1;
        }
        
        .delete-notification:hover {
          color: var(--error-500);
          transform: scale(1.2);
        }
        
        .notification-footer {
          padding: 12px;
          text-align: center;
          border-top: none;
          background: white;
          display: flex;
          justify-content: center;
        }
        
        .view-all-btn {
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          color: var(--primary-600);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--radius-md);
          transition: all 0.2s;
          width: 85%;
          margin: 0 auto;
        }
        
        .view-all-btn:hover {
          background: var(--primary-50);
          color: var(--primary-700);
          border-color: var(--primary-200);
          box-shadow: var(--shadow-sm);
        }
        
        .view-all-btn:active {
          transform: translateY(1px);
          box-shadow: none;
        }
        
        /* Modal Styles */
        .notification-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.2s ease;
          padding: 20px;
        }
        
        .notification-modal {
          background: white;
          border-radius: var(--radius-xl);
          width: 90%;
          max-width: 450px;
          max-height: 80vh;
          overflow: auto;
          box-shadow: var(--shadow-2xl);
          animation: modalOpen 0.4s ease forwards;
          position: relative;
          margin: auto;
          /* Ensure modal stays within viewport */
          transform: translateY(0);
        }
        
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes modalOpen {
          0% { transform: scale(0.9); opacity: 0; }
          70% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-4) var(--spacing-6);
          border-bottom: 1px solid var(--gray-200);
          background: var(--primary-50);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 1.2rem;
          color: var(--primary-700);
          font-weight: 600;
        }
        
        .close-modal {
          background: var(--gray-100);
          border: 1px solid var(--gray-200);
          color: var(--gray-700);
          font-size: 1.2rem;
          cursor: pointer;
          line-height: 1;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .close-modal:hover {
          background: var(--primary-100);
          color: var(--primary-800);
          border-color: var(--primary-300);
        }
        
        .close-modal:active {
          transform: scale(0.95);
        }
        
        .modal-body {
          padding: var(--spacing-6);
          display: flex;
          gap: var(--spacing-4);
        }
        
        .modal-icon-container {
          flex-shrink: 0;
        }
        
        .modal-type-icon {
          font-size: 1.8rem;
          background: var(--primary-100);
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          box-shadow: 0 0 0 2px var(--primary-200);
        }
        
        .modal-notification-content {
          flex: 1;
        }
        
        .modal-notification-type {
          font-size: 1.1rem;
          color: var(--primary-700);
          margin: 0 0 var(--spacing-2);
          font-weight: 600;
        }
        
        .modal-notification-message {
          font-size: 1rem;
          color: var(--gray-800);
          line-height: 1.6;
          margin: 0 0 var(--spacing-3);
          word-break: break-word;
        }
        
        .modal-notification-time {
          font-size: 0.9rem;
          color: var(--gray-500);
          display: inline-block;
          padding: var(--spacing-1) var(--spacing-3);
          background: var(--gray-50);
          border-radius: var(--radius-md);
          margin-top: var(--spacing-2);
        }
        
        .modal-footer {
          padding: var(--spacing-4) var(--spacing-6);
          border-top: 1px solid var(--gray-200);
          position: sticky;
          bottom: 0;
          background: white;
          z-index: 10;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-3);
        }
        
        .modal-action-btn {
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--radius-md);
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
          text-align: center;
        }
        
        .modal-action-btn.close {
          background: var(--gray-100);
          color: var(--gray-800);
          border: 1px solid var(--gray-200);
        }
        
        .modal-action-btn.close:hover {
          background: var(--gray-200);
        }
        
        .modal-action-btn.mark-read {
          background: var(--primary-500);
          color: white;
          border: none;
        }
        
        .modal-action-btn.mark-read:hover {
          background: var(--primary-600);
        }
        
        .modal-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-sm);
        }
        
        .modal-action-btn:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;
