import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const ProfessionalLanding = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = theme;
  const currentTheme = theme;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: currentTheme.bg,
      color: currentTheme.text,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px clamp(16px, 4vw, 32px)',
        borderBottom: `1px solid ${currentTheme.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div 
          onClick={() => navigate('/')}
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: currentTheme.text,
            cursor: 'pointer'
          }}
        >
          Handshake
        </div>
        
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            borderRadius: '6px',
            padding: '6px',
            color: currentTheme.textSecondary,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.color = currentTheme.text;
          }}
          onMouseLeave={(e) => {
            e.target.style.color = currentTheme.textSecondary;
          }}
        >
          {isDarkMode ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.37 5.51c-.18.64-.27 1.31-.27 1.99 0 4.08 3.32 7.4 7.4 7.4.68 0 1.35-.09 1.99-.27C17.45 17.19 14.93 19 12 19c-3.86 0-7-3.14-7-7 0-2.93 1.81-5.45 4.37-6.49zM12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
            </svg>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(32px, 5vw, 64px) clamp(16px, 4vw, 32px)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '500px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: currentTheme.text
            }}>
              Welcome, Professional
            </h1>
            <p style={{
              fontSize: '18px',
              color: currentTheme.textSecondary,
              margin: 0,
              lineHeight: '1.5'
            }}>
              Join Handshake to mentor students, share your expertise, and expand your professional network
            </p>
          </div>

          {/* Registration Card */}
          <div style={{
            backgroundColor: currentTheme.cardBg,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '12px',
            padding: 'clamp(24px, 5vw, 40px)',
            textAlign: 'center',
            marginBottom: '24px',
            boxShadow: `0 4px 12px ${currentTheme.shadow}`
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: currentTheme.accent,
              borderRadius: '50%',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm6 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm5 15H4V8h16v11z"/>
                <path d="M8 10h8v2H8zm0 3h8v2H8z"/>
              </svg>
            </div>
            
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: currentTheme.text
            }}>
              New to Handshake?
            </h3>
            
            <p style={{
              fontSize: '16px',
              color: currentTheme.textSecondary,
              margin: '0 0 32px 0',
              lineHeight: '1.5'
            }}>
              Create your professional profile and start connecting with ambitious students seeking mentorship and career guidance
            </p>
            
            <button
              onClick={() => navigate('/register/professional')}
              style={{
                backgroundColor: currentTheme.accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                boxShadow: `0 2px 8px ${isDarkMode ? 'rgba(35, 134, 54, 0.3)' : 'rgba(9, 105, 218, 0.3)'}`
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = currentTheme.accentHover;
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = currentTheme.accent;
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Register as Professional
            </button>
          </div>

          {/* Login Card */}
          <div style={{
            backgroundColor: currentTheme.cardBg,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '12px',
            padding: 'clamp(24px, 5vw, 32px)',
            textAlign: 'center',
            boxShadow: `0 4px 12px ${currentTheme.shadow}`
          }}>
            <h4 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 12px 0',
              color: currentTheme.text
            }}>
              Already have an account?
            </h4>
            <p style={{
              fontSize: '14px',
              color: currentTheme.textSecondary,
              margin: '0 0 20px 0'
            }}>
              Sign in to access your dashboard, view messages, and manage your mentorship connections
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                backgroundColor: 'transparent',
                color: currentTheme.accent,
                border: `2px solid ${currentTheme.accent}`,
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = currentTheme.accent;
                e.target.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = currentTheme.accent;
              }}
            >
              Sign In Here
            </button>
          </div>

          {/* Back Link */}
          <div style={{
            textAlign: 'center',
            marginTop: '32px'
          }}>
            <span
              onClick={() => navigate('/')}
              style={{
                fontSize: '14px',
                color: currentTheme.textSecondary,
                cursor: 'pointer',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = currentTheme.text;
                e.target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = currentTheme.textSecondary;
                e.target.style.textDecoration = 'none';
              }}
            >
              ← Back to Home
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalLanding; 