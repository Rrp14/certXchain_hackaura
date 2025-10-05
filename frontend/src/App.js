import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import VerifyCertificate from './pages/VerifyCertificate';
import CertificateView from './components/CertificateView';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

// Pages
import InstitutionLogin from './pages/InstitutionLogin';
import InstitutionRegister from './pages/InstitutionRegister';
import InstitutionDashboard from './pages/InstitutionDashboard';
import InstitutionResetPassword from './pages/InstitutionResetPassword';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import UserLogin from './pages/UserLogin';
import UserDashboard from './pages/UserDashboard';
import TemplateManagement from './pages/TemplateManagement';

// Protected Route Component for Firebase Auth (Users)
const FirebaseProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/user/login" />;
  }

  return children;
};

// Protected Route Component for JWT Auth (Institutions and Admin)
const JWTProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token || !userType) {
    // Redirect to appropriate login page based on the route
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      return <Navigate to="/admin/login" />;
    }
    return <Navigate to="/institution/login" />;
  }

  if (!allowedRoles.includes(userType)) {
    // If trying to access admin routes but not an admin
    if (window.location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" />;
    }
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="app">
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/institution/login" element={<InstitutionLogin />} />
              <Route path="/institution/register" element={<InstitutionRegister />} />
              <Route path="/institution/reset-password/:token" element={<InstitutionResetPassword />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/user/login" element={<UserLogin />} />
              <Route path="/verify" element={<VerifyCertificate />} />
              <Route path="/verify/:id" element={<VerifyCertificate />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes - JWT Auth */}
              <Route
                path="/institution/dashboard"
                element={
                  <JWTProtectedRoute allowedRoles={['institution']}>
                    <InstitutionDashboard />
                  </JWTProtectedRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <JWTProtectedRoute allowedRoles={['institution']}>
                    <TemplateManagement />
                  </JWTProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <JWTProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </JWTProtectedRoute>
                }
              />

              {/* Protected Routes - Firebase Auth */}
              <Route
                path="/user/dashboard"
                element={
                  <FirebaseProtectedRoute>
                    <UserDashboard />
                  </FirebaseProtectedRoute>
                }
              />

              {/* Additional Routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/certificate/:id" element={<CertificateView />} />

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;
