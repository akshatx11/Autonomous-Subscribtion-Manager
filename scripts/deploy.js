const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying SubscriptionManager to Monad Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}\n`);

  // Get account balance
  const balance = await deployer.getBalance();
  console.log(
    `💰 Account balance: ${hre.ethers.formatEther(balance)} MON\n`
  );

  // Deploy SubscriptionManager
  console.log("⏳ Deploying SubscriptionManager contract...");
  const SubscriptionManager = await hre.ethers.getContractFactory(
    "SubscriptionManager"
  );
  const subscriptionManager = await SubscriptionManager.deploy();
  await subscriptionManager.waitForDeployment();

  const subscriptionManagerAddress = await subscriptionManager.getAddress();
  console.log(
    `✅ SubscriptionManager deployed to: ${subscriptionManagerAddress}\n`
  );

  // Save deployment addresses to file
  const deploymentInfo = {
    network: "monadTestnet",
    chainId: 10143,
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    contracts: {
      SubscriptionManager: subscriptionManagerAddress,
    },
  };

  const deploymentPath = path.join(__dirname, "../deployments.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentPath}\n`);

  // Save contract addresses for frontend
  const contractAddresses = {
    SubscriptionManager: subscriptionManagerAddress,
  };

  const contractAddressPath = path.join(
    __dirname,
    "../lib/contract-addresses.json"
  );
  fs.writeFileSync(
    contractAddressPath,
    JSON.stringify(contractAddresses, null, 2)
  );
  console.log(`📄 Contract addresses saved for frontend: ${contractAddressPath}\n`);

  console.log("🎉 Deployment complete!");
  console.log("\nNext steps:");
  console.log("1. Update .env.local with your PRIVATE_KEY if not already set");
  console.log("2. Use these contract addresses in your frontend");
  console.log("3. Verify contracts on Monad explorer (if available)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
