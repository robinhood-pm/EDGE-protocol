import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Get USDG Address from env
  const usdgAddress = process.env.USDG_ADDRESS as string;
    
  if (usdgAddress === ethers.ZeroAddress) {
    throw new Error("USDG_ADDRESS not found for this network");
  }

  // 2. Deploy ConditionalTokens
  console.log("Deploying ConditionalTokens...");
  const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
  const conditionalTokens = await ConditionalTokens.deploy(usdgAddress, "");
  await conditionalTokens.waitForDeployment();
  const conditionalTokensAddress = await conditionalTokens.getAddress();
  console.log("ConditionalTokens deployed to:", conditionalTokensAddress);

  // 3. Deploy MarketFactory
  console.log("Deploying MarketFactory...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(conditionalTokensAddress);
  await marketFactory.waitForDeployment();
  const marketFactoryAddress = await marketFactory.getAddress();
  console.log("MarketFactory deployed to:", marketFactoryAddress);

  // Transfer Ownership of ConditionalTokens to MarketFactory
  console.log("Transferring ConditionalTokens ownership to MarketFactory...");
  const transferTx = await conditionalTokens.transferOwnership(marketFactoryAddress);
  await transferTx.wait();
  console.log("Ownership transferred.");

  // 4. Deploy FeeTreasury
  console.log("Deploying FeeTreasury...");
  const FeeTreasury = await ethers.getContractFactory("FeeTreasury");
  const feeTreasury = await FeeTreasury.deploy();
  await feeTreasury.waitForDeployment();
  const feeTreasuryAddress = await feeTreasury.getAddress();
  console.log("FeeTreasury deployed to:", feeTreasuryAddress);

  // 5. Deploy Exchange
  console.log("Deploying Exchange...");
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy(
    conditionalTokensAddress,
    usdgAddress,
    feeTreasuryAddress
  );
  await exchange.waitForDeployment();
  const exchangeAddress = await exchange.getAddress();
  console.log("Exchange deployed to:", exchangeAddress);

  console.log("Deployment complete.");
  console.log("=====================================");
  console.log("ConditionalTokens:", conditionalTokensAddress);
  console.log("MarketFactory:", marketFactoryAddress);
  console.log("FeeTreasury:", feeTreasuryAddress);
  console.log("Exchange:", exchangeAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
