import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment of Oracle Adapters...");

  // Strictly require ORACLE_ADMIN_ADDRESS from environment variables
  const oracleAdminAddress = process.env.ORACLE_ADMIN_ADDRESS;
  if (!oracleAdminAddress) {
    throw new Error("FATAL: ORACLE_ADMIN_ADDRESS is missing in environment variables! Deployment halted for safety.");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", balance.toString());
  console.log("Oracle Admin Address will be set to:", oracleAdminAddress);

  // 1. Deploy ChainlinkPriceAdapter
  const ChainlinkAdapter = await ethers.getContractFactory("ChainlinkPriceAdapter");
  const chainlinkAdapter = await ChainlinkAdapter.deploy();
  await chainlinkAdapter.waitForDeployment();
  const chainlinkAdapterAddress = await chainlinkAdapter.getAddress();
  console.log("ChainlinkPriceAdapter deployed to:", chainlinkAdapterAddress);

  // 2. Deploy ManualResolverAdapter
  const ManualAdapter = await ethers.getContractFactory("ManualResolverAdapter");
  const manualAdapter = await ManualAdapter.deploy();
  await manualAdapter.waitForDeployment();
  const manualAdapterAddress = await manualAdapter.getAddress();
  console.log("ManualResolverAdapter deployed to:", manualAdapterAddress);

  // 3. Transfer ownership to the Admin address registered in .env
  console.log("Transferring ownership to Admin...");
  
  let tx = await chainlinkAdapter.transferOwnership(oracleAdminAddress);
  await tx.wait();
  console.log("ChainlinkPriceAdapter ownership transferred.");

  tx = await manualAdapter.transferOwnership(oracleAdminAddress);
  await tx.wait();
  console.log("ManualResolverAdapter ownership transferred.");

  console.log("\n=========================================");
  console.log("Oracle Deployment Complete!");
  console.log("Please add the following addresses to your .env file:");
  console.log(`NEXT_PUBLIC_CHAINLINK_ADAPTER_ADDRESS=${chainlinkAdapterAddress}`);
  console.log(`NEXT_PUBLIC_MANUAL_ADAPTER_ADDRESS=${manualAdapterAddress}`);
  console.log("=========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
