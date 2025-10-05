import express from 'express';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import {
  issueCertificate,
  verifyCertificate,
  downloadCertificate,
  revokeCertificate,
  getInstitutionCertificates
} from '../controllers/certificate.controller.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Public routes
router.get('/verify/:id', verifyCertificate);
router.get('/download/:id', downloadCertificate);

// Protected routes
router.post('/', auth, issueCertificate);
router.post('/upload', auth, upload.single('certificate'), issueCertificate);
router.get('/institution', auth, getInstitutionCertificates);
router.post('/revoke/:id', auth, revokeCertificate);

export default router; 