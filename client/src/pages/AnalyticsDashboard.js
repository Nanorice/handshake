import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  useTheme,
  Container,
  Alert,
  Skeleton,
  Tooltip,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Message as MessageIcon,
  Handshake as HandshakeIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  LiveTv as LiveIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import axios from 'axios';
import socketService from '../services/socketService';

const AnalyticsDashboard = () => {
  const theme = useTheme();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRealTime, setIsRealTime] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const refreshInterval = useRef(null);

  // Token for API requests
  const token = localStorage.getItem('token');

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setError(null);
      const response = await axios.get('/api/analytics/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-admin-override': 'true' // For development
        }
      });
      
      if (response.data.success) {
        setAnalytics(response.data.data);
        setLastUpdated(new Date());
        setLoading(false);
        console.log('📊 Analytics data fetched:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.response?.data?.message || 'Failed to fetch analytics');
      setLoading(false);
    }
  };

  // Toggle real-time updates
  const toggleRealTime = () => {
    if (isRealTime) {
      // Disable real-time
      socketService.emit('unsubscribe-analytics');
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      setIsRealTime(false);
      console.log('📊 Disabled real-time analytics');
    } else {
      // Enable real-time
      socketService.emit('subscribe-analytics');
      
      // Auto-refresh every 30 seconds as backup
      refreshInterval.current = setInterval(fetchAnalytics, 30000);
      setIsRealTime(true);
      console.log('📊 Enabled real-time analytics');
    }
  };

  // Socket.IO real-time updates
  useEffect(() => {
    const handleAnalyticsUpdate = (data) => {
      console.log('📊 Real-time analytics update received:', data);
      if (data.data && data.data.userGrowth) {
        setAnalytics(data.data);
        setLastUpdated(new Date(data.timestamp));
      }
    };

    socketService.on('analytics-update', handleAnalyticsUpdate);

    return () => {
      socketService.off('analytics-update', handleAnalyticsUpdate);
    };
  }, []);

  // Initial load
  useEffect(() => {
    fetchAnalytics();

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
      if (isRealTime) {
        socketService.emit('unsubscribe-analytics');
      }
    };
  }, []);

  // Metric Card Component
  const MetricCard = ({ title, value, subtitle, icon, color = 'primary', trend = null }) => (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" color={`${color}.main`} fontWeight="bold">
              {loading ? <Skeleton width={60} /> : value}
            </Typography>
            <Typography variant="h6" color="text.primary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {loading ? <Skeleton width={100} /> : subtitle}
            </Typography>
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUpIcon 
                  fontSize="small" 
                  color={trend > 0 ? 'success' : 'error'} 
                />
                <Typography 
                  variant="caption" 
                  color={trend > 0 ? 'success.main' : 'error.main'}
                  ml={0.5}
                >
                  {trend > 0 ? '+' : ''}{trend}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: `${color}.light`,
              color: `${color}.main`
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // System Health Status
  const SystemHealthCard = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="between">
          <Typography variant="h6" gutterBottom>
            System Health
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              icon={<CheckCircleIcon />}
              label="Operational"
              color="success"
              variant="outlined"
              size="small"
            />
            {isRealTime && (
              <Badge color="success" variant="dot">
                <LiveIcon color="primary" />
              </Badge>
            )}
          </Box>
        </Box>
        
        {analytics?.systemHealth && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Recent Activity (Last Hour)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h5" color="primary.main">
                    {analytics.systemHealth.recentActivity.messages}
                  </Typography>
                  <Typography variant="caption">Messages</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h5" color="success.main">
                    {analytics.systemHealth.recentActivity.logins}
                  </Typography>
                  <Typography variant="caption">Logins</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h5" color="info.main">
                    {analytics.systemHealth.recentActivity.invitations}
                  </Typography>
                  <Typography variant="caption">Invitations</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Top Categories Component
  const TopCategoriesCard = ({ title, data, icon }) => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          {icon}
          <Typography variant="h6">{title}</Typography>
        </Box>
        
        {loading ? (
          <Box>
            {[1, 2, 3, 4, 5].map(i => (
              <Box key={i} display="flex" justifyContent="space-between" mb={1}>
                <Skeleton width="60%" />
                <Skeleton width="20%" />
              </Box>
            ))}
          </Box>
        ) : (
          <Box>
            {data?.map((item, index) => (
              <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">{item.name}</Typography>
                <Chip label={item.count} size="small" color="primary" variant="outlined" />
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time platform insights and metrics
          </Typography>
        </Box>
        
        <Box display="flex" gap={2} alignItems="center">
          {lastUpdated && (
            <Box display="flex" alignItems="center" gap={1}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            </Box>
          )}
          
          <Tooltip title={isRealTime ? "Disable real-time updates" : "Enable real-time updates"}>
            <IconButton 
              onClick={toggleRealTime}
              color={isRealTime ? "success" : "default"}
            >
              {isRealTime ? <LiveIcon /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Metrics Grid */}
      <Grid container spacing={3} mb={4}>
        {/* User Growth Metrics */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={analytics?.userGrowth?.totalUsers || 0}
            subtitle={`+${analytics?.userGrowth?.newUsers?.month || 0} this month`}
            icon={<GroupIcon />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Today"
            value={analytics?.userGrowth?.activeUsers?.today || 0}
            subtitle={`${analytics?.userGrowth?.activeUsers?.week || 0} this week`}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Messages Today"
            value={analytics?.messaging?.messagesPerPeriod?.today || 0}
            subtitle={`${analytics?.messaging?.totalMessages || 0} total`}
            icon={<MessageIcon />}
            color="info"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Invitations Today"
            value={analytics?.professional?.invitationsPerPeriod?.today || 0}
            subtitle={`${analytics?.professional?.acceptanceRate || 0}% acceptance rate`}
            icon={<HandshakeIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Secondary Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Professionals"
            value={analytics?.userGrowth?.userTypes?.professionals || 0}
            subtitle="Active professionals"
            icon={<BusinessIcon />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Students"
            value={analytics?.userGrowth?.userTypes?.seekers || 0}
            subtitle="Seeking mentorship"
            icon={<SchoolIcon />}
            color="secondary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard
            title="Active Threads"
            value={analytics?.messaging?.activeThreadsToday || 0}
            subtitle={`${analytics?.messaging?.totalThreads || 0} total threads`}
            icon={<TimelineIcon />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* System Health and Categories */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SystemHealthCard />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <TopCategoriesCard
            title="Top Industries"
            data={analytics?.categories?.topIndustries}
            icon={<BusinessIcon color="primary" />}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <TopCategoriesCard
            title="Top Universities"
            data={analytics?.categories?.topUniversities}
            icon={<SchoolIcon color="secondary" />}
          />
        </Grid>
      </Grid>

      {/* Real-time Indicator */}
      {isRealTime && (
        <Box mt={2}>
          <LinearProgress color="success" />
          <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
            🔴 Live analytics - updating every 30 seconds
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default AnalyticsDashboard; 