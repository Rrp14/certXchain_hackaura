const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fields: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'date', 'number'],
      default: 'text'
    },
    required: {
      type: Boolean,
      default: true
    }
  }],
  layout: {
    type: String,
    enum: ['default', 'modern', 'classic', 'minimal'],
    default: 'default'
  },
  customCSS: {
    type: String
  },
  customHTML: {
    type: String
  },
  institutionLogo: {
    type: String, // URL or base64 string
    required: true
  },
  authorizedSignature: {
    type: String, // URL or base64 string
    required: true
  },
  seal: {
    type: String, // URL or base64 string
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
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

templateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Template', templateSchema); 