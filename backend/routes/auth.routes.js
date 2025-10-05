import express from 'express';
import { register, login, resetPassword, forgotPassword } from '../controllers/auth.controller.js';
import { validateRegistration, validateLogin } from '../middleware/validation.middleware.js';
import jwt from 'jsonwebtoken';
import Institution from '../models/institution.model.js';
import Admin from '../models/admin.model.js';
import { adminAuth } from '../middleware/auth.middleware.js';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import { auth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Auth routes
router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);

// Password reset routes
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('Please enter a valid email address')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  forgotPassword
);

router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  resetPassword
);

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Forgot password
router.post('/forgot-password',
  [
    body('email').isEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const institution = await Institution.findOne({ email });

      if (!institution) {
        return res.status(404).json({ message: 'Institution not found' });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { id: institution._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Send reset email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
        `
      });

      res.json({ message: 'Password reset email sent' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Reset password
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, newPassword } = req.body;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const institution = await Institution.findById(decoded.id);

      if (!institution) {
        return res.status(404).json({ message: 'Institution not found' });
      }

      // Update password
      institution.password = newPassword;
      await institution.save();

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

export default router; 