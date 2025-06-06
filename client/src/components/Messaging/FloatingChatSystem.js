import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import FloatingChatBubble from './FloatingChatBubble';
import FloatingChatWindow from './FloatingChatWindow';
import messageService from '../../services/messageService';
import { useAuth } from '../../contexts/AuthContext';
import socketService from '../../services/socketService';

const FloatingChatSystem = () => {
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { currentUser } = useAuth();
  const location = useLocation();

  // Hide floating chat on messages page to avoid duplication
  const shouldHideFloatingChat = location.pathname === '/messages';

  // Calculate unread messages count
  const updateUnreadCount = useCallback(async () => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    try {
      const threads = await messageService.getThreads();
      const totalUnread = threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error updating unread count:', error);
      setUnreadCount(0);
    }
  }, [currentUser]);

  // Update unread count on mount and when user changes
  useEffect(() => {
    updateUnreadCount();
  }, [updateUnreadCount]);

  // Listen for new messages via socket to update unread count
  useEffect(() => {
    if (!currentUser || !socketService.isSocketConnected()) return;

    const handleNewMessage = (data) => {
      // Only update unread count if window is closed or minimized
      if (!isWindowOpen || isMinimized) {
        updateUnreadCount();
      }
    };

    const handleThreadRead = () => {
      updateUnreadCount();
    };

    // Listen for socket events
    socketService.onNewMessage(handleNewMessage);
    socketService.onThreadRead(handleThreadRead);

    return () => {
      socketService.removeListener('new-message');
      socketService.removeListener('thread-read');
    };
  }, [currentUser, isWindowOpen, isMinimized, updateUnreadCount]);

  const handleBubbleClick = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsWindowOpen(true);
    }
  };

  const handleWindowClose = () => {
    setIsWindowOpen(false);
    setIsMinimized(false);
    // Update unread count when window closes
    updateUnreadCount();
  };

  const handleWindowMinimize = () => {
    setIsMinimized(true);
    setIsWindowOpen(false);
  };

  // Don't render if user is not authenticated or on messages page
  if (!currentUser || shouldHideFloatingChat) {
    return null;
  }

  return (
    <>
      <FloatingChatBubble
        onClick={handleBubbleClick}
        unreadCount={unreadCount}
        isOpen={isWindowOpen}
      />
      
      <FloatingChatWindow
        isOpen={isWindowOpen}
        onClose={handleWindowClose}
        onMinimize={handleWindowMinimize}
      />
    </>
  );
};

export default FloatingChatSystem; 