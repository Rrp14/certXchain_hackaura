const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Starting deployment...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy CertificateRegistry
  console.log("Deploying CertificateRegistry...");
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const certificateRegistry = await CertificateRegistry.deploy();
  await certificateRegistry.deployed();

  const contractAddress = certificateRegistry.address;
  console.log("CertificateRegistry deployed to:", contractAddress);

  // Save deployment info to a JSON file
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    timestamp: new Date().toISOString()
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // Save deployment info
  const deploymentPath = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentPath);

  // Update .env file in backend directory
  const backendEnvPath = path.join(__dirname, '../../backend/.env');
  let envContent = '';
  
  if (fs.existsSync(backendEnvPath)) {
    envContent = fs.readFileSync(backendEnvPath, 'utf8');
  }

  // Update or add blockchain configuration
  const blockchainConfig = `
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
CERTIFICATE_MANAGER_ADDRESS=${contractAddress}
BLOCKCHAIN_EXPLORER_URL=http://localhost:8545
DEPLOYER_ADDRESS=${deployer.address}
PRIVATE_KEY=${deployer.privateKey}
`;

  // Replace existing blockchain config or append if not exists
  if (envContent.includes('BLOCKCHAIN_RPC_URL')) {
    envContent = envContent.replace(
      /# Blockchain Configuration[\s\S]*?(?=\n#|$)/,
      blockchainConfig.trim()
    );
  } else {
    envContent += '\n' + blockchainConfig;
  }

  fs.writeFileSync(backendEnvPath, envContent);
  console.log("Updated backend/.env with new contract address");

  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 