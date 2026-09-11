const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Perps contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const testnetUsdg = process.env.USDG_ADDRESS;
  if (!testnetUsdg) throw new Error("Missing USDG_ADDRESS in .env");

  // 1. Deploy MarginVault
  const MarginVault = await ethers.getContractFactory("MarginVault");
  const marginVault = await upgrades.deployProxy(MarginVault, [testnetUsdg], { initializer: "initialize" });
  await marginVault.waitForDeployment();
  console.log("MarginVault deployed to:", await marginVault.getAddress());

  // 2. Deploy PositionManager
  const PositionManager = await ethers.getContractFactory("PositionManager");
  const positionManager = await upgrades.deployProxy(PositionManager, [await marginVault.getAddress()], { initializer: "initialize" });
  await positionManager.waitForDeployment();
  console.log("PositionManager deployed to:", await positionManager.getAddress());

  // 3. Deploy PerpMarketFactory
  const PerpMarketFactory = await ethers.getContractFactory("PerpMarketFactory");
  const perpMarketFactory = await upgrades.deployProxy(PerpMarketFactory, [], { initializer: "initialize" });
  await perpMarketFactory.waitForDeployment();
  console.log("PerpMarketFactory deployed to:", await perpMarketFactory.getAddress());

  // 4. Deploy PerpExchange
  const PerpExchange = await ethers.getContractFactory("PerpExchange");
  const perpExchange = await upgrades.deployProxy(PerpExchange, [await positionManager.getAddress()], { initializer: "initialize" });
  await perpExchange.waitForDeployment();
  console.log("PerpExchange deployed to:", await perpExchange.getAddress());

  // 5. Deploy FundingModule
  const FundingModule = await ethers.getContractFactory("FundingModule");
  const fundingModule = await upgrades.deployProxy(FundingModule, [], { initializer: "initialize" });
  await fundingModule.waitForDeployment();
  console.log("FundingModule deployed to:", await fundingModule.getAddress());

  // 6. Deploy InsuranceFund
  const InsuranceFund = await ethers.getContractFactory("InsuranceFund");
  const insuranceFund = await upgrades.deployProxy(InsuranceFund, [testnetUsdg], { initializer: "initialize" });
  await insuranceFund.waitForDeployment();
  console.log("InsuranceFund deployed to:", await insuranceFund.getAddress());

  // 7. Deploy LiquidationEngine
  const LiquidationEngine = await ethers.getContractFactory("LiquidationEngine");
  const liquidationEngine = await upgrades.deployProxy(LiquidationEngine, [await positionManager.getAddress(), await insuranceFund.getAddress()], { initializer: "initialize" });
  await liquidationEngine.waitForDeployment();
  console.log("LiquidationEngine deployed to:", await liquidationEngine.getAddress());

  // 8. Deploy PerpSettlement
  const PerpSettlement = await ethers.getContractFactory("PerpSettlement");
  const perpSettlement = await upgrades.deployProxy(PerpSettlement, [await positionManager.getAddress()], { initializer: "initialize" });
  await perpSettlement.waitForDeployment();
  console.log("PerpSettlement deployed to:", await perpSettlement.getAddress());

  // Setup Authorizations
  console.log("Setting up authorizations...");
  await marginVault.setAuthorized(await positionManager.getAddress(), true);
  await positionManager.setAuthorized(await perpExchange.getAddress(), true);
  await positionManager.setAuthorized(await liquidationEngine.getAddress(), true);
  await positionManager.setAuthorized(await perpSettlement.getAddress(), true);

  console.log("Deployment complete.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
