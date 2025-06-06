import React, { useState, useRef, useEffect } from 'react';
import { useMessages } from '../contexts/MessageProvider';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { MessageCircle, X, Send, MoreHorizontal, ChevronDown, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatBubble = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [showThreadsList, setShowThreadsList] = useState(true);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    threads,
    totalUnreadCount,
    sendMessage,
    loadThreadMessages,
    createNewThread,
    markThreadAsRead,
    setActiveThread: setContextActiveThread
  } = useMessages();

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

  // Get sorted threads by most recent activity
  const sortedThreads = Object.values(threads).sort((a, b) => {
    const aTime = new Date(a.lastMessage?.timestamp || a.updatedAt || a.createdAt);
    const bTime = new Date(b.lastMessage?.timestamp || b.updatedAt || b.createdAt);
    return bTime - aTime;
  });

  // Get active thread data
  const activeThread = activeThreadId ? threads[activeThreadId] : null;

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setIsExpanded(false);
        setActiveThreadId(null);
        setShowThreadsList(true);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Focus input when thread is selected
  useEffect(() => {
    if (activeThreadId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeThreadId]);

  // Handle thread selection
  const handleThreadSelect = async (threadId) => {
    setActiveThreadId(threadId);
    setShowThreadsList(false);
    setContextActiveThread(threadId);
    
    // Load messages if not already loaded
    if (!threads[threadId]?.messages) {
      await loadThreadMessages(threadId);
    }
    
    // Mark as read
    await markThreadAsRead(threadId);
  };

  // Handle message send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeThreadId) return;

    try {
      await sendMessage(activeThreadId, {
        content: messageInput.trim(),
        messageType: 'text'
      });
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle expand/collapse
  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setActiveThreadId(null);
      setShowThreadsList(true);
    }
  };

  // Get other participant in thread
  const getOtherParticipant = (thread) => {
    return thread.participants?.find(p => p._id !== user?._id);
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? 'now' : `${diffMins}m`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Navigate to full messaging page
  const handleOpenFullChat = () => {
    navigate('/messages');
    setIsExpanded(false);
  };

  // Don't render if user is not authenticated
  if (!user) return null;

  return (
    <div 
      ref={chatRef}
      className="fixed bottom-0 right-6 z-50"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* Expanded Chat Window */}
      {isExpanded && (
        <div 
          className="mb-2 rounded-t-lg overflow-hidden"
          style={{
            width: '360px',
            height: '480px',
            backgroundColor: currentTheme.background,
            border: `1px solid ${currentTheme.border}`,
            boxShadow: currentTheme.shadow
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-3 border-b"
            style={{ 
              backgroundColor: currentTheme.surface,
              borderColor: currentTheme.border 
            }}
          >
            <div className="flex items-center space-x-2">
              {!showThreadsList && activeThread && (
                <button
                  onClick={() => {
                    setShowThreadsList(true);
                    setActiveThreadId(null);
                  }}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" style={{ color: currentTheme.text }} />
                </button>
              )}
              
              <MessageCircle className="w-5 h-5" style={{ color: currentTheme.primary }} />
              
              <span className="font-semibold text-sm" style={{ color: currentTheme.text }}>
                {showThreadsList ? 'Messaging' : 
                  `${getOtherParticipant(activeThread)?.firstName || 'Chat'}`}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={handleOpenFullChat}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                title="Open full messaging"
              >
                <MoreHorizontal className="w-4 h-4" style={{ color: currentTheme.textSecondary }} />
              </button>
              
              <button
                onClick={handleToggleExpand}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <X className="w-4 h-4" style={{ color: currentTheme.textSecondary }} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col h-[calc(100%-60px)]">
            {showThreadsList ? (
              /* Threads List */
              <div className="flex-1 overflow-y-auto">
                {sortedThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <Users className="w-12 h-12 mb-3" style={{ color: currentTheme.textSecondary }} />
                    <p className="text-sm" style={{ color: currentTheme.textSecondary }}>
                      No conversations yet
                    </p>
                    <button
                      onClick={handleOpenFullChat}
                      className="mt-2 px-4 py-2 rounded text-sm font-medium"
                      style={{ 
                        backgroundColor: currentTheme.primary,
                        color: '#ffffff'
                      }}
                    >
                      Start a conversation
                    </button>
                  </div>
                ) : (
                  sortedThreads.slice(0, 8).map((thread) => {
                    const otherParticipant = getOtherParticipant(thread);
                    const unreadCount = thread.unreadCount?.get?.(user._id) || 0;
                    
                    return (
                      <div
                        key={thread._id}
                        onClick={() => handleThreadSelect(thread._id)}
                        className="flex items-center p-3 cursor-pointer border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                        style={{ borderColor: currentTheme.border }}
                      >
                        {/* Avatar */}
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                          style={{ backgroundColor: currentTheme.primary }}
                        >
                          {otherParticipant?.firstName?.[0] || 'U'}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate" style={{ color: currentTheme.text }}>
                              {otherParticipant?.firstName} {otherParticipant?.lastName}
                            </p>
                            
                            {thread.lastMessage && (
                              <span className="text-xs ml-2" style={{ color: currentTheme.textSecondary }}>
                                {formatTime(thread.lastMessage.timestamp)}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs truncate" style={{ color: currentTheme.textSecondary }}>
                              {thread.lastMessage?.content || 'No messages yet'}
                            </p>
                            
                            {unreadCount > 0 && (
                              <span 
                                className="text-xs px-2 py-0.5 rounded-full text-white ml-2"
                                style={{ backgroundColor: currentTheme.unreadBg }}
                              >
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Individual Thread View */
              activeThread && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {activeThread.messages?.slice(-10).map((message) => {
                      const isOwn = message.sender._id === user._id;
                      
                      return (
                        <div
                          key={message._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className="max-w-[70%] px-3 py-2 rounded-lg text-sm"
                            style={{
                              backgroundColor: isOwn ? currentTheme.primary : currentTheme.surface,
                              color: isOwn ? '#ffffff' : currentTheme.text
                            }}
                          >
                            {message.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t" style={{ borderColor: currentTheme.border }}>
                    <div className="flex items-center space-x-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Write a message..."
                        className="flex-1 px-3 py-2 rounded-full text-sm border focus:outline-none focus:ring-2"
                        style={{
                          backgroundColor: currentTheme.background,
                          borderColor: currentTheme.border,
                          color: currentTheme.text,
                          focusRingColor: currentTheme.primary
                        }}
                      />
                      
                      <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="p-2 rounded-full disabled:opacity-50"
                        style={{
                          backgroundColor: currentTheme.primary,
                          color: '#ffffff'
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </>
              )
            )}
          </div>
        </div>
      )}

      {/* Chat Bubble */}
      <button
        onClick={handleToggleExpand}
        className="relative p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        style={{
          backgroundColor: currentTheme.primary,
          color: '#ffffff'
        }}
      >
        <MessageCircle className="w-6 h-6" />
        
        {/* Unread Count Badge */}
        {totalUnreadCount > 0 && (
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
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatBubble; 