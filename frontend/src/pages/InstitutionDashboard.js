import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:5000/api';

const InstitutionDashboard = () => {
  const [institution, setInstitution] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openCertificateDialog, setOpenCertificateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    studentName: '',
    course: '',
    date: '',
    studentEmail: ''
  });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstitutionData();
    fetchCertificates();
    fetchTemplates();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchInstitutionData = async () => {
    try {
      const response = await axios.get(`${API_URL}/institution/profile`, {
        headers: getAuthHeader()
      });
      setInstitution(response.data);
      setFormData(prev => ({
        ...prev,
        name: response.data.name,
        description: response.data.description
      }));
    } catch (error) {
      console.error('Error fetching institution data:', error);
      setError('Failed to fetch institution data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      const response = await axios.get(`${API_URL}/certificate/institution`, {
        headers: getAuthHeader()
      });
      setCertificates(response.data);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError('Failed to fetch certificates');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/template`, {
        headers: getAuthHeader()
      });
      setTemplates(response.data);
      if (response.data.length > 0) {
        setSelectedTemplate(response.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err.response?.data?.message || 'Failed to fetch templates');
    }
  };

  const handleUpdateInfo = async () => {
    try {
      await axios.put(`${API_URL}/institution/profile`, {
        name: formData.name,
        description: formData.description
      }, {
        headers: getAuthHeader()
      });
      setOpenUpdateDialog(false);
      fetchInstitutionData();
    } catch (err) {
      console.error('Error updating institution info:', err);
      setError(err.response?.data?.message || 'Failed to update institution info');
    }
  };

  const handleIssueCertificate = async () => {
    try {
      if (!selectedTemplate) {
        setError('Please select a template');
        return;
      }

      // Validate required fields
      if (!formData.studentName || !formData.course || !formData.date || !formData.studentEmail) {
        setError('Please fill in all required fields');
        return;
      }

      const certificateData = {
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        course: formData.course,
        date: formData.date, // Send the date as is
        templateId: selectedTemplate
      };

      console.log('Sending certificate data:', certificateData);

      const response = await axios.post(`${API_URL}/certificate/`, certificateData, {
        headers: getAuthHeader()
      });

      // Clear form data
      setFormData({
        name: institution?.name || '',
        description: institution?.description || '',
        studentName: '',
        course: '',
        date: '',
        studentEmail: ''
      });
      setSelectedTemplate(templates[0]?._id || '');

      setOpenCertificateDialog(false);
      fetchCertificates();
      alert(`Certificate Issued Successfully! Certificate ID: ${response.data.certificate.certificateId}`);
    } catch (err) {
      console.error('Error issuing certificate:', err);
      setError(err.response?.data?.message || 'Failed to issue certificate');
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Institution Info Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Institution Information
            </Typography>
            <Typography variant="body1" gutterBottom>
              Name: {institution?.name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Description: {institution?.description}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Status: {institution?.status}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Certificates Issued: {certificates.length}
            </Typography>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setOpenUpdateDialog(true)}
              sx={{ mt: 2 }}
            >
              Update Info
            </Button>
          </Paper>
        </Grid>

        {/* Quick Actions Card */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 240 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCertificateDialog(true)}
                >
                  Issue New Certificate
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleNavigate('/templates')}
                >
                  Manage Templates
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Certificates Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Certificate History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Certificate ID</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Date Issued</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {certificates.map((certificate) => (
                    <TableRow key={certificate._id}>
                      <TableCell>{certificate.certificateId}</TableCell>
                      <TableCell>{certificate.studentName}</TableCell>
                      <TableCell>{certificate.course}</TableCell>
                      <TableCell>{new Date(certificate.date).toLocaleDateString()}</TableCell>
                      <TableCell>{certificate.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Update Info Dialog */}
      <Dialog open={openUpdateDialog} onClose={() => setOpenUpdateDialog(false)}>
        <DialogTitle>Update Institution Information</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Institution Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpdateDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateInfo} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue Certificate Dialog */}
      <Dialog open={openCertificateDialog} onClose={() => setOpenCertificateDialog(false)}>
        <DialogTitle>Issue New Certificate</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Student Name"
            value={formData.studentName}
            onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
            margin="normal"
            required
            error={!formData.studentName}
            helperText={!formData.studentName ? 'Student name is required' : ''}
          />
          <TextField
            fullWidth
            label="Course"
            value={formData.course}
            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
            margin="normal"
            required
            error={!formData.course}
            helperText={!formData.course ? 'Course is required' : ''}
          />
          <TextField
            fullWidth
            type="date"
            label="Date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
            error={!formData.date}
            helperText={!formData.date ? 'Date is required' : ''}
          />
          <TextField
            fullWidth
            label="Student Email"
            value={formData.studentEmail}
            onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
            margin="normal"
            required
            error={!formData.studentEmail}
            helperText={!formData.studentEmail ? 'Student email is required' : ''}
          />
          <TextField
            fullWidth
            select
            label="Certificate Template"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            margin="normal"
            required
            error={!selectedTemplate}
            helperText={!selectedTemplate ? 'Template selection is required' : ''}
          >
            {templates.map((template) => (
              <MenuItem key={template._id} value={template._id}>
                {template.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCertificateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleIssueCertificate} 
            variant="contained"
            disabled={!formData.studentName || !formData.course || !formData.date || !formData.studentEmail || !selectedTemplate}
          >
            Issue Certificate
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InstitutionDashboard; 