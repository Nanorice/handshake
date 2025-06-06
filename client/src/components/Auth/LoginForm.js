import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authService';
import { setUserData, getAuthToken } from '../../utils/authUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';

const LoginForm = () => {
  const navigate = useNavigate();
  const { refreshAuthState } = useAuth();
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = theme;
  const currentTheme = theme; // For backward compatibility
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  const attemptLogin = async () => {
    if (!validateForm()) return;

    setIsLoggingIn(true);
    setErrors({});

    try {
      const response = await login(formData);
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data;

        if (!token || !userData || !userData._id) {
          console.error('Login response missing token, user data, or user ID', response.data);
          showNotification('Login failed: Invalid server response.', 'error');
          setIsLoggingIn(false);
          return;
        }
        
        console.log('Login successful, preparing to store auth data:', { 
          userIdToStore: userData._id,
          tokenLength: token.length,
          tokenStartsWith: token.substring(0, 10)
        });

        // Use the centralized setUserData utility
        setUserData({ user: userData, token });
        
        console.log('Auth data stored via setUserData. Checking localStorage:', {
          token: getAuthToken()?.substring(0, 10) + '...',
          userData: !!localStorage.getItem('userData'),
          userId: localStorage.getItem('userId'),
          isLoggedIn: localStorage.getItem('isLoggedIn')
        });
        
        showNotification('Login successful! Redirecting to dashboard...', 'success');
        
        setTimeout(() => {
          refreshAuthState(); 
          navigate('/dashboard');
        }, 1000);
        
      } else {
        console.error('Login failed:', response.message || 'Unknown error');
        showNotification(response.message || 'Login failed. Please check your credentials and try again.', 'error');
      }
    } catch (error) {
      console.error('Login attempt error:', error);
      showNotification(error.message || 'An unexpected error occurred during login.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Check if already authenticated
  useEffect(() => {
    if (getAuthToken()) {
      console.log('User already authenticated, redirecting to dashboard.');
      navigate('/dashboard');
    }
  }, [navigate]);

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
          maxWidth: '400px',
          backgroundColor: currentTheme.cardBg,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: '12px',
          padding: 'clamp(24px, 5vw, 40px)',
          boxShadow: `0 8px 24px ${currentTheme.shadow}`
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '600',
              margin: '0 0 8px 0',
              color: currentTheme.text
            }}>
              Welcome back
            </h1>
            <p style={{
              fontSize: '14px',
              color: currentTheme.textSecondary,
              margin: 0
            }}>
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); attemptLogin(); }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: currentTheme.text,
                marginBottom: '6px'
              }}>
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  backgroundColor: currentTheme.inputBg,
                  border: `1px solid ${errors.email ? currentTheme.error : currentTheme.inputBorder}`,
                  borderRadius: '6px',
                  color: currentTheme.text,
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = currentTheme.inputFocus}
                onBlur={(e) => e.target.style.borderColor = errors.email ? currentTheme.error : currentTheme.inputBorder}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p style={{
                  fontSize: '12px',
                  color: currentTheme.error,
                  margin: '4px 0 0 0'
                }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: currentTheme.text,
                marginBottom: '6px'
              }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  backgroundColor: currentTheme.inputBg,
                  border: `1px solid ${errors.password ? currentTheme.error : currentTheme.inputBorder}`,
                  borderRadius: '6px',
                  color: currentTheme.text,
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = currentTheme.inputFocus}
                onBlur={(e) => e.target.style.borderColor = errors.password ? currentTheme.error : currentTheme.inputBorder}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p style={{
                  fontSize: '12px',
                  color: currentTheme.error,
                  margin: '4px 0 0 0'
                }}>
                  {errors.password}
                </p>
              )}
            </div>

            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <a href="#" style={{
                fontSize: '14px',
                color: currentTheme.accent,
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: isLoggingIn ? currentTheme.textSecondary : currentTheme.accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
                opacity: isLoggingIn ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoggingIn) {
                  e.target.style.backgroundColor = currentTheme.accentHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoggingIn) {
                  e.target.style.backgroundColor = currentTheme.accent;
                }
              }}
            >
              {isLoggingIn ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: `1px solid ${currentTheme.border}`
          }}>
            <p style={{
              fontSize: '14px',
              color: currentTheme.textSecondary,
              margin: 0
            }}>
              Don't have an account?{' '}
              <span
                onClick={() => navigate('/register')}
                style={{
                  color: currentTheme.accent,
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                Sign up
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: notification.type === 'error' ? currentTheme.error : currentTheme.success,
          color: '#ffffff',
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          boxShadow: `0 4px 12px ${currentTheme.shadow}`,
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default LoginForm; 