import express from 'express';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Institution from '../models/Institution.js';
import Template from '../models/template.model.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  uploadDocuments,
  updateBlockchainAddress
} from '../controllers/institution.controller.js';

const router = express.Router();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the existing uploads directory
const uploadsDir = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../uploads');
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Configure multer for document upload
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify', auth, async (req, res) => {
  try {
    const institution = await Institution.findById(req.institution._id)
      .select('-password');
    
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    res.json({
      status: institution.status,
      institution: {
        id: institution._id,
        name: institution.name,
        email: institution.email
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Failed to verify institution' });
  }
});

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/documents', auth, documentUpload.array('documents', 5), uploadDocuments);
router.put('/blockchain-address', auth, updateBlockchainAddress);

// Upload logo
router.post('/upload/logo', auth, upload.single('logo'), async (req, res) => {
  try {
    console.log('Upload logo - Request:', {
      file: req.file,
      user: req.user,
      userType: req.userType
    });

    if (!req.file) {
      console.log('Upload logo - No file provided');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Only allow institution uploads
    if (req.userType !== 'institution') {
      console.log('Upload logo - Admin not allowed to upload');
      return res.status(403).json({ message: 'Only institutions can upload logos' });
    }

    const institution = await Institution.findById(req.user._id);
    if (!institution) {
      console.log('Upload logo - Institution not found');
      return res.status(404).json({ message: 'Institution not found' });
    }

    // Save the relative path
    const relativePath = `uploads/${req.file.filename}`;
    console.log('Upload logo - Saving path:', relativePath);
    
    institution.logo = relativePath;
    await institution.save();
    
    console.log('Upload logo - Success');
    res.json({ message: 'Logo uploaded successfully', path: relativePath });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ message: 'Error uploading logo', error: error.message });
  }
});

// Upload seal
router.post('/upload/seal', auth, upload.single('seal'), async (req, res) => {
  try {
    console.log('Upload seal - Request:', {
      file: req.file,
      user: req.user,
      userType: req.userType
    });

    if (!req.file) {
      console.log('Upload seal - No file provided');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Only allow institution uploads
    if (req.userType !== 'institution') {
      console.log('Upload seal - Admin not allowed to upload');
      return res.status(403).json({ message: 'Only institutions can upload seals' });
    }

    const institution = await Institution.findById(req.user._id);
    if (!institution) {
      console.log('Upload seal - Institution not found');
      return res.status(404).json({ message: 'Institution not found' });
    }

    // Save the relative path
    const relativePath = `uploads/${req.file.filename}`;
    console.log('Upload seal - Saving path:', relativePath);
    
    institution.seal = relativePath;
    await institution.save();
    
    console.log('Upload seal - Success');
    res.json({ message: 'Seal uploaded successfully', path: relativePath });
  } catch (error) {
    console.error('Upload seal error:', error);
    res.status(500).json({ message: 'Error uploading seal', error: error.message });
  }
});

// Template routes
router.post('/template', auth, async (req, res) => {
  try {
    console.log('Creating template:', req.body);
    
    // Only allow institution users to create templates
    if (req.userType !== 'institution') {
      return res.status(403).json({ message: 'Only institutions can create templates' });
    }

    const template = new Template({
      ...req.body,
      institution: req.user._id
    });

    await template.save();
    console.log('Template created successfully:', template);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/templates', auth, async (req, res) => {
  try {
    // Only allow institution users to view their templates
    if (req.userType !== 'institution') {
      return res.status(403).json({ message: 'Only institutions can view templates' });
    }

    const templates = await Template.find({ institution: req.user._id });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 