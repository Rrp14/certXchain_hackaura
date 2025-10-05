import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Link
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [certificates, setCertificates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    templateId: '',
    studentName: '',
    course: '',
    issueDate: new Date().toISOString().split('T')[0],
    customFields: {}
  });

  useEffect(() => {
    fetchCertificates();
    fetchTemplates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/certificates/institution`);
      setCertificates(response.data);
    } catch (err) {
      setError('Failed to fetch certificates');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/templates`);
      setTemplates(response.data);
    } catch (err) {
      setError('Failed to fetch templates');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData({
      ...formData,
      customFields: {
        ...formData.customFields,
        [fieldName]: value
      }
    });
  };

  const handleTemplateChange = (e) => {
    const templateId = e.target.value;
    const template = templates.find(t => t._id === templateId);
    setFormData({
      ...formData,
      templateId,
      customFields: {}
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/certificates`, formData);
      setOpenDialog(false);
      fetchCertificates();
      setFormData({
        templateId: '',
        studentName: '',
        course: '',
        issueDate: new Date().toISOString().split('T')[0],
        customFields: {}
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to issue certificate');
    }
  };

  const handleRevoke = async (certificateId) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/certificates/${certificateId}/revoke`);
      fetchCertificates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke certificate');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const selectedTemplate = templates.find(t => t._id === formData.templateId);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h1" variant="h4">
                Institution Dashboard
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/templates')}
                  sx={{ mr: 2 }}
                >
                  Manage Templates
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenDialog(true)}
                >
                  <AddIcon sx={{ mr: 1 }} />
                  Issue Certificate
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Certificate ID</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Issue Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert._id}>
                      <TableCell>{cert.certificateId}</TableCell>
                      <TableCell>{cert.studentName}</TableCell>
                      <TableCell>{cert.course}</TableCell>
                      <TableCell>{new Date(cert.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{cert.isValid ? 'Valid' : 'Revoked'}</TableCell>
                      <TableCell>
                        {cert.isValid && (
                          <IconButton
                            color="error"
                            onClick={() => handleRevoke(cert._id)}
                          >
                            <DeleteIcon />
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Issue New Certificate</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  name="templateId"
                  value={formData.templateId}
                  onChange={handleTemplateChange}
                  label="Template"
                >
                  {templates.map((template) => (
                    <MenuItem key={template._id} value={template._id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Student Name"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Course"
                name="course"
                value={formData.course}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Issue Date"
                name="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {selectedTemplate?.fields.map((field) => (
              <Grid item xs={12} sm={6} key={field.name}>
                <TextField
                  required={field.required}
                  fullWidth
                  label={field.name}
                  type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                  value={formData.customFields[field.name] || ''}
                  onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                  InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Issue Certificate
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard; 