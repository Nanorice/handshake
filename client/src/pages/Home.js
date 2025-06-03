import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Home = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = theme;
  const currentTheme = theme; // For backward compatibility

  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Handle window resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Close mobile menu on resize to larger screen
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Improved responsive logic
  const shouldShowMobileMenu = windowWidth < 768;
  const shouldShowDesktopNav = windowWidth >= 768;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: currentTheme.bg,
      color: currentTheme.text,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px clamp(16px, 4vw, 32px)',
        borderBottom: `1px solid ${currentTheme.border}`,
        position: 'sticky',
        top: 0,
        backgroundColor: currentTheme.components.navbar.background,
        backdropFilter: 'blur(12px)',
        zIndex: 50
      }}>
        <nav style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: currentTheme.text
          }}>
            Handshake
          </div>
          
          {/* Desktop Navigation */}
          {shouldShowDesktopNav && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(20px, 3vw, 32px)'
            }}>
              <span onClick={() => navigate('/for-professionals')} style={{
                color: currentTheme.textSecondary,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '400',
                transition: 'color 0.2s ease',
                cursor: 'pointer'
              }} 
              onMouseEnter={(e) => e.target.style.color = currentTheme.text}
              onMouseLeave={(e) => e.target.style.color = currentTheme.textSecondary}>
                For professionals
              </span>
              <span onClick={() => navigate('/register/seeker')} style={{
                color: currentTheme.textSecondary,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '400',
                transition: 'color 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = currentTheme.text}
              onMouseLeave={(e) => e.target.style.color = currentTheme.textSecondary}>
                For students
              </span>
              <span onClick={(e) => e.preventDefault()} style={{
                color: currentTheme.textSecondary,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '400',
                transition: 'color 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.color = currentTheme.text}
              onMouseLeave={(e) => e.target.style.color = currentTheme.textSecondary}>
                About
              </span>
              
              {/* Theme Toggle */}
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
              
              <button
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: currentTheme.accent,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = currentTheme.accentHover}
                onMouseLeave={(e) => e.target.style.backgroundColor = currentTheme.accent}
              >
                Sign in
              </button>
            </div>
          )}

          {/* Mobile Menu Button - Only show on small screens */}
          {shouldShowMobileMenu && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                style={{
                  background: 'none',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  color: currentTheme.textSecondary,
                  cursor: 'pointer'
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
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentTheme.textSecondary,
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Menu */}
        {shouldShowMobileMenu && mobileMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: currentTheme.cardBg,
            borderBottom: `1px solid ${currentTheme.border}`,
            padding: '16px clamp(16px, 4vw, 32px)',
            boxShadow: `0 8px 24px ${currentTheme.shadow}`
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span onClick={() => navigate('/for-professionals')} style={{ color: currentTheme.textSecondary, textDecoration: 'none', fontSize: '14px', padding: '8px 0', cursor: 'pointer' }}>For professionals</span>
              <span onClick={() => navigate('/register/seeker')} style={{ color: currentTheme.textSecondary, textDecoration: 'none', fontSize: '14px', padding: '8px 0', cursor: 'pointer' }}>For students</span>
              <span onClick={(e) => e.preventDefault()} style={{ color: currentTheme.textSecondary, textDecoration: 'none', fontSize: '14px', padding: '8px 0', cursor: 'pointer' }}>About</span>
              <button
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: currentTheme.accent,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: 'clamp(40px, 8vw, 80px) clamp(16px, 4vw, 32px)',
        display: 'flex',
        alignItems: 'center',
        minHeight: 'calc(100vh - 200px)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth >= 768 ? '1fr 1fr' : '1fr',
          gap: 'clamp(40px, 8vw, 80px)',
          alignItems: 'center',
          width: '100%'
        }}>
          {/* Left Column */}
          <div style={{
            textAlign: windowWidth >= 768 ? 'left' : 'center'
          }}>
            <h1 
              key={`gradient-text-${isDarkMode}`} // Force re-render on theme change
              style={{
                fontSize: 'clamp(48px, 8vw, 80px)',
                fontWeight: '700',
                lineHeight: '1.1',
                margin: '0 0 24px 0',
                background: isDarkMode ? 
                  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)' :
                  'linear-gradient(135deg, #0969da 0%, #6f42c1 50%, #d63384 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
                display: 'inline-block',
                transition: 'none' // Disable any transitions that might interfere
              }}>
              Handshake
            </h1>
            <h2 style={{
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: '500',
              lineHeight: '1.2',
              margin: '0 0 24px 0',
              color: currentTheme.text
            }}>
              Supercharge your career networking
            </h2>
            <p style={{
              fontSize: '18px',
              lineHeight: '1.6',
              margin: '0 0 40px 0',
              color: currentTheme.textSecondary,
              maxWidth: '500px',
              marginLeft: windowWidth >= 768 ? '0' : 'auto',
              marginRight: windowWidth >= 768 ? '0' : 'auto'
            }}>
              Connect with experienced professionals for insightful coffee chats, mentorship, and guidance to navigate your career path.
            </p>
            <button
              onClick={() => navigate('/register')}
              style={{
                backgroundColor: currentTheme.accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: `0 4px 12px ${isDarkMode ? 'rgba(35, 134, 54, 0.3)' : 'rgba(9, 105, 218, 0.3)'}`
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = currentTheme.accentHover;
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = `0 6px 20px ${isDarkMode ? 'rgba(35, 134, 54, 0.4)' : 'rgba(9, 105, 218, 0.4)'}`;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = currentTheme.accent;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 4px 12px ${isDarkMode ? 'rgba(35, 134, 54, 0.3)' : 'rgba(9, 105, 218, 0.3)'}`;
              }}
            >
              Get started
            </button>
          </div>

          {/* Right Column - Hidden on mobile */}
          {windowWidth >= 768 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px'
            }}>
              {/* Illustration */}
              <div style={{
                width: '320px',
                height: '400px',
                backgroundColor: currentTheme.cardBg,
                borderRadius: '12px',
                border: `1px solid ${currentTheme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  textAlign: 'center',
                  color: currentTheme.textSecondary,
                  fontSize: '14px'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: currentTheme.border,
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  Professional networking illustration
                </div>
              </div>

              {/* Demo Chat */}
              <div style={{
                width: '320px',
                backgroundColor: currentTheme.cardBg,
                borderRadius: '12px',
                border: `1px solid ${currentTheme.border}`,
                padding: '20px',
                position: 'relative'
              }}>
                <p style={{
                  fontSize: '13px',
                  color: currentTheme.textSecondary,
                  margin: '0 0 16px 0'
                }}>
                  Here are some networking opportunities:
                </p>
                <div style={{
                  backgroundColor: currentTheme.bg,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: `1px solid ${currentTheme.border}`
                }}>
                  <div style={{ padding: '12px', borderBottom: `1px solid ${currentTheme.border}`, backgroundColor: currentTheme.cardBg }}>
                    <div style={{ display: 'flex', gap: '40px', fontSize: '11px', fontWeight: '500', color: currentTheme.textSecondary, textTransform: 'uppercase' }}>
                      <span>Company</span>
                      <span>Role</span>
                      <span>Level</span>
                    </div>
                  </div>
                  {[
                    { company: 'Google', role: 'SWE', level: 'Senior' },
                    { company: 'Meta', role: 'PM', level: 'L5' },
                    { company: 'Microsoft', role: 'Designer', level: 'Senior' },
                    { company: 'Apple', role: 'ML Eng', level: 'Staff' }
                  ].map((item, index) => (
                    <div key={index} style={{
                      padding: '8px 12px',
                      borderBottom: index < 3 ? `1px solid ${currentTheme.border}` : 'none',
                      display: 'flex',
                      gap: '40px',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: currentTheme.text, fontWeight: '500', width: '60px' }}>{item.company}</span>
                      <span style={{ color: currentTheme.textSecondary, width: '50px' }}>{item.role}</span>
                      <span style={{ color: currentTheme.textSecondary }}>{item.level}</span>
                    </div>
                  ))}
                </div>
                {/* Chat bubble tail */}
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: `8px solid ${currentTheme.cardBg}`
                }}></div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `1px solid ${currentTheme.border}`,
        padding: '32px clamp(16px, 4vw, 32px)',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: currentTheme.textSecondary,
            fontSize: '14px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Handshake</span>
          </div>
          <div>
            <a href="#" style={{
              color: currentTheme.textSecondary,
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = currentTheme.text}
            onMouseLeave={(e) => e.target.style.color = currentTheme.textSecondary}>
              Privacy and Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 