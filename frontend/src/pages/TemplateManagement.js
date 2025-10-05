import React, { useState, useEffect, useRef } from 'react';
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
  Card,
  CardMedia,
  CardActions,
  Divider
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Draw as DrawIcon, Preview as PreviewIcon } from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Predefined template styles
const TEMPLATE_STYLES = {
  classic: {
    name: 'Classic',
    description: 'Traditional certificate design with elegant borders and typography',
    preview: {
      border: '2px solid #8B4513',
      backgroundColor: '#FFF8DC',
      fontFamily: 'serif',
      padding: '20px',
      textAlign: 'center'
    }
  },
  modern: {
    name: 'Modern',
    description: 'Clean and contemporary design with minimalist elements',
    preview: {
      border: '1px solid #333',
      backgroundColor: '#fff',
      fontFamily: 'sans-serif',
      padding: '30px',
      textAlign: 'left'
    }
  },
  minimal: {
    name: 'Minimal',
    description: 'Simple and clean design with focus on content',
    preview: {
      border: '1px solid #ddd',
      backgroundColor: '#fff',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      textAlign: 'center'
    }
  },
  default: {
    name: 'Default',
    description: 'Standard certificate layout with balanced design',
    preview: {
      border: '2px solid #000',
      backgroundColor: '#fff',
      fontFamily: 'Arial, sans-serif',
      padding: '25px',
      textAlign: 'center'
    }
  }
};

// File validation constants
const ALLOWED_FILE_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'image/jpg': true
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const TemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [],
    layout: 'classic',
    institutionLogo: '',
    authorizedSignature: '',
    seal: ''
  });
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const signatureRef = useRef(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      Authorization: `Bearer ${token}`
    };
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/template`, {
        headers: getAuthHeader()
      });
      setTemplates(response.data);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err.response?.data?.message || 'Failed to fetch templates');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateFile = (file) => {
    if (!file) {
      throw new Error('No file selected');
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES[file.type]) {
      throw new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    return true;
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      validateFile(file);

      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', {
        type,
        fileName: file.name,
        fileType: file.type
      });

      const response = await axios.post(
        `${API_URL}/template/upload`,
        formData,
        {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Upload response:', response.data);

      if (response.data && response.data.path) {
        setFormData(prev => ({
          ...prev,
          [type]: response.data.path
        }));
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      setError(err.message || `Failed to upload ${type}`);
    }
  };

  const handleSignatureSave = () => {
    if (signatureRef.current) {
      const signatureData = signatureRef.current.toDataURL();
      setFormData(prev => ({
        ...prev,
        authorizedSignature: signatureData
      }));
      setShowSignaturePad(false);
    }
  };

  const handleSignatureClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleAddField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { name: '', type: 'text', required: true }]
    });
  };

  const handleFieldChange = (index, field, value) => {
    const newFields = [...formData.fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setFormData({
      ...formData,
      fields: newFields
    });
  };

  const handleRemoveField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      fields: newFields
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting template with form data:', formData);
      
      // Validate required fields
      if (!formData.name) {
        throw new Error('Template name is required');
      }

      // Prepare template data
      const templateData = {
        name: formData.name,
        description: formData.description || '',
        fields: formData.fields || [],
        layout: formData.layout || 'classic',
        institutionLogo: formData.institutionLogo || '',
        authorizedSignature: formData.authorizedSignature || '',
        seal: formData.seal || ''
      };

      console.log('Sending template data to server:', templateData);
      console.log('Auth header:', getAuthHeader());

      const response = await axios.post(
        `${API_URL}/template`,
        templateData,
        {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Server response:', response.data);
      setOpenDialog(false);
      fetchTemplates();
      resetForm();
    } catch (err) {
      console.error('Error saving template:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save template';
      setError(errorMessage);
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData(template);
    setOpenDialog(true);
  };

  const handleDelete = async (templateId) => {
    try {
      await axios.delete(`${API_URL}/template/${templateId}`, {
        headers: getAuthHeader()
      });
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      if (err.response?.status === 403) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err.response?.data?.message || 'Failed to delete template');
      }
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      description: '',
      fields: [],
      layout: 'classic',
      institutionLogo: '',
      authorizedSignature: '',
      seal: ''
    });
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    // If it's a data URL (for signatures), return as is
    if (path.startsWith('data:')) return path;
    // If the path already includes the API URL, return as is
    if (path.startsWith('http')) return path;
    // For uploaded files, use the uploads directory
    return `${API_URL.replace('/api', '')}/uploads/${path}`;
  };

  const renderPreview = () => {
    const style = TEMPLATE_STYLES[formData.layout].preview;
    return (
      <Box sx={{ 
        ...style,
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
        minHeight: '400px'
      }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          {formData.institutionLogo && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <img 
                src={getImageUrl(formData.institutionLogo)} 
                alt="Institution Logo" 
                style={{ maxHeight: '100px' }}
                onError={(e) => {
                  console.error('Error loading logo:', {
                    src: e.target.src,
                    path: formData.institutionLogo,
                    error: e
                  });
                  e.target.style.display = 'none';
                }}
              />
            </Box>
          )}
          <Typography variant="h4" gutterBottom>
            Certificate of Achievement
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" paragraph>
            This is to certify that
          </Typography>
          <Typography variant="h5" sx={{ mb: 2, color: '#2C3E50' }}>
            [Student Name]
          </Typography>
          <Typography variant="body1" paragraph>
            has successfully completed the course
          </Typography>
          <Typography variant="h6" sx={{ mb: 2, color: '#2C3E50' }}>
            [Course Name]
          </Typography>
          <Typography variant="body1" paragraph>
            on [Date]
          </Typography>
        </Box>

        {/* Footer */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          mt: 4
        }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            {formData.authorizedSignature && (
              <img 
                src={getImageUrl(formData.authorizedSignature)} 
                alt="Signature" 
                style={{ maxHeight: '80px', marginBottom: '10px' }}
                onError={(e) => {
                  console.error('Error loading signature:', {
                    src: e.target.src,
                    path: formData.authorizedSignature,
                    error: e
                  });
                  e.target.style.display = 'none';
                }}
              />
            )}
            <Typography variant="body2">
              Authorized Signature
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            {formData.seal && (
              <img 
                src={getImageUrl(formData.seal)} 
                alt="Seal" 
                style={{ maxHeight: '100px' }}
                onError={(e) => {
                  console.error('Error loading seal:', {
                    src: e.target.src,
                    path: formData.seal,
                    error: e
                  });
                  e.target.style.display = 'none';
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h1" variant="h4">
                Certificate Templates
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  resetForm();
                  setOpenDialog(true);
                }}
              >
                <AddIcon sx={{ mr: 1 }} />
                Create Template
              </Button>
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
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Fields</TableCell>
                    <TableCell>Layout</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template._id}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>{template.description}</TableCell>
                      <TableCell>{template.fields.length}</TableCell>
                      <TableCell>{template.layout}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(template)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(template._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate ? 'Edit Template' : 'Create Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Left side - Form */}
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Template Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={2}
                value={formData.description}
                onChange={handleChange}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Layout Style</InputLabel>
                <Select
                  name="layout"
                  value={formData.layout}
                  onChange={handleChange}
                  label="Layout Style"
                >
                  {Object.entries(TEMPLATE_STYLES).map(([key, style]) => (
                    <MenuItem key={key} value={key}>
                      {style.name} - {style.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Institution Logo */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Institution Logo
                </Typography>
                <Card sx={{ maxWidth: 200, mb: 2 }}>
                  {formData.institutionLogo && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={formData.institutionLogo}
                      alt="Institution Logo"
                    />
                  )}
                  <CardActions>
                    <input
                      accept="image/jpeg,image/png,image/gif,image/jpg"
                      type="file"
                      id="logo-upload"
                      hidden
                      onChange={(e) => handleFileUpload(e, 'institutionLogo')}
                    />
                    <label htmlFor="logo-upload">
                      <Button component="span" size="small">
                        Upload Logo
                      </Button>
                    </label>
                  </CardActions>
                </Card>
              </Box>

              {/* Authorized Signature */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Authorized Signature
                </Typography>
                <Card sx={{ maxWidth: 200, mb: 2 }}>
                  {formData.authorizedSignature && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={formData.authorizedSignature}
                      alt="Authorized Signature"
                    />
                  )}
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<DrawIcon />}
                      onClick={() => setShowSignaturePad(true)}
                    >
                      Draw Signature
                    </Button>
                    <input
                      accept="image/*"
                      type="file"
                      id="signature-upload"
                      hidden
                      onChange={(e) => handleFileUpload(e, 'authorizedSignature')}
                    />
                    <label htmlFor="signature-upload">
                      <Button component="span" size="small">
                        Upload Signature
                      </Button>
                    </label>
                  </CardActions>
                </Card>
              </Box>

              {/* Seal */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Seal
                </Typography>
                <Card sx={{ maxWidth: 200, mb: 2 }}>
                  {formData.seal && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={formData.seal}
                      alt="Seal"
                    />
                  )}
                  <CardActions>
                    <input
                      accept="image/*"
                      type="file"
                      id="seal-upload"
                      hidden
                      onChange={(e) => handleFileUpload(e, 'seal')}
                    />
                    <label htmlFor="seal-upload">
                      <Button component="span" size="small">
                        Upload Seal
                      </Button>
                    </label>
                  </CardActions>
                </Card>
              </Box>
            </Grid>

            {/* Right side - Preview */}
            <Grid item xs={12} md={6}>
              <Box sx={{ position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom>
                  Live Preview
                </Typography>
                {renderPreview()}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Signature Pad Dialog */}
      <Dialog
        open={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Draw Signature</DialogTitle>
        <DialogContent>
          <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2 }}>
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                width: 500,
                height: 200,
                className: 'signature-canvas'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSignatureClear}>Clear</Button>
          <Button onClick={() => setShowSignaturePad(false)}>Cancel</Button>
          <Button onClick={handleSignatureSave} variant="contained">
            Save Signature
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TemplateManagement; 