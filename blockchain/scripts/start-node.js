const { network } = require("hardhat");

async function main() {
  console.log("Starting local Hardhat node...");
  
  // Start the local node
  await network.provider.send("hardhat_reset", []);
  
  console.log("Local Hardhat node started successfully!");
  console.log("Network RPC URL: http://127.0.0.1:8545");
  console.log("Chain ID: 31337");
  
  // Keep the process running
  await new Promise(() => {});
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 