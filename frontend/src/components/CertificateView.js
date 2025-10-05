import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import axios from 'axios';
import { retrieveFromIPFS } from '../utils/ipfsUtils';

const CertificateView = () => {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/certificates/verify/${certificateId}`
        );
        setCertificate(response.data.certificate);

        if (response.data.certificate.ipfsHash) {
          const ipfsData = await retrieveFromIPFS(response.data.certificate.ipfsHash);
          setHtmlContent(ipfsData.htmlContent);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch certificate');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  const handleDownload = () => {
    // TODO: Implement PDF download
    console.log('Download functionality to be implemented');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Certificate Details
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download PDF
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="text.secondary">
            Certificate ID: {certificate.certificateId}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Status: {certificate.isValid ? 'Valid' : 'Revoked'}
          </Typography>
        </Box>

        {htmlContent ? (
          <Box
            sx={{
              border: '1px solid #ddd',
              borderRadius: 1,
              p: 3,
              bgcolor: 'background.paper'
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </Box>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5">Certificate Preview</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Student Name: {certificate.studentName}
            </Typography>
            <Typography variant="body1">
              Course: {certificate.course}
            </Typography>
            <Typography variant="body1">
              Issue Date: {new Date(certificate.issueDate).toLocaleDateString()}
            </Typography>
            {certificate.customFields && Object.entries(certificate.customFields).map(([key, value]) => (
              <Typography key={key} variant="body1">
                {key}: {value}
              </Typography>
            ))}
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Issued by: {certificate.institution?.name}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Blockchain Transaction: {certificate.blockchainTxHash}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            IPFS Hash: {certificate.ipfsHash}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CertificateView; 