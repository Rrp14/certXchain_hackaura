import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  Check as CheckIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { logout } from '../redux/slices/authSlice';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [institutions, setInstitutions] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [error, setError] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
    const userType = localStorage.getItem('userType');
    
    if (!user || userType !== 'admin') {
      console.log('Not an admin user, redirecting to login');
      navigate('/admin/login');
      return;
    }
    console.log('Fetching institutions as admin:', user);
    fetchInstitutions();
  }, [navigate]);

  const fetchInstitutions = async () => {
    try {
      console.log('Fetching institutions with token:', localStorage.getItem('token'));
      const response = await axios.get(`${API_URL}/admin/institutions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Institutions fetched:', response.data);
      setInstitutions(response.data);
    } catch (err) {
      console.error('Error fetching institutions:', err);
      setError('Failed to fetch institutions');
      if (err.response?.status === 401) {
        // Token expired or invalid
        dispatch(logout());
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (institutionId) => {
    try {
      await axios.post(`${API_URL}/admin/institutions/${institutionId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchInstitutions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve institution');
    }
  };

  const handleRevoke = async (institutionId) => {
    try {
      await axios.post(`${API_URL}/admin/institutions/${institutionId}/revoke`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchInstitutions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke institution');
    }
  };

  const handleReject = async (institutionId) => {
    try {
      await axios.post(`${API_URL}/admin/institutions/${institutionId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchInstitutions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject institution');
    }
  };

  const handleViewDetails = (institution) => {
    setSelectedInstitution(institution);
    setOpenDialog(true);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await axios.put(`${API_URL}/admin/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setOpenPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Failed to change password');
    }
  };

  const filteredInstitutions = institutions.filter((inst) => {
    if (selectedTab === 0) return inst.status === 'pending';
    if (selectedTab === 1) return inst.status === 'approved';
    if (selectedTab === 2) return inst.status === 'revoked';
    return true;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h1" variant="h4">
                Admin Dashboard
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => setOpenPasswordDialog(true)}
                  sx={{ mr: 2 }}
                >
                  Change Password
                </Button>
                <Button variant="outlined" color="error" onClick={handleLogout}>
                  Logout
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Tabs
              value={selectedTab}
              onChange={(e, newValue) => setSelectedTab(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab label="Pending Approval" />
              <Tab label="Active Institutions" />
              <Tab label="Revoked Institutions" />
            </Tabs>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInstitutions.map((institution) => (
                    <TableRow key={institution._id}>
                      <TableCell>{institution.name}</TableCell>
                      <TableCell>{institution.email}</TableCell>
                      <TableCell>{institution.status}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleViewDetails(institution)}
                        >
                          <InfoIcon />
                        </IconButton>
                        {institution.status === 'pending' && (
                          <>
                            <IconButton
                              color="success"
                              onClick={() => handleApprove(institution._id)}
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleReject(institution._id)}
                            >
                              <CloseIcon />
                            </IconButton>
                          </>
                        )}
                        {institution.status === 'approved' && (
                          <IconButton
                            color="error"
                            onClick={() => handleRevoke(institution._id)}
                          >
                            <BlockIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Institution Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Institution Details</DialogTitle>
        <DialogContent>
          {selectedInstitution && (
            <Box>
              <Typography><strong>Name:</strong> {selectedInstitution.name}</Typography>
              <Typography><strong>Email:</strong> {selectedInstitution.email}</Typography>
              <Typography><strong>Status:</strong> {selectedInstitution.status}</Typography>
              <Typography><strong>Created At:</strong> {new Date(selectedInstitution.createdAt).toLocaleString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label="Current Password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard; 