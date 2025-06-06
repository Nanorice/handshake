import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const ProfessionalLanding = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isDarkMode, isProfessional, toggleTheme } = theme;
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
        
        <ThemeToggle variant="animated" size="small" />
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
                boxShadow: `0 2px 8px ${isDarkMode 
                  ? 'rgba(35, 134, 54, 0.3)' 
                  : 'rgba(30, 64, 175, 0.3)'  // Professional page always uses deep blue
                }`
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