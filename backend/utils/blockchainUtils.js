import { ethers } from 'ethers';
import CertificateRegistry from '../../blockchain/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json' assert { type: "json" };

// Debug logging for environment variables
console.log('Blockchain Utils - Environment variables:');
console.log('BLOCKCHAIN_RPC_URL:', process.env.BLOCKCHAIN_RPC_URL);
console.log('CERTIFICATE_MANAGER_ADDRESS:', process.env.CERTIFICATE_MANAGER_ADDRESS);
console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY ? 'Set' : 'Not Set');

// Initialize provider and signer
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');

// Initialize contract
let contract = null;
let signer = null;

const initializeSigner = () => {
  const privateKey = process.env.PRIVATE_KEY;
  console.log('Initializing signer with private key:', privateKey ? 'Set' : 'Not Set');
  
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is not set');
  }
  
  // Ensure private key starts with 0x
  const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  console.log('Formatted private key:', formattedPrivateKey ? 'Valid' : 'Invalid');
  
  try {
    return new ethers.Wallet(formattedPrivateKey, provider);
  } catch (error) {
    console.error('Error initializing signer:', error);
    throw new Error('Failed to initialize blockchain signer');
  }
};

const getContract = () => {
  if (!contract) {
    const contractAddress = process.env.CERTIFICATE_MANAGER_ADDRESS;
    console.log('Getting contract with address:', contractAddress);
    
    if (!contractAddress) {
      throw new Error('CERTIFICATE_MANAGER_ADDRESS environment variable is not set');
    }
    
    try {
      if (!signer) {
        signer = initializeSigner();
      }
      contract = new ethers.Contract(
        contractAddress,
        CertificateRegistry.abi,
        signer
      );
      console.log('Contract initialized successfully');
    } catch (error) {
      console.error('Error initializing contract:', error);
      throw new Error('Failed to initialize blockchain contract');
    }
  }
  return contract;
};

/**
 * Authorize an institution on the blockchain
 * @param {string} institutionAddress The address of the institution to authorize
 * @returns {Promise<Object>} The transaction result
 */
export const authorizeInstitution = async (institutionAddress) => {
  try {
    console.log('Authorizing institution:', institutionAddress);

    const contract = getContract();
    const tx = await contract.authorizeInstitution(institutionAddress);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      verificationUrl: `${process.env.BLOCKCHAIN_EXPLORER_URL}/tx/${receipt.hash}`
    };
  } catch (error) {
    console.error('Blockchain authorization error:', error);
    throw new Error('Failed to authorize institution on blockchain');
  }
};

/**
 * Issue a certificate on the blockchain
 * @param {Object} certificate The certificate object
 * @returns {Promise<Object>} The transaction result
 */
export const issueCertificate = async (certificate, institution) => {
  try {
    console.log('Issuing certificate on blockchain with data:', certificate);

    // Use the default private key from environment variables instead of institution's key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Default blockchain private key is not configured');
    }

    // Initialize signer with default private key
    const signer = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(
      process.env.CERTIFICATE_MANAGER_ADDRESS,
      CertificateRegistry.abi,
      signer
    );

    const tx = await contract.issueCertificate(
      certificate.certificateId,
      certificate.studentName,
      certificate.studentEmail,
      certificate.course,
      certificate.institution
    );
    const receipt = await tx.wait();

    // Construct verification URL using the frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify/${certificate.certificateId}`;

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      verificationUrl
    };
  } catch (error) {
    console.error('Blockchain issue error:', error);
    throw new Error('Failed to issue certificate on blockchain');
  }
};

/**
 * Verify a certificate on the blockchain
 * @param {string} certificateId The certificate ID to verify
 * @returns {Promise<boolean>} Whether the certificate is valid
 */
export const verifyCertificate = async (certificateId) => {
  try {
    const contract = getContract();
    const isValid = await contract.verifyCertificate(certificateId);
    return isValid;
  } catch (error) {
    console.error('Blockchain verification error:', error);
    throw new Error('Failed to verify certificate on blockchain');
  }
};

/**
 * Get certificate data from the blockchain
 * @param {string} certificateId The certificate ID to retrieve
 * @returns {Promise<Object>} The certificate data
 */
export const getCertificate = async (certificateId) => {
  try {
    const contract = getContract();
    const [
      studentName,
      studentEmail,
      course,
      date,
      institution,
      isValid
    ] = await contract.getCertificate(certificateId);

    return {
      certificateId,
      studentName,
      studentEmail,
      course,
      date: new Date(date * 1000).toISOString(),
      institution,
      isValid
    };
  } catch (error) {
    console.error('Blockchain get certificate error:', error);
    throw new Error('Failed to get certificate from blockchain');
  }
};