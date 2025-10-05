import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/admin.model.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const setupAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin accounts
    await Admin.deleteMany({});
    console.log('Deleted existing admin accounts');

    // Create new admin account (assign plain password, let pre-save hook hash it)
    const admin = new Admin({
      email: 'admin@certxchain.com',
      password: 'admin123',
      name: 'System Admin',
      role: 'admin'
    });

    await admin.save();
    console.log('Admin account created successfully');
    
    // Verify the password can be compared
    const isMatch = await admin.comparePassword('admin123');
    console.log('Password verification test:', isMatch ? 'Success' : 'Failed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  }
};

setupAdmin(); 