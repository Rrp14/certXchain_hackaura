import jwt from 'jsonwebtoken';
import Institution from '../models/Institution.js';

export const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Auth middleware - Token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Decoded token:', decoded);

    const institution = await Institution.findById(decoded.id)
      .select('+blockchainPrivateKey +blockchainAddress');
    if (!institution) {
      console.log('Auth middleware - Institution not found');
      return res.status(401).json({ message: 'Institution not found' });
    }

    if (institution.status !== 'approved') {
      console.log('Auth middleware - Institution not approved');
      return res.status(403).json({ message: 'Institution not approved' });
    }

    console.log('Auth middleware - Setting institution:', institution._id);
    req.institution = institution;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Authentication failed' });
  }
};