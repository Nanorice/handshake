import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Stack,
  Avatar,
  Tooltip,
  InputAdornment,
  OutlinedInput,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme
} from '@mui/material';
import {
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  Key as KeyIcon,
  VerifiedUser as VerifiedUserIcon,
  FilterList as FilterListIcon,
  SupervisorAccount as AdminIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import axios from 'axios';

// Mock data for development
const mockUsers = [
  {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'prof.test@gmail.com',
    status: 'active',
    userType: 'professional',
    createdAt: '2023-01-15T00:00:00.000Z',
    industry: 'Technology',
    company: 'Google',
    lastActive: '2023-03-10T00:00:00.000Z',
    matchesCount: 12,
    coffeeChatsCount: 8
  },
  {
    _id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    status: 'active',
    userType: 'professional',
    createdAt: '2023-02-10T00:00:00.000Z',
    industry: 'Finance',
    company: 'Goldman Sachs',
    lastActive: '2023-03-12T00:00:00.000Z',
    matchesCount: 8,
    coffeeChatsCount: 5
  },
  {
    _id: '3',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.j@example.com',
    status: 'blocked',
    userType: 'professional',
    createdAt: '2023-01-20T00:00:00.000Z',
    industry: 'Healthcare',
    company: 'Mayo Clinic',
    lastActive: '2023-02-15T00:00:00.000Z',
    matchesCount: 4,
    coffeeChatsCount: 2
  },
  {
    _id: '4',
    firstName: 'Emily',
    lastName: 'Brown',
    email: 'emily.b@example.com',
    status: 'active',
    userType: 'seeker',
    createdAt: '2023-02-05T00:00:00.000Z',
    education: 'Stanford University',
    major: 'Computer Science',
    lastActive: '2023-03-11T00:00:00.000Z',
    matchesCount: 15,
    coffeeChatsCount: 10
  },
  {
    _id: '5',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.w@example.com',
    status: 'active',
    userType: 'seeker',
    createdAt: '2023-01-25T00:00:00.000Z',
    education: 'MIT',
    major: 'Data Science',
    lastActive: '2023-03-09T00:00:00.000Z',
    matchesCount: 7,
    coffeeChatsCount: 4
  },
  {
    _id: '6',
    firstName: 'Sarah',
    lastName: 'Davis',
    email: 'sarah.d@example.com',
    status: 'active',
    userType: 'seeker',
    createdAt: '2023-02-15T00:00:00.000Z',
    education: 'Harvard University',
    major: 'Business Administration',
    lastActive: '2023-03-08T00:00:00.000Z',
    matchesCount: 9,
    coffeeChatsCount: 6
  }
];

const mockStats = {
  totalUsers: 156,
  activeUsers: 143,
  newUsersThisMonth: 28,
  professionals: 67,
  students: 89,
  totalMatches: 289,
  totalCoffeeChats: 173,
  completedCoffeeChats: 134,
  upcomingCoffeeChats: 39,
  topIndustries: [
    { name: 'Technology', count: 31 },
    { name: 'Finance', count: 24 },
    { name: 'Healthcare', count: 15 },
    { name: 'Education', count: 12 },
    { name: 'Consulting', count: 9 }
  ],
  topUniversities: [
    { name: 'Stanford University', count: 22 },
    { name: 'MIT', count: 18 },
    { name: 'Harvard University', count: 16 },
    { name: 'UC Berkeley', count: 14 },
    { name: 'University of Washington', count: 12 }
  ]
};

const AdminDashboard = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({});
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchStats();
    
    // Set admin status for development
    localStorage.setItem('isAdmin', 'true');
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, tabValue, searchTerm, filterStatus]);

  const fetchUsers = async () => {
    try {
      // In a real app, this would be an API call
      // const response = await axios.get('http://localhost:5000/api/users');
      // setUsers(response.data.data);
      
      // Using mock data for development
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Error fetching users', 'error');
    }
  };

  const fetchStats = async () => {
    try {
      // In a real app, this would be an API call
      // const response = await axios.get('http://localhost:5000/api/admin/stats');
      // setStats(response.data.data);
      
      // Using mock data for development
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      showSnackbar('Error fetching statistics', 'error');
    }
  };

  const filterUsers = () => {
    let filtered = users.filter(user => {
      // Filter by tab (user type)
      if (tabValue === 0 && user.userType !== 'professional') return false;
      if (tabValue === 1 && user.userType !== 'seeker') return false;
      
      // Filter by search term
      if (searchTerm && !`${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by status
      if (filterStatus !== 'all' && user.status !== filterStatus) return false;
      
      return true;
    });
    
    setFilteredUsers(filtered);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAction = (user, action) => {
    setSelectedUser(user);
    setDialogAction(action);
    setOpenDialog(true);
    
    if (action === 'resetPassword') {
      setResetPasswordEmail(user.email);
    }
  };

  const handleConfirmAction = async () => {
    try {
      let message = '';
      
      // In a real app, these would be API calls
      switch (dialogAction) {
        case 'block':
          // await axios.put(`http://localhost:5000/api/users/${selectedUser._id}/block`);
          message = `User ${selectedUser.email} has been blocked`;
          // Update local state for the demo
          setUsers(users.map(u => u._id === selectedUser._id ? {...u, status: 'blocked'} : u));
          break;
        case 'unblock':
          // await axios.put(`http://localhost:5000/api/users/${selectedUser._id}/unblock`);
          message = `User ${selectedUser.email} has been unblocked`;
          // Update local state for the demo
          setUsers(users.map(u => u._id === selectedUser._id ? {...u, status: 'active'} : u));
          break;
        case 'delete':
          // await axios.delete(`http://localhost:5000/api/users/${selectedUser._id}`);
          message = `User ${selectedUser.email} has been deleted`;
          // Update local state for the demo
          setUsers(users.filter(u => u._id !== selectedUser._id));
          break;
        case 'resetPassword':
          // await axios.post(`http://localhost:5000/api/auth/reset-password`, { email: resetPasswordEmail });
          message = `Password reset link sent to ${resetPasswordEmail}`;
          break;
        default:
          break;
      }
      showSnackbar(message, 'success');
    } catch (error) {
      console.error('Error performing action:', error);
      showSnackbar('Action failed', 'error');
    }
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setDialogAction('');
    setResetPasswordEmail('');
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilterStatus(event.target.value);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const getDialogContent = () => {
    if (!selectedUser && dialogAction !== 'resetPassword') return '';
    
    switch (dialogAction) {
      case 'block':
        return `Are you sure you want to block ${selectedUser.email}?`;
      case 'unblock':
        return `Are you sure you want to unblock ${selectedUser.email}?`;
      case 'delete':
        return `Are you sure you want to delete ${selectedUser.email}? This action cannot be undone.`;
      case 'resetPassword':
        return (
          <TextField
            fullWidth
            margin="normal"
            label="Email Address"
            type="email"
            value={resetPasswordEmail}
            onChange={(e) => setResetPasswordEmail(e.target.value)}
            helperText="A password reset link will be sent to this email"
          />
        );
      default:
        return '';
    }
  };

  const getDialogTitle = () => {
    switch (dialogAction) {
      case 'block':
        return 'Block User';
      case 'unblock':
        return 'Unblock User';
      case 'delete':
        return 'Delete User';
      case 'resetPassword':
        return 'Reset User Password';
      default:
        return 'Confirm Action';
    }
  };

  const exportUsers = () => {
    const userType = tabValue === 0 ? 'professionals' : 'students';
    const fileName = `handshake_${userType}_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Create CSV content
    const headers = 'Name,Email,Status,Joined Date\n';
    const rows = filteredUsers.map(user => 
      `${user.firstName} ${user.lastName},${user.email},${user.status},${new Date(user.createdAt).toLocaleDateString()}`
    ).join('\n');
    const csvContent = headers + rows;
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSnackbar(`${userType.charAt(0).toUpperCase() + userType.slice(1)} data exported successfully`, 'success');
  };

  const renderStatCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalUsers || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                <GroupIcon />
              </Avatar>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Chip 
                size="small" 
                label={`+${stats.newUsersThisMonth || 0} this month`} 
                color="success" 
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  Professionals
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.professionals || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.info.light }}>
                <PersonIcon />
              </Avatar>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {Math.round(((stats.professionals || 0) / (stats.totalUsers || 1)) * 100)}% of users
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  Students
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.students || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.warning.light }}>
                <SchoolIcon />
              </Avatar>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {Math.round(((stats.students || 0) / (stats.totalUsers || 1)) * 100)}% of users
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                  Coffee Chats
                </Typography>
                <Typography variant="h4" component="div">
                  {stats.totalCoffeeChats || 0}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: theme.palette.secondary.light }}>
                <EventIcon />
              </Avatar>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {stats.upcomingCoffeeChats || 0} upcoming
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTopInsights = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Industries
            </Typography>
            <List>
              {stats.topIndustries?.map((industry, index) => (
                <ListItem key={index} dense>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Typography color="primary" variant="subtitle1">{index + 1}</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary={industry.name} 
                    secondary={`${industry.count} professionals`} 
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Universities
            </Typography>
            <List>
              {stats.topUniversities?.map((university, index) => (
                <ListItem key={index} dense>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Typography color="primary" variant="subtitle1">{index + 1}</Typography>
                  </ListItemIcon>
                  <ListItemText 
                    primary={university.name} 
                    secondary={`${university.count} students`} 
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderUserTable = () => (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <FormControl sx={{ width: '50%' }} variant="outlined" size="small">
            <InputLabel htmlFor="search-users">Search Users</InputLabel>
            <OutlinedInput
              id="search-users"
              value={searchTerm}
              onChange={handleSearchChange}
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              }
              label="Search Users"
              placeholder="Name, email..."
            />
          </FormControl>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="filter-status-label">Status</InputLabel>
            <Select
              labelId="filter-status-label"
              id="filter-status"
              value={filterStatus}
              onChange={handleFilterChange}
              label="Status"
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="blocked">Blocked</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchUsers} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="Export to CSV">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportUsers}
              size="small"
            >
              Export
            </Button>
          </Tooltip>
        </Box>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Joined Date</TableCell>
              <TableCell>{tabValue === 0 ? 'Company' : 'Education'}</TableCell>
              <TableCell>Activity</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <TableRow key={user._id}>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.status} 
                      size="small" 
                      color={user.status === 'active' ? 'success' : 'error'} 
                      variant={user.status === 'active' ? 'outlined' : 'filled'} 
                    />
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{tabValue === 0 ? user.company : user.education}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {user.matchesCount} matches
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.coffeeChatsCount} chats
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title={user.status === 'active' ? 'Block User' : 'Unblock User'}>
                        <IconButton
                          size="small"
                          onClick={() => handleAction(user, user.status === 'active' ? 'block' : 'unblock')}
                          color={user.status === 'active' ? 'error' : 'success'}
                        >
                          {user.status === 'active' ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset Password">
                        <IconButton
                          size="small"
                          onClick={() => handleAction(user, 'resetPassword')}
                          color="primary"
                        >
                          <KeyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          onClick={() => handleAction(user, 'delete')}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage users and monitor platform activity
        </Typography>
      </Box>

      {renderStatCards()}
      {renderTopInsights()}

      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Professionals" />
          <Tab label="Students" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {renderUserTable()}
        </Box>
      </Paper>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          {typeof getDialogContent() === 'string' ? (
            <Typography sx={{ mt: 2 }}>{getDialogContent()}</Typography>
          ) : (
            getDialogContent()
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleConfirmAction}
            color={dialogAction === 'delete' ? 'error' : 'primary'}
            variant="contained"
            disableElevation
          >
            {dialogAction === 'resetPassword' ? 'Send Reset Link' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard; 