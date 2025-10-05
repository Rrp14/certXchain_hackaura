import { ethers } from 'ethers';
import dotenv from 'dotenv';
import CertificateRegistry from '../../blockchain/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json' assert { type: "json" };

dotenv.config();

const authorizeInstitution = async () => {
  try {
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

    // Get the deployer address (this will be the authorized address)
    const deployerAddress = await signer.getAddress();
    console.log('Deployer address:', deployerAddress);

    // Authorize the institution
    console.log('Authorizing institution...');
    const tx = await contract.authorizeInstitution(deployerAddress);
    await tx.wait();

    console.log('Institution authorized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error authorizing institution:', error);
    process.exit(1);
  }
};

authorizeInstitution(); 