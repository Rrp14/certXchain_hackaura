import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
    trim: true
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
  ipfsUri: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active'
  },
  revocationReason: String,
  revocationDate: Date
}, {
  timestamps: true
});

// Check if model exists before creating
const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);

export default Certificate; 