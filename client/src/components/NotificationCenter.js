import React, { useState, useRef, useEffect } from 'react';
import { useMessages } from '../contexts/MessageProvider';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Bell, X, MessageCircle, Calendar, Users, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);
  
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { totalUnreadCount, threads } = useMessages();

  // LinkedIn-style theming
  const theme = {
    light: {
      primary: '#0a66c2',
      background: '#ffffff',
      surface: '#f3f2ef',
      text: '#000000de',
      textSecondary: '#666666',
      border: '#e0e0e0',
      hover: '#f3f2ef',
      unreadBg: '#ef4444',
      shadow: '0 4px 12px rgba(0,0,0,0.15)'
    },
    dark: {
      primary: '#70b5f9',
      background: '#1e1e1e',
      surface: '#2d2d2d',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      border: '#404040',
      hover: '#374151',
      unreadBg: '#ef4444',
      shadow: '0 4px 12px rgba(0,0,0,0.4)'
    }
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  // Close notification center when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Generate notifications from message threads
  useEffect(() => {
    const messageNotifications = Object.values(threads)
      .filter(thread => {
        const unreadCount = thread.unreadCount?.get?.(user?._id) || 0;
        return unreadCount > 0 && thread.lastMessage;
      })
      .map(thread => {
        const otherParticipant = thread.participants?.find(p => p._id !== user?._id);
        const unreadCount = thread.unreadCount?.get?.(user?._id) || 0;
        
        return {
          id: `message-${thread._id}`,
          type: 'message',
          title: `New message${unreadCount > 1 ? 's' : ''} from ${otherParticipant?.firstName || 'Someone'}`,
          subtitle: thread.lastMessage.content,
          timestamp: new Date(thread.lastMessage.timestamp || thread.updatedAt),
          unreadCount,
          threadId: thread._id,
          avatar: otherParticipant?.profile?.profilePicture,
          action: () => {
            navigate('/messages');
            setIsOpen(false);
          }
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10); // Keep last 10 notifications

    setNotifications(messageNotifications);
  }, [threads, user, navigate]);

  // Format time for display
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? 'now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffHours < 168) { // 7 days
      return `${Math.floor(diffHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-5 h-5" style={{ color: currentTheme.primary }} />;
      case 'invitation':
        return <Calendar className="w-5 h-5" style={{ color: '#f59e0b' }} />;
      case 'connection':
        return <Users className="w-5 h-5" style={{ color: '#10b981' }} />;
      default:
        return <Bell className="w-5 h-5" style={{ color: currentTheme.textSecondary }} />;
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = () => {
    // This would integrate with your message marking system
    setNotifications([]);
  };

  // Don't render if user is not authenticated
  if (!user) return null;

  const totalNotifications = notifications.length;

  return (
    <div ref={notificationRef} className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6" style={{ color: currentTheme.text }} />
        
        {/* Unread Count Badge */}
        {totalNotifications > 0 && (
          <span 
            className="absolute -top-1 -right-1 text-xs font-bold px-2 py-1 rounded-full"
            style={{
              backgroundColor: currentTheme.unreadBg,
              color: '#ffffff',
              minWidth: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {totalNotifications > 99 ? '99+' : totalNotifications}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 rounded-lg overflow-hidden z-50"
          style={{
            width: '380px',
            maxHeight: '500px',
            backgroundColor: currentTheme.background,
            border: `1px solid ${currentTheme.border}`,
            boxShadow: currentTheme.shadow
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b"
            style={{ 
              backgroundColor: currentTheme.surface,
              borderColor: currentTheme.border 
            }}
          >
            <h3 className="font-semibold text-lg" style={{ color: currentTheme.text }}>
              Notifications
            </h3>
            
            <div className="flex items-center space-x-2">
              {totalNotifications > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  style={{ color: currentTheme.primary }}
                >
                  Mark all read
                </button>
              )}
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <X className="w-4 h-4" style={{ color: currentTheme.textSecondary }} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Bell className="w-12 h-12 mb-3" style={{ color: currentTheme.textSecondary }} />
                <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                  No new notifications
                </p>
                <p className="text-xs mt-1" style={{ color: currentTheme.textSecondary }}>
                  You're all caught up!
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={notification.action}
                  className="flex items-start p-4 cursor-pointer border-b hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  style={{ borderColor: currentTheme.border }}
                >
                  {/* Avatar/Icon */}
                  <div className="flex-shrink-0 mr-3">
                    {notification.avatar ? (
                      <img
                        src={notification.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: currentTheme.surface }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm" style={{ color: currentTheme.text }}>
                          {notification.title}
                        </p>
                        
                        {notification.subtitle && (
                          <p 
                            className="text-sm mt-1 line-clamp-2"
                            style={{ color: currentTheme.textSecondary }}
                          >
                            {notification.subtitle}
                          </p>
                        )}
                        
                        <p className="text-xs mt-2" style={{ color: currentTheme.textSecondary }}>
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      
                      {/* Unread indicator */}
                      {notification.unreadCount > 0 && (
                        <div className="flex items-center ml-2">
                          <span 
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{ 
                              backgroundColor: currentTheme.unreadBg,
                              color: '#ffffff'
                            }}
                          >
                            {notification.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div 
              className="p-3 border-t text-center"
              style={{ 
                backgroundColor: currentTheme.surface,
                borderColor: currentTheme.border 
              }}
            >
              <button
                onClick={() => {
                  navigate('/messages');
                  setIsOpen(false);
                }}
                className="text-sm font-medium"
                style={{ color: currentTheme.primary }}
              >
                View all messages
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 