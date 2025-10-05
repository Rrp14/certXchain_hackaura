import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Admin from '../models/admin.model.js';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin exists
    const adminExists = await Admin.findOne({ email: 'admin@certxchain.com' });
    if (adminExists) {
      console.log('Admin account already exists');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin account
    const admin = new Admin({
      email: 'admin@certxchain.com',
      password: hashedPassword,
      name: 'System Admin',
      role: 'admin',
      firebaseUid: 'admin-' + Date.now() // Generate a unique firebaseUid
    });

    await admin.save();
    console.log('Admin account created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin(); 