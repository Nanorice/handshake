import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';

const RegisterForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = theme;
  const currentTheme = theme; // For backward compatibility

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
          maxWidth: '800px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: currentTheme.text
            }}>
              Join Handshake
            </h1>
            <p style={{
              fontSize: '18px',
              color: currentTheme.textSecondary,
              margin: 0,
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Choose your account type to get started with professional networking
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth >= 768 ? '1fr 1fr' : '1fr',
            gap: 'clamp(24px, 4vw, 32px)',
            marginBottom: '40px'
          }}>
            {/* Student Card */}
            <div style={{
              backgroundColor: currentTheme.cardBg,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '12px',
              padding: 'clamp(24px, 5vw, 40px)',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${currentTheme.shadow}`
            }}
            onClick={() => navigate('/register/seeker')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = currentTheme.accent;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 20px ${currentTheme.shadow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = currentTheme.border;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${currentTheme.shadow}`;
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
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                margin: '0 0 16px 0',
                color: currentTheme.text
              }}>
                I'm a Student
              </h3>
              
              <p style={{
                fontSize: '16px',
                color: currentTheme.textSecondary,
                margin: '0 0 32px 0',
                lineHeight: '1.5'
              }}>
                Looking to connect with professionals for career guidance, mentorship, and networking opportunities
              </p>
              
              <div style={{
                backgroundColor: currentTheme.accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                display: 'inline-block',
                width: '100%',
                textAlign: 'center'
              }}>
                Register as Student
              </div>
            </div>

            {/* Professional Card */}
            <div style={{
              backgroundColor: currentTheme.cardBg,
              border: `1px solid ${currentTheme.border}`,
              borderRadius: '12px',
              padding: 'clamp(24px, 5vw, 40px)',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${currentTheme.shadow}`
            }}
            onClick={() => navigate('/register/professional')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = currentTheme.accent;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 20px ${currentTheme.shadow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = currentTheme.border;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${currentTheme.shadow}`;
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
                I'm a Professional
              </h3>
              
              <p style={{
                fontSize: '16px',
                color: currentTheme.textSecondary,
                margin: '0 0 32px 0',
                lineHeight: '1.5'
              }}>
                Ready to share your expertise, mentor the next generation, and expand your professional network
              </p>
              
              <div style={{
                backgroundColor: currentTheme.accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                display: 'inline-block',
                width: '100%',
                textAlign: 'center'
              }}>
                Register as Professional
              </div>
            </div>
          </div>

          {/* Login Link */}
          <div style={{
            textAlign: 'center',
            padding: '32px',
            backgroundColor: currentTheme.cardBg,
            border: `1px solid ${currentTheme.border}`,
            borderRadius: '12px',
            boxShadow: `0 4px 12px ${currentTheme.shadow}`
          }}>
            <p style={{
              fontSize: '16px',
              color: currentTheme.textSecondary,
              margin: 0
            }}>
              Already have an account?{' '}
              <span
                onClick={() => navigate('/login')}
                style={{
                  color: currentTheme.accent,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                Sign in here
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterForm; 