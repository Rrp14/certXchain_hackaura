import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, signOut } from '../firebase';
import axios from 'axios';
import { Download as DownloadIcon, Verified as VerifiedIcon, Print as PrintIcon } from '@mui/icons-material';

// Hardcoded API URL for now
const API_URL = 'http://localhost:5000/api';

// Add print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .certificate-container, .certificate-container * {
      visibility: visible;
    }
    .certificate-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
  }
`;

const UserDashboard = () => {
  const [certificateId, setCertificateId] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        navigate('/user/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleVerify = async () => {
    if (!certificateId) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError('');
    setCertificate(null);

    try {
      console.log('Verifying certificate with API URL:', API_URL);
      const response = await axios.get(`${API_URL}/certificate/verify/${certificateId}`);
      console.log('Verification response:', response.data);
      setCertificate(response.data.certificate);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Failed to verify certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!certificate?.certificateId) {
      setError('Certificate ID not available');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Downloading certificate:', certificate.certificateId);
      
      const response = await axios.get(
        `${API_URL}/certificate/download/${certificate.certificateId}`,
        { 
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificate.certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      if (err.response) {
        setError(`Download failed: ${err.response.data?.message || err.response.status}`);
      } else if (err.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError('Failed to download certificate: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/user/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Helper function to get image URL
  const getImageUrl = (path) => {
    if (!path) {
      console.log('No path provided for image');
      return '';
    }
    console.log('Getting image URL for path:', path);

    // If it's a data URL (for signatures), return as is
    if (path.startsWith('data:')) {
      console.log('Path is a data URL');
      return path;
    }

    // If the path already includes the API URL, return as is
    if (path.startsWith('http')) {
      console.log('Path is a full URL');
      return path;
    }

    // For uploaded files, try both uploads directories
    const baseUrl = API_URL.replace('/api', '');
    const possiblePaths = [
      `${baseUrl}/uploads/${path}`,
      `${baseUrl}/uploads/templates/${path}`
    ];

    console.log('Trying possible image URLs:', possiblePaths);
    return possiblePaths[0]; // Return the first path, the browser will try to load it
  };

  const handlePrint = () => {
    window.print();
  };

  if (!user) {
    return <CircularProgress />;
  }

  return (
    <>
      <style>{printStyles}</style>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4">
                Welcome, {user.email}
              </Typography>
              <Button variant="outlined" color="primary" onClick={handleLogout}>
                Logout
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Verify Certificate
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Certificate ID"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="Enter certificate ID"
                />
                <Button
                  variant="contained"
                  onClick={handleVerify}
                  disabled={loading}
                >
                  Verify
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {loading && (
                <Box display="flex" justifyContent="center" my={4}>
                  <CircularProgress />
                </Box>
              )}

              {certificate && (
                <Box sx={{ mt: 4 }} className="certificate-container">
                  <Box sx={{ textAlign: 'center', mb: 4 }} className="no-print">
                    <VerifiedIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h4" gutterBottom>
                      Certificate Verified
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      This certificate has been verified and is authentic
                    </Typography>
                  </Box>

                  <Box sx={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: 2, 
                    p: 4,
                    background: '#fff',
                    position: 'relative',
                    minHeight: '500px'
                  }}>
                    {/* Certificate Content */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      {certificate.institutionLogo && (
                        <img 
                          src={getImageUrl(certificate.institutionLogo)}
                          alt="Institution Logo" 
                          style={{ maxHeight: '80px', marginBottom: '20px' }}
                        />
                      )}
                      <Typography variant="h5" sx={{ mb: 2, color: '#2c3e50' }}>
                        {certificate.institution}
                      </Typography>
                      <Typography variant="h4" sx={{ mb: 4, color: '#2c3e50' }}>
                        Certificate of Completion
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        This is to certify that
                      </Typography>
                      <Typography variant="h3" sx={{ mb: 3, color: '#34495e' }}>
                        {certificate.studentName}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        has successfully completed the course
                      </Typography>
                      <Typography variant="h5" sx={{ mb: 3, color: '#7f8c8d' }}>
                        {certificate.course}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        Issued on: {new Date(certificate.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#95a5a6' }}>
                        Certificate ID: {certificate.certificateId}
                      </Typography>
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      mt: 6,
                      pt: 4,
                      borderTop: '1px solid #eee'
                    }}>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        {certificate.authorizedSignature && (
                          <img 
                            src={getImageUrl(certificate.authorizedSignature)}
                            alt="Authorized Signature" 
                            style={{ maxHeight: '60px', marginBottom: '10px' }}
                          />
                        )}
                        <Typography variant="body2">Authorized Signature</Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: 'center' }}>
                        {certificate.seal && (
                          <img 
                            src={getImageUrl(certificate.seal)}
                            alt="Official Seal" 
                            style={{ maxHeight: '80px' }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }} className="no-print">
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<PrintIcon />}
                      onClick={handlePrint}
                    >
                      Print Certificate
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default UserDashboard; 