import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'revoked'],
    default: 'pending'
  },
  certificatesIssued: {
    type: Number,
    default: 0
  },
  address: {
    type: String,
    required: true
  },
  blockchainAddress: {
    type: String,
    required: false  // Changed from true to false
  },
  blockchainPrivateKey: {
    type: String,
    required: false  // Changed from true to false
  },
  documents: [{
    type: String, // IPFS URIs for verification documents
    required: true
  }],
  logo: String,
  signature: String,
  seal: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
institutionSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
institutionSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Check if model exists before creating
const Institution = mongoose.models.Institution || mongoose.model('Institution', institutionSchema);

export default Institution;