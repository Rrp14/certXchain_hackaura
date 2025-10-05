const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    if (verified.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token verification failed, authorization denied' });
  }
}; 