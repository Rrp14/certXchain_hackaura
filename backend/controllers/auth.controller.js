import jwt from 'jsonwebtoken';
import Institution from '../models/institution.model.js';
import Admin from '../models/admin.model.js';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/emailUtils.js';
import crypto from 'crypto';

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password, description } = req.body;

    // Check if institution already exists
    const existingInstitution = await Institution.findOne({ email });
    if (existingInstitution) {
      return res.status(400).json({ message: 'Institution already exists' });
    }

    // Create new institution
    const institution = new Institution({
      name,
      email,
      password,
      description,
      status: 'pending'
    });

    await institution.save();

    res.status(201).json({ message: 'Institution registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user is admin
    if (email === 'admin@certxchain.com') {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: admin._id, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return res.json({
        token,
        user: {
          id: admin._id,
          email: admin.email,
          role: 'admin'
        }
      });
    }

    // Check if institution exists
    const institution = await Institution.findOne({ email });
    if (!institution) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if institution is approved
    if (institution.status !== 'approved') {
      return res.status(400).json({ message: 'Your account is pending approval' });
    }

    // Verify password
    const isMatch = await institution.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: institution._id, role: 'institution' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: institution._id,
        name: institution.name,
        email: institution.email,
        role: 'institution'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find institution with valid reset token
    const institution = await Institution.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!institution) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    institution.password = await bcrypt.hash(password, salt);
    institution.resetToken = undefined;
    institution.resetTokenExpiry = undefined;
    await institution.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the institution
    const institution = await Institution.findOne({ email });
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save reset token to institution
    institution.resetToken = resetToken;
    institution.resetTokenExpiry = resetTokenExpiry;
    await institution.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/institution/reset-password/${resetToken}`;

    // Send email
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset</p>
        <p>Click this <a href="${resetUrl}">link</a> to set a new password.</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error sending reset email' });
  }
}; 