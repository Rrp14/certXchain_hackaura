import mongoose from 'mongoose';
import Institution from '../models/Institution.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: join(__dirname, '..', '.env') });

async function clearCredentials() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Institution.updateMany(
      {}, 
      { 
        $set: { 
          blockchainPrivateKey: null,
          blockchainAddress: null
        } 
      }
    );

    console.log(`Cleared credentials for ${result.modifiedCount} institutions`);
  } catch (error) {
    console.error('Error clearing credentials:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

clearCredentials();