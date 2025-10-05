const fs = require('fs');
const path = require('path');

// Source and destination paths
const sourcePath = path.join(__dirname, '../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json');
const destPath = path.join(__dirname, '../../backend/contracts/CertificateManager.json');

// Create the destination directory if it doesn't exist
const destDir = path.dirname(destPath);
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Read the source file
const contractArtifact = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

// Create a simplified version with just the ABI and bytecode
const simplifiedArtifact = {
  abi: contractArtifact.abi,
  bytecode: contractArtifact.bytecode
};

// Write to the destination
fs.writeFileSync(destPath, JSON.stringify(simplifiedArtifact, null, 2));

console.log('Contract artifacts copied successfully!'); 