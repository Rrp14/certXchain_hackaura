import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { Print as PrintIcon, Verified as VerifiedIcon } from '@mui/icons-material';

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

const VerifyCertificate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_URL}/certificate/verify/${id}`);
        setCertificate(response.data.certificate);
      } catch (err) {
        console.error('Verification error:', err);
        setError(err.response?.data?.message || 'Failed to verify certificate');
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [id]);

  const handlePrint = () => {
    window.print();
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <>
      <style>{printStyles}</style>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 2 }} className="no-print">
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print Certificate
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', mb: 4 }} className="no-print">
                <VerifiedIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                  Certificate Verified
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  This certificate has been verified and is authentic
                </Typography>
              </Box>
            </Grid>

            {certificate && (
              <Grid item xs={12}>
                <Box sx={{ 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2, 
                  p: 4,
                  background: '#fff',
                  position: 'relative',
                  minHeight: '500px'
                }} className="certificate-container">
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
              </Grid>
            )}
          </Grid>
        </Paper>
      </Container>
    </>
  );
};

export default VerifyCertificate; 