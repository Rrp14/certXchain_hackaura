import Template from '../models/template.model.js';
import path from 'path';
import fs from 'fs';

// Create a new template
export const createTemplate = async (req, res) => {
  try {
    console.log('Creating template - Request body:', req.body);
    console.log('Creating template - Institution:', req.institution);

    if (!req.institution || !req.institution._id) {
      console.error('No institution found in request');
      return res.status(401).json({ message: 'Institution not authenticated' });
    }

    // Validate required fields
    if (!req.body.name) {
      console.error('Template name is missing');
      return res.status(400).json({ message: 'Template name is required' });
    }

    // Create template with default values if not provided
    const templateData = {
      name: req.body.name,
      description: req.body.description || '',
      fields: req.body.fields || [],
      layout: req.body.layout || 'classic',
      institutionLogo: req.body.institutionLogo || '',
      authorizedSignature: req.body.authorizedSignature || '',
      seal: req.body.seal || '',
      institution: req.institution._id
    };

    console.log('Creating template with processed data:', templateData);

    // Validate template data against schema
    const template = new Template(templateData);
    const validationError = template.validateSync();
    if (validationError) {
      console.error('Template validation error:', validationError);
      return res.status(400).json({
        message: 'Validation Error',
        details: Object.values(validationError.errors).map(err => err.message)
      });
    }

    await template.save();
    console.log('Template created successfully:', template);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation Error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(400).json({ 
      message: error.message,
      details: error.errors || error
    });
  }
};

// Get all templates for the authenticated institution
export const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ institution: req.institution._id })
      .sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific template
export const getTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      institution: req.institution._id
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a template
export const updateTemplate = async (req, res) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, institution: req.institution._id },
      req.body,
      { new: true }
    );
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a template
export const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      institution: req.institution._id
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload template asset (logo, signature, seal)
export const uploadTemplateAsset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Return the path relative to the uploads directory
    const relativePath = path.relative(
      path.join(process.cwd(), 'uploads'),
      req.file.path
    ).replace(/\\/g, '/');

    console.log('File uploaded:', {
      originalName: req.file.originalname,
      path: relativePath,
      fullPath: req.file.path
    });

    res.json({
      message: 'File uploaded successfully',
      path: relativePath
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: error.message });
  }
}; 