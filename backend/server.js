import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with explicit path
const envPath = path.join(__dirname, '.env');
console.log('Loading environment variables from:', envPath);

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found at:', envPath);
  process.exit(1);
}

// Read .env file contents for debugging
const envContents = fs.readFileSync(envPath, 'utf8');
console.log('Environment file contents:', envContents.split('\n').map(line => {
  if (line.includes('PASS') || line.includes('SECRET')) {
    return line.split('=')[0] + '=****';
  }
  return line;
}).join('\n'));

// Load environment variables
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Log environment variables (excluding sensitive ones)
console.log('Environment variables loaded:');
console.log('THIRDWEB_CLIENT_ID:', process.env.THIRDWEB_CLIENT_ID ? 'Set' : 'Not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('PORT:', process.env.PORT || 5000);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '****' : 'Not set');

// Import other dependencies after environment variables are loaded
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { initializeEmailConfig } from './utils/emailUtils.js';

// Initialize IPFS
import { initializeIPFS } from './utils/ipfsUtils.js';
initializeIPFS();

// Initialize email configuration
initializeEmailConfig()
  .then(() => console.log('Email configuration initialized successfully'))
  .catch(error => console.error('Failed to initialize email configuration:', error));

// Routes
import authRoutes from './routes/auth.routes.js';
import institutionRoutes from './routes/institution.routes.js';
import templateRoutes from './routes/template.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';

// Middleware
import { errorHandler } from './middleware/error.middleware.js';

// Initialize express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
console.log('Serving static files from:', uploadsDir);

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/institution', institutionRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/template', templateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
}); 