import { ethers, upgrades } from "hardhat";

async function logTx(txHash: string | undefined, receipt: any) {
  if (txHash) {
    console.log(`  > Transaction Hash: ${txHash}`);
    if (receipt) {
      console.log(`  > Gas Used: ${receipt.gasUsed.toString()}`);
      const cost = BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice);
      console.log(`  > Cost: ${ethers.formatEther(cost)} RH`);
    }
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const initialBalance = await deployer.provider.getBalance(deployer.address);
  console.log("Initial Balance:", ethers.formatEther(initialBalance), "RH");

  // 1. Get USDG Address from env
  const usdgAddress = process.env.USDG_ADDRESS as string;
    
  if (usdgAddress === ethers.ZeroAddress) {
    throw new Error("USDG_ADDRESS not found for this network");
  }

  // 2. Deploy ConditionalTokens
  console.log("\nDeploying ConditionalTokens...");
  const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
  const conditionalTokens = await upgrades.deployProxy(ConditionalTokens, [usdgAddress, ""]);
  await conditionalTokens.waitForDeployment();
  const conditionalTokensAddress = await conditionalTokens.getAddress();
  console.log("ConditionalTokens deployed to:", conditionalTokensAddress);
  await logTx(conditionalTokens.deploymentTransaction()?.hash, await conditionalTokens.deploymentTransaction()?.wait());

  // 3. Deploy MarketFactory
  console.log("\nDeploying MarketFactory...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await upgrades.deployProxy(MarketFactory, [conditionalTokensAddress]);
  await marketFactory.waitForDeployment();
  const marketFactoryAddress = await marketFactory.getAddress();
  console.log("MarketFactory deployed to:", marketFactoryAddress);
  await logTx(marketFactory.deploymentTransaction()?.hash, await marketFactory.deploymentTransaction()?.wait());

  // Transfer Ownership of ConditionalTokens to MarketFactory
  console.log("\nTransferring ConditionalTokens ownership to MarketFactory...");
  const transferTx = await conditionalTokens.transferOwnership(marketFactoryAddress);
  const transferReceipt = await transferTx.wait();
  console.log("Ownership transferred.");
  await logTx(transferTx.hash, transferReceipt);

  // 4. Deploy FeeTreasury
  console.log("\nDeploying FeeTreasury...");
  const FeeTreasury = await ethers.getContractFactory("FeeTreasury");
  const feeTreasury = await upgrades.deployProxy(FeeTreasury, []);
  await feeTreasury.waitForDeployment();
  const feeTreasuryAddress = await feeTreasury.getAddress();
  console.log("FeeTreasury deployed to:", feeTreasuryAddress);
  await logTx(feeTreasury.deploymentTransaction()?.hash, await feeTreasury.deploymentTransaction()?.wait());

  // 5. Deploy Exchange
  console.log("\nDeploying Exchange...");
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await upgrades.deployProxy(Exchange, [
    conditionalTokensAddress,
    usdgAddress,
    feeTreasuryAddress
  ]);
  await exchange.waitForDeployment();
  const exchangeAddress = await exchange.getAddress();
  console.log("Exchange deployed to:", exchangeAddress);
  await logTx(exchange.deploymentTransaction()?.hash, await exchange.deploymentTransaction()?.wait());

  const finalBalance = await deployer.provider.getBalance(deployer.address);
  console.log("\n=====================================");
  console.log("Deployment complete.");
  console.log(`Total Cost: ${ethers.formatEther(initialBalance - finalBalance)} RH`);
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
