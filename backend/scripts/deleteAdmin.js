import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/admin.model.js';

dotenv.config();

const deleteAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete admin account
    const result = await Admin.deleteOne({ email: 'admin@certxchain.com' });
    console.log('Admin deletion result:', result);

    if (result.deletedCount > 0) {
      console.log('Admin account deleted successfully');
    } else {
      console.log('No admin account found to delete');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error deleting admin:', error);
    process.exit(1);
  }
};

deleteAdmin(); 