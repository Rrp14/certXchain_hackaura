import { ThirdwebStorage } from '@thirdweb-dev/storage';
import { Readable } from 'stream';

// Initialize storage client
let storage = null;

/**
 * Initialize the IPFS storage client
 */
export const initializeIPFS = () => {
  const clientId = process.env.THIRDWEB_CLIENT_ID;
  console.log('IPFS Utils - Initializing with Client ID:', clientId ? 'Set' : 'Not set');

  if (!clientId) {
    console.error('IPFS Utils - Error: THIRDWEB_CLIENT_ID is not set in environment variables');
    console.error('IPFS Utils - Current environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      THIRDWEB_CLIENT_ID: process.env.THIRDWEB_CLIENT_ID,
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
      PORT: process.env.PORT || 5000
    });
    return;
  }

  storage = new ThirdwebStorage({
    clientId,
    secretKey: process.env.THIRDWEB_SECRET_KEY,
    headers: {
      'x-client-id': clientId
    }
  });
};

/**
 * Upload a file to IPFS using Thirdweb
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} filename - The name of the file
 * @returns {Promise<string>} The IPFS CID
 */
export const uploadToIPFS = async (fileBuffer, filename) => {
  try {
    if (!storage) {
      initializeIPFS();
    }

    if (!storage) {
      throw new Error('IPFS storage client not initialized');
    }

    console.log('IPFS Utils - Starting upload for file:', filename);
    console.log('IPFS Utils - File buffer size:', fileBuffer.length);
    
    // Create a readable stream from the buffer
    const stream = Readable.from(fileBuffer);

    // Upload to IPFS
    const response = await storage.upload({
      name: filename,
      stream,
      type: 'application/pdf'
    });

    console.log('IPFS Utils - Raw upload response:', response);
    
    // Extract the CID from the response
    // The response format is like: ipfs://<cid>/0
    if (!response.startsWith('ipfs://')) {
      throw new Error('Invalid IPFS response format: expected ipfs:// protocol');
    }
    
    // Remove ipfs:// prefix and get the CID part
    const cid = response.replace('ipfs://', '').split('/')[0];
    console.log('IPFS Utils - Extracted CID:', cid);
    
    return cid;
  } catch (error) {
    console.error('IPFS Utils - Upload error:', error);
    throw new Error('Failed to upload to IPFS');
  }
};

/**
 * Get the gateway URL for an IPFS CID
 * @param {string} cid - The IPFS CID
 * @returns {string} The gateway URL
 */
export const getGatewayURL = (cid) => {
  try {
    // Clean the CID first
    const cleanCID = extractCID(cid);
    console.log('IPFS Utils - Getting gateway URL for CID:', cleanCID);
    const url = `https://ipfs.io/ipfs/${cleanCID}`;
    console.log('IPFS Utils - Generated gateway URL:', url);
    return url;
  } catch (error) {
    console.error('Error getting gateway URL:', error);
    throw new Error('Failed to get gateway URL');
  }
};

/**
 * Extract CID from IPFS URI
 * @param {string} uri - The IPFS URI
 * @returns {string} The CID
 */
export const extractCID = (uri) => {
  console.log('IPFS Utils - Extracting CID from:', uri);
  
  if (!uri) {
    console.error('IPFS Utils - Empty URI provided');
    return '';
  }

  // If it's already a clean CID (no protocol or path), return it
  if (!uri.includes('://') && !uri.includes('/')) {
    console.log('IPFS Utils - Input is already a clean CID');
    return uri;
  }

  // Try to extract CID from IPFS gateway URL format
  const ipfsMatch = uri.match(/\/ipfs\/([^/]+)/);
  if (ipfsMatch) {
    console.log('IPFS Utils - Extracted CID from IPFS URL:', ipfsMatch[1]);
    return ipfsMatch[1];
  }

  // Remove any protocol prefix (ipfs://, https://, etc)
  const withoutProtocol = uri.replace(/^.*?:\/\//, '');
  
  // Split by / and take the first part (the CID)
  const cid = withoutProtocol.split('/')[0];
  
  console.log('IPFS Utils - Extracted CID:', cid);
  return cid;
}; 