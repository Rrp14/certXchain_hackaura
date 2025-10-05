import { create } from 'ipfs-http-client';

// Initialize IPFS client
const ipfs = create({
  host: process.env.REACT_APP_IPFS_HOST || 'localhost',
  port: process.env.REACT_APP_IPFS_PORT || '5001',
  protocol: process.env.REACT_APP_IPFS_PROTOCOL || 'http'
});

/**
 * Retrieve certificate data from IPFS
 * @param {string} ipfsHash The IPFS hash
 * @returns {Promise<Object>} The certificate data
 */
export const retrieveFromIPFS = async (ipfsHash) => {
  try {
    const stream = ipfs.cat(ipfsHash);
    let data = '';
    
    for await (const chunk of stream) {
      data += chunk.toString();
    }
    
    return JSON.parse(data);
  } catch (error) {
    console.error('IPFS retrieval error:', error);
    throw new Error('Failed to retrieve certificate from IPFS');
  }
};

/**
 * Get IPFS gateway URL for a hash
 * @param {string} ipfsHash The IPFS hash
 * @returns {string} The gateway URL
 */
export const getIPFSGatewayURL = (ipfsHash) => {
  const gateway = process.env.REACT_APP_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
  return `${gateway}${ipfsHash}`;
};

// Upload data to IPFS
export const uploadToIPFS = async (data) => {
  try {
    const { cid } = await ipfs.add(JSON.stringify(data));
    return cid.toString();
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}; 