import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Certificate from '../models/certificate.model.js';
import Institution from '../models/institution.model.js';
import Template from '../models/template.model.js';
import Admin from '../models/admin.model.js';

dotenv.config();

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all collections
    console.log('Clearing Certificates collection...');
    await Certificate.deleteMany({});
    console.log('Certificates cleared');

    console.log('Clearing Institutions collection...');
    await Institution.deleteMany({});
    console.log('Institutions cleared');

    console.log('Clearing Templates collection...');
    await Template.deleteMany({});
    console.log('Templates cleared');

    console.log('Clearing Admins collection...');
    await Admin.deleteMany({});
    console.log('Admins cleared');

    console.log('All collections cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the script
clearDatabase(); 