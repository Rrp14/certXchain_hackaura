import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/admin.model.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const resetAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin
    await Admin.deleteMany({});
    console.log('Deleted existing admin accounts');

    // Create new admin account
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new Admin({
      email: 'admin@certxchain.com',
      password: hashedPassword,
      name: 'System Admin'
    });

    await admin.save();
    console.log('New admin account created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin:', error);
    process.exit(1);
  }
};

resetAdmin(); 