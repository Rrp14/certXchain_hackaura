import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { auth } from '../middleware/auth.js';
import Institution from '../models/Institution.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Upload institution logo
router.post('/logo', auth, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Update institution document with logo path
    const filePath = `/uploads/${req.file.filename}`;
    await Institution.findByIdAndUpdate(req.institution._id, { logo: filePath });

    res.json({
      message: 'Logo uploaded successfully',
      filePath
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload signature
router.post('/signature', auth, upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Update institution document with signature path
    const filePath = `/uploads/${req.file.filename}`;
    await Institution.findByIdAndUpdate(req.institution._id, { signature: filePath });

    res.json({
      message: 'Signature uploaded successfully',
      filePath
    });
  } catch (error) {
    console.error('Error uploading signature:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload seal
router.post('/seal', auth, upload.single('seal'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Update institution document with seal path
    const filePath = `/uploads/${req.file.filename}`;
    await Institution.findByIdAndUpdate(req.institution._id, { seal: filePath });

    res.json({
      message: 'Seal uploaded successfully',
      filePath
    });
  } catch (error) {
    console.error('Error uploading seal:', error);
    res.status(500).json({ message: error.message });
  }
});

export { router as uploadRoutes }; 