import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/certxchain';

async function dropIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.collections();

    for (const collection of collections) {
      const indexes = await collection.indexes();
      console.log(`Indexes for ${collection.collectionName}:`, indexes);

      // Drop firebaseUid index if it exists
      if (indexes.some(index => index.name === 'firebaseUid_1')) {
        await collection.dropIndex('firebaseUid_1');
        console.log(`Dropped firebaseUid_1 index from ${collection.collectionName}`);
      }
    }

    console.log('Index cleanup completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropIndexes(); 