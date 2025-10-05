import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If user is an admin trying to access institution routes
  if (userType === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute; 