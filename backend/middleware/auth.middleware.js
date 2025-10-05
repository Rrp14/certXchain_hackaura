import jwt from 'jsonwebtoken';
import Institution from '../models/institution.model.js';
import Admin from '../models/admin.model.js';

export const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    console.log('Auth middleware - Token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);
    
    // Check if user is an admin
    const admin = await Admin.findById(decoded.id);
    if (admin) {
      console.log('Auth middleware - Admin found');
      req.user = admin;
      req.userType = 'admin';
      return next();
    }

    // Check if user is an institution
    const institution = await Institution.findById(decoded.id);
    if (institution) {
      console.log('Auth middleware - Institution found');
      req.user = institution;
      req.userType = 'institution';
      return next();
    }

    console.log('Auth middleware - No user found');
    throw new Error('User not found');
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Authentication failed' });
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    console.log('Admin auth - Headers:', req.headers);
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Admin auth - No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    console.log('Admin auth - Token:', token);
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Admin auth - Decoded token:', decoded);
    
    // Find admin in database first
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      console.log('Admin auth - Admin not found in database');
      return res.status(401).json({ message: 'Admin not found' });
    }

    // Add admin to request object
    req.user = admin;
    req.userType = 'admin';
    
    console.log('Admin auth - Authentication successful');
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Authentication failed' });
  }
}; 