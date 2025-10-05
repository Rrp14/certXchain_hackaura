import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { School as SchoolIcon, AdminPanelSettings as AdminIcon, Person as UserIcon } from '@mui/icons-material';

const Home = () => {
  const navigate = useNavigate();

  const options = [
    {
      title: 'Institution Login',
      description: 'Access your institution dashboard to issue and manage certificates',
      icon: <SchoolIcon sx={{ fontSize: 60 }} />,
      path: '/institution/login',
      color: '#1976d2'
    },
    {
      title: 'Admin Login',
      description: 'Access the admin dashboard to manage institutions and system settings',
      icon: <AdminIcon sx={{ fontSize: 60 }} />,
      path: '/admin/login',
      color: '#2e7d32'
    },
    {
      title: 'User Portal',
      description: 'Verify certificates and manage your account',
      icon: <UserIcon sx={{ fontSize: 60 }} />,
      path: '/user/login',
      color: '#ed6c02'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to CertXChain
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Blockchain-based Certificate Management System
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {options.map((option) => (
          <Grid item xs={12} sm={6} md={4} key={option.title}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ color: option.color, mb: 2 }}>
                  {option.icon}
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {option.title}
                </Typography>
                <Typography color="text.secondary">
                  {option.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => navigate(option.path)}
                  sx={{ 
                    bgcolor: option.color,
                    '&:hover': {
                      bgcolor: option.color,
                      opacity: 0.9
                    }
                  }}
                >
                  Enter
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home; 