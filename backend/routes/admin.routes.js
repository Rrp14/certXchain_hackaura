import express from 'express';
import { adminAuth } from '../middleware/auth.middleware.js';
import Institution from '../models/institution.model.js';
import { body, validationResult } from 'express-validator';
import Web3 from 'web3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin.model.js';
import CertificateRegistry from '../../blockchain/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json' assert { type: "json" };

const router = express.Router();

// Initialize Web3
const web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545');

// Initialize contract
const contract = new web3.eth.Contract(
  CertificateRegistry.abi,
  process.env.CONTRACT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
);

// Setup admin account (only works if no admin exists)
router.post('/setup', async (req, res) => {
  try {
    // Check if any admin exists
    const adminExists = await Admin.findOne();
    if (adminExists) {
      return res.status(400).json({ message: 'Admin account already exists' });
    }

    const { email, password } = req.body;

    // Validate email
    if (email !== 'admin@certxchain.com') {
      return res.status(400).json({ message: 'Invalid admin email' });
    }

    // Create admin account
    const admin = new Admin({
      email,
      password,
      name: 'System Admin'
    });

    await admin.save();

    res.status(201).json({ message: 'Admin account created successfully' });
  } catch (error) {
    console.error('Admin setup error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin login
router.post('/login', async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body);
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });
    console.log('Admin found:', admin ? 'Yes' : 'No');
    
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id,
        email: admin.email,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    res.json({
      token,
      user: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get pending institutions
router.get('/pending-institutions', adminAuth, async (req, res) => {
  try {
    const institutions = await Institution.find({ status: 'pending' })
      .select('-password');
    res.json(institutions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve institution
router.post('/institutions/:id/approve', adminAuth, async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);
    
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    // Get the deployer account (admin's blockchain account)
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];

    // Authorize the institution on the blockchain
    console.log('Authorizing institution on blockchain:', institution.name);
    const tx = await contract.methods.authorizeInstitution(deployer).send({
      from: deployer,
      gas: 5000000
    });

    // Update institution status in database
    institution.status = 'approved';
    await institution.save();

    res.json({ 
      message: 'Institution approved and authorized on blockchain successfully',
      transactionHash: tx.transactionHash
    });
  } catch (error) {
    console.error('Error approving institution:', error);
    res.status(500).json({ 
      message: 'Failed to approve institution',
      error: error.message 
    });
  }
});

// Revoke institution
router.post('/institutions/:id/revoke', adminAuth, async (req, res) => {
  try {
    console.log('Revoking institution:', req.params.id);
    
    const institution = await Institution.findById(req.params.id);
    
    if (!institution) {
      console.log('Institution not found:', req.params.id);
      return res.status(404).json({ message: 'Institution not found' });
    }

    // Get the deployer account (admin's blockchain account)
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];

    // Revoke the institution on the blockchain
    console.log('Revoking institution on blockchain:', institution.name);
    const tx = await contract.methods.revokeInstitution(deployer).send({
      from: deployer,
      gas: 5000000
    });

    // Update institution status in database
    console.log('Current institution status:', institution.status);
    institution.status = 'revoked';
    await institution.save();
    console.log('Institution revoked successfully');

    res.json({ 
      message: 'Institution revoked successfully',
      transactionHash: tx.transactionHash,
      institution: {
        id: institution._id,
        name: institution.name,
        email: institution.email,
        status: institution.status
      }
    });
  } catch (error) {
    console.error('Error revoking institution:', error);
    res.status(500).json({ 
      message: 'Failed to revoke institution',
      error: error.message 
    });
  }
});

// Reject institution
router.post('/institutions/:id/reject', adminAuth, async (req, res) => {
  try {
    const institution = await Institution.findById(req.params.id);
    
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    institution.status = 'rejected';
    await institution.save();

    res.json({ message: 'Institution rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all institutions
router.get('/institutions', adminAuth, async (req, res) => {
  try {
    const institutions = await Institution.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(institutions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change admin password
router.put('/password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user.id);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 