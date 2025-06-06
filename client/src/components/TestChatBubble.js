import React from 'react';

const TestChatBubble = () => {
  console.log('[TestChatBubble] Rendering test chat bubble');
  
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        backgroundColor: '#1976d2',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        color: 'white',
        fontSize: '24px'
      }}
      onClick={() => alert('Chat bubble clicked!')}
    >
      💬
    </div>
  );
};

export default TestChatBubble; 