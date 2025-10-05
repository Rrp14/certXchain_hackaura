import { ethers } from 'ethers';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Institution from '../models/institution.model.js';
import CertificateRegistry from '../../blockchain/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json' assert { type: "json" };

dotenv.config();

const authorizeAllInstitutions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Connect to the blockchain
    const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');
    const privateKey = process.env.PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('PRIVATE_KEY is not set in environment variables');
    }

    const signer = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(
      process.env.CERTIFICATE_MANAGER_ADDRESS,
      CertificateRegistry.abi,
      signer
    );

    // Get all approved institutions
    const institutions = await Institution.find({ status: 'approved' });
    console.log(`Found ${institutions.length} approved institutions`);

    // Authorize each institution
    for (const institution of institutions) {
      try {
        // Use the deployer's address for all institutions
        const deployerAddress = await signer.getAddress();
        console.log(`Authorizing institution: ${institution.name} (${deployerAddress})`);
        
        const tx = await contract.authorizeInstitution(deployerAddress);
        await tx.wait();
        
        console.log(`Successfully authorized ${institution.name}`);
      } catch (error) {
        console.error(`Error authorizing ${institution.name}:`, error.message);
      }
    }

    console.log('Finished authorizing institutions');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

authorizeAllInstitutions(); 