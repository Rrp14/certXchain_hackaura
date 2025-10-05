import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';

const CertificateVerification = () => {
  const [certificateId, setCertificateId] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!certificateId) {
      setError('Please enter a certificate ID');
      return;
    }

    setLoading(true);
    setError('');
    setCertificate(null);

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/certificates/verify/${certificateId}`);
      setCertificate(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Verify Certificate
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Enter your certificate ID to verify its authenticity
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                label="Certificate ID"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                placeholder="Enter your certificate ID"
              />
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
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
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Certificate Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Student Name
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {certificate.studentName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Course
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {certificate.course}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Date Issued
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {new Date(certificate.date).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Issuing Institution
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {certificate.institution.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Certificate ID
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {certificate.certificateId}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="success">
                        This certificate has been verified and is authentic
                      </Alert>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CertificateVerification; 