const hre = require("hardhat");

async function main() {
  // Get the institution address from command line arguments
  const institutionAddress = process.argv[2];
  if (!institutionAddress) {
    console.error("Please provide an institution address as an argument");
    console.error("Example: npx hardhat run scripts/authorizeInstitution.js --network localhost 0x1234...");
    process.exit(1);
  }

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Using deployer account:", deployer.address);

  // Get the contract
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Authorize the institution address
  console.log("Authorizing institution address:", institutionAddress);
  const tx = await registry.authorizeInstitution(institutionAddress);
  await tx.wait();

  console.log("Institution authorized successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 