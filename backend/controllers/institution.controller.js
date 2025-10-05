import jwt from 'jsonwebtoken';
import Institution from '../models/Institution.js';
import { uploadToIPFS } from '../utils/ipfsUtils.js';

// Register a new institution
// Add this at the top of the file after the imports
const TEST_ACCOUNTS = [
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
  },
  {
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    privateKey: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'
  },
  {
    address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    privateKey: '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a'
  },
  {
    address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    privateKey: '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba'
  },
  {
    address: '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
    privateKey: '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e'
  },
  {
    address: '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
    privateKey: '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356'
  },
  {
    address: '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
    privateKey: '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97'
  },
  {
    address: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
    privateKey: '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6'
  },
  {
    address: '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
    privateKey: '0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897'
  },
  {
    address: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
    privateKey: '0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82'
  },
  {
    address: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
    privateKey: '0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1'
  },
  {
    address: '0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec',
    privateKey: '0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd'
  },
  {
    address: '0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097',
    privateKey: '0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa'
  },
  {
    address: '0xcd3B766CCDd6AE721141F452C550Ca635964ce71',
    privateKey: '0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61'
  },
  {
    address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    privateKey: '0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0'
  }
];

// Add this variable to track the current account index
let currentAccountIndex = 0;

// Then modify the register function to use these accounts
export const register = async (req, res) => {
  try {
    const { name, email, password, address, description } = req.body;

    // Check if institution already exists
    const existingInstitution = await Institution.findOne({ email });
    
    // Get next available test account
    const testAccount = TEST_ACCOUNTS[currentAccountIndex % TEST_ACCOUNTS.length];
    currentAccountIndex++;

    // If institution exists and is revoked, update it
    if (existingInstitution && existingInstitution.status === 'revoked') {
      existingInstitution.name = name;
      existingInstitution.password = await bcrypt.hash(password, 10);
      existingInstitution.address = address;
      existingInstitution.description = description;
      existingInstitution.blockchainAddress = testAccount.address;
      existingInstitution.blockchainPrivateKey = testAccount.privateKey;
      existingInstitution.status = 'approved'; // Auto-approve for testing
      
      await existingInstitution.save();

      const token = jwt.sign(
        { id: existingInstitution._id, role: 'institution' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        message: 'Institution re-registered successfully',
        token,
        institution: {
          id: existingInstitution._id,
          name: existingInstitution.name,
          email: existingInstitution.email,
          status: existingInstitution.status,
          blockchainAddress: existingInstitution.blockchainAddress
        }
      });
    } else if (existingInstitution) {
      // If institution exists and is not revoked, return error
      return res.status(400).json({ message: 'Institution with this email already exists' });
    }

    // Hash password for new institution
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new institution with blockchain account
    const institution = new Institution({
      name,
      email,
      password: hashedPassword,
      address,
      description,
      blockchainAddress: testAccount.address,
      blockchainPrivateKey: testAccount.privateKey,
      status: 'approved' // Auto-approve for testing
    });

    await institution.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: institution._id, role: 'institution' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Institution registered successfully',
      token,
      institution: {
        id: institution._id,
        name: institution.name,
        email: institution.email,
        status: institution.status,
        blockchainAddress: institution.blockchainAddress
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering institution' });
  }
};

// Login institution
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find institution
    const institution = await Institution.findOne({ email });
    if (!institution) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await institution.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check status
    if (institution.status !== 'approved') {
      return res.status(403).json({ 
        message: 'Your account is pending approval' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: institution._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      institution: {
        id: institution._id,
        name: institution.name,
        email: institution.email,
        status: institution.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
};

// Get institution profile
export const getProfile = async (req, res) => {
  try {
    const institution = await Institution.findById(req.institution._id)
      .select('-password');
    
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    res.json({
      id: institution._id,
      name: institution.name,
      email: institution.email,
      description: institution.description,
      status: institution.status,
      address: institution.address,
      certificatesIssued: institution.certificatesIssued
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// Update institution profile
export const updateProfile = async (req, res) => {
  try {
    const { name, description, address } = req.body;
    const institution = await Institution.findById(req.institution._id);

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    // Update fields
    if (name) institution.name = name;
    if (description) institution.description = description;
    if (address) institution.address = address;

    await institution.save();

    res.json({
      message: 'Profile updated successfully',
      institution: {
        id: institution._id,
        name: institution.name,
        email: institution.email,
        description: institution.description,
        address: institution.address,
        status: institution.status
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Upload verification documents
export const uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No documents provided' });
    }

    const institution = await Institution.findById(req.institution._id);
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    // Upload each document to IPFS
    const documentPromises = req.files.map(file => uploadToIPFS(file.buffer));
    const ipfsUris = await Promise.all(documentPromises);

    // Add new document URIs to institution
    institution.documents.push(...ipfsUris);
    await institution.save();

    res.json({
      message: 'Documents uploaded successfully',
      documents: ipfsUris
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ message: 'Failed to upload documents' });
  }
};

// Upload logo
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const institution = await Institution.findById(req.user.id);
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    institution.logo = `/uploads/${req.file.filename}`;
    await institution.save();

    res.json({ message: 'Logo uploaded successfully', logo: institution.logo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload signature
export const uploadSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const institution = await Institution.findById(req.user.id);
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    institution.signature = `/uploads/${req.file.filename}`;
    await institution.save();

    res.json({ message: 'Signature uploaded successfully', signature: institution.signature });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload seal
export const uploadSeal = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const institution = await Institution.findById(req.user.id);
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    institution.seal = `/uploads/${req.file.filename}`;
    await institution.save();

    res.json({ message: 'Seal uploaded successfully', seal: institution.seal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update institution blockchain address
export const updateBlockchainAddress = async (req, res) => {
  try {
    const institution = await Institution.findById(req.institution._id);
    
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    institution.blockchainAddress = process.env.DEPLOYER_ADDRESS;
    await institution.save();

    res.json({
      message: 'Blockchain address updated successfully',
      institution: {
        id: institution._id,
        name: institution.name,
        email: institution.email,
        blockchainAddress: institution.blockchainAddress
      }
    });
  } catch (error) {
    console.error('Blockchain address update error:', error);
    res.status(500).json({ message: 'Failed to update blockchain address' });
  }
};