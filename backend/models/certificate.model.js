import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  studentEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  ipfsHash: {
    type: String
  },
  blockchainTx: {
    type: String
  },
  status: {
    type: String,
    enum: ['issued', 'revoked'],
    default: 'issued'
  },
  isValid: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
certificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if model exists before creating
const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);

export default Certificate; 