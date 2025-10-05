import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  fields: [{
    name: {
      type: String,
      required: [true, 'Field name is required']
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
    type: String,
    default: ''
  },
  customHTML: {
    type: String,
    default: ''
  },
  institutionLogo: {
    type: String,
    default: ''
  },
  authorizedSignature: {
    type: String,
    default: ''
  },
  seal: {
    type: String,
    default: ''
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: [true, 'Institution reference is required']
  }
}, {
  timestamps: true
});

// Add validation for fields array
templateSchema.pre('save', function(next) {
  if (this.fields && this.fields.length > 0) {
    const fieldNames = new Set();
    for (const field of this.fields) {
      if (fieldNames.has(field.name)) {
        next(new Error(`Duplicate field name: ${field.name}`));
        return;
      }
      fieldNames.add(field.name);
    }
  }
  next();
});

// Check if model exists before creating
const Template = mongoose.models.Template || mongoose.model('Template', templateSchema);

export default Template; 