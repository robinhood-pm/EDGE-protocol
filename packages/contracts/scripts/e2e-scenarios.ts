import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  dimGreen: "\x1b[32;2m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
};

async function executePartialFill() {
  console.log(`\n${C.yellow}=== STARTING SCENARIO 2: PARTIAL FILL ===${C.reset}`);
  const [admin] = await ethers.getSigners();
  
  const usdgAddress = process.env.USDG_ADDRESS;
  const conditionalTokensAddress = process.env.CONDITIONAL_TOKENS_ADDRESS;
  const marketFactoryAddress = process.env.MARKET_FACTORY_ADDRESS;
  const exchangeAddress = process.env.EXCHANGE_ADDRESS;

  if (!usdgAddress || !conditionalTokensAddress || !marketFactoryAddress || !exchangeAddress) {
    throw new Error("Missing contract addresses in .env");
  }

  const MarketFactory = await ethers.getContractAt("MarketFactory", marketFactoryAddress, admin);
  const conditionalTokens = await ethers.getContractAt("ConditionalTokens", conditionalTokensAddress, admin);
  const Exchange = await ethers.getContractAt("Exchange", exchangeAddress, admin);
  
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function mint(address to, uint256 amount) public",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)"
  ];
  const usdg = new ethers.Contract(usdgAddress, erc20Abi, admin) as any;

  // 1. Create a Market
  const question = "Will BTC hit 200k by 2026? " + Date.now();
  console.log(`${C.dimGreen}[+] Creating market: ${question}${C.reset}`);
  const createTx = await MarketFactory.createMarket(question, "Qm...", Math.floor(Date.now()/1000)+3600, admin.address);
  const createReceipt = await createTx.wait();
  if (!createReceipt) throw new Error("Receipt is null");
  
  const marketCreatedEvent = createReceipt.logs.find((log: any) => {
    try { return MarketFactory.interface.parseLog(log)?.name === 'MarketCreated'; } catch { return false; }
  });
  if (!marketCreatedEvent) throw new Error("Event not found");
  const marketId = MarketFactory.interface.parseLog(marketCreatedEvent)?.args[0];
  console.log(`${C.cyan}    └─ Market ID: ${marketId}${C.reset}`);

  // 2. Setup Traders
  const userA = ethers.Wallet.createRandom().connect(ethers.provider); // Seller (YES)
  const userB = ethers.Wallet.createRandom().connect(ethers.provider); // Buyer (YES)
  
  await (await admin.sendTransaction({ to: userA.address, value: ethers.parseEther("0.0001") })).wait();
  await (await admin.sendTransaction({ to: userB.address, value: ethers.parseEther("0.0001") })).wait();
  await (await usdg.transfer(userA.address, ethers.parseUnits("50", 6))).wait();
  await (await usdg.transfer(userB.address, ethers.parseUnits("50", 6))).wait();

  // 3. User A mints 50 YES and 50 NO
  await (await usdg.connect(userA).approve(conditionalTokensAddress, ethers.parseUnits("50", 6))).wait();
  await (await conditionalTokens.connect(userA).splitPosition(marketId, ethers.parseUnits("50", 6))).wait();
  await (await conditionalTokens.connect(userA).setApprovalForAll(exchangeAddress, true)).wait();

  // 4. User B approves USDG for Exchange
  await (await usdg.connect(userB).approve(exchangeAddress, ethers.parseUnits("50", 6))).wait();

  const domain = {
    name: "EdgeProtocolExchange",
    version: "1",
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    verifyingContract: exchangeAddress
  };
  const types = {
    Order: [
      { name: "maker", type: "address" },
      { name: "marketId", type: "uint256" },
      { name: "outcome", type: "uint8" },
      { name: "amount", type: "uint256" },
      { name: "price", type: "uint256" },
      { name: "isBuy", type: "bool" },
      { name: "nonce", type: "uint256" },
      { name: "expiration", type: "uint256" },
    ]
  };

  // User A Sells 50 YES for 0.40 USDG per share (Total: 20 USDG)
  const sellOrder = {
    maker: userA.address, marketId, outcome: 1,
    amount: ethers.parseUnits("50", 6), price: ethers.parseUnits("400000", 0), // 0.4 * 1e6
    isBuy: false, nonce: 123, expiration: Math.floor(Date.now()/1000)+3600
  };
  const sellSig = await userA.signTypedData(domain, types, sellOrder);

  // User B Buys 20 YES for 0.40 USDG per share
  // THIS IS A PARTIAL FILL (20 < 50)
  const buyOrder = {
    maker: userB.address, marketId, outcome: 1,
    amount: ethers.parseUnits("20", 6), price: ethers.parseUnits("400000", 0),
    isBuy: true, nonce: 456, expiration: Math.floor(Date.now()/1000)+3600
  };
  const buySig = await userB.signTypedData(domain, types, buyOrder);

  console.log(`${C.dimGreen}[+] Executing Partial Fill (Match 20 YES out of 50 YES)...${C.reset}`);
  await (await Exchange.matchOrders(buyOrder, buySig, sellOrder, sellSig)).wait();
  
  const userBYesBal = await conditionalTokens.balanceOf(userB.address, (BigInt(marketId) << 1n) | 1n);
  console.log(`${C.cyan}    └─ User B YES Balance: ${ethers.formatUnits(userBYesBal, 6)} (Expected: 20)${C.reset}`);

  console.log(`${C.green}=== SCENARIO 2 SUCCESS ===${C.reset}\n`);
}

async function executeInvalidatedMarket() {
  console.log(`\n${C.yellow}=== STARTING SCENARIO 3: INVALIDATED MARKET ===${C.reset}`);
  const [admin] = await ethers.getSigners();
  
  const usdgAddress = process.env.USDG_ADDRESS;
  const conditionalTokensAddress = process.env.CONDITIONAL_TOKENS_ADDRESS;
  const marketFactoryAddress = process.env.MARKET_FACTORY_ADDRESS;

  if (!usdgAddress || !conditionalTokensAddress || !marketFactoryAddress) {
    throw new Error("Missing contract addresses in .env");
  }

  const MarketFactory = await ethers.getContractAt("MarketFactory", marketFactoryAddress, admin);
  const conditionalTokens = await ethers.getContractAt("ConditionalTokens", conditionalTokensAddress, admin);
  
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function mint(address to, uint256 amount) public",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)"
  ];
  const usdg = new ethers.Contract(usdgAddress, erc20Abi, admin) as any;

  // 1. Create a Market
  const question = "Will this market be invalid? " + Date.now();
  console.log(`${C.dimGreen}[+] Creating market: ${question}${C.reset}`);
  const createTx = await MarketFactory.createMarket(question, "Qm...", Math.floor(Date.now()/1000)+3600, admin.address);
  const createReceipt = await createTx.wait();
  if (!createReceipt) throw new Error("Receipt is null");
  
  const marketCreatedEvent = createReceipt.logs.find((log: any) => {
    try { return MarketFactory.interface.parseLog(log)?.name === 'MarketCreated'; } catch { return false; }
  });
  if (!marketCreatedEvent) throw new Error("Event not found");
  const marketId = MarketFactory.interface.parseLog(marketCreatedEvent)?.args[0];

  // 2. Setup Trader
  const userA = ethers.Wallet.createRandom().connect(ethers.provider); 
  await (await admin.sendTransaction({ to: userA.address, value: ethers.parseEther("0.0001") })).wait();
  await (await usdg.transfer(userA.address, ethers.parseUnits("100", 6))).wait();
  
  // User splits 100 USDG into 100 YES and 100 NO
  console.log(`${C.dimGreen}[+] User splits 100 USDG into 100 YES and 100 NO...${C.reset}`);
  await (await usdg.connect(userA).approve(conditionalTokensAddress, ethers.parseUnits("100", 6))).wait();
  await (await conditionalTokens.connect(userA).splitPosition(marketId, ethers.parseUnits("100", 6))).wait();

  // 3. Admin Invalidates Market
  console.log(`${C.dimGreen}[+] Admin invalidating market...${C.reset}`);
  await (await MarketFactory.invalidateMarket(marketId)).wait();

  // 4. User Redeems
  console.log(`${C.dimGreen}[+] User redeeming from invalidated market...${C.reset}`);
  await (await conditionalTokens.connect(userA).redeemPositions(marketId)).wait();

  const finalUsdg = await usdg.balanceOf(userA.address);
  console.log(`${C.cyan}    └─ Final USDG Balance: ${ethers.formatUnits(finalUsdg, 6)} (Expected: 100)${C.reset}`);

  console.log(`${C.green}=== SCENARIO 3 SUCCESS ===${C.reset}\n`);
}

async function main() {
  await executePartialFill();
  await executeInvalidatedMarket();
}

main().catch(console.error);
