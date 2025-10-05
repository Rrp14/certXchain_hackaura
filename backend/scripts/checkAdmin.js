import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/admin.model.js';

dotenv.config();

const checkAndCreateAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin exists
    const admin = await Admin.findOne({ email: 'admin@certxchain.com' });
    
    if (admin) {
      console.log('Admin account already exists:', admin._id);
    } else {
      // Create admin account
      const newAdmin = new Admin({
        email: 'admin@certxchain.com',
        password: 'admin123',
        firebaseUid: 'admin',
        name: 'Admin'
      });
      
      await newAdmin.save();
      console.log('Admin account created successfully:', newAdmin._id);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

checkAndCreateAdmin(); 