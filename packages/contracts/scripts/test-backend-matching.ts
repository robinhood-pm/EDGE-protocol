import hre, { ethers } from "hardhat";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function main() {
  console.log("=== Testing Backend Matching Engine (YES vs NO) ===");

  const [admin] = await ethers.getSigners();
  const userA = ethers.Wallet.createRandom().connect(ethers.provider);
  const userB = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log(`User A (YES Buyer): ${userA.address}`);
  console.log(`User B (NO Buyer / YES Seller) : ${userB.address}`);

  // Inject gas
  await (await admin.sendTransaction({ to: userA.address, value: ethers.parseEther("0.0001") })).wait();
  await (await admin.sendTransaction({ to: userB.address, value: ethers.parseEther("0.0001") })).wait();

  // Inject USDG
  const usdgAddress = process.env.USDG_ADDRESS;
  if (!usdgAddress) throw new Error("USDG_ADDRESS not found in .env");
  const usdg = await ethers.getContractAt("IERC20", usdgAddress, admin);
  await (await usdg.transfer(userA.address, ethers.parseUnits("100", 6))).wait();
  await (await usdg.transfer(userB.address, ethers.parseUnits("100", 6))).wait();

  // Fetch a market
  const marketsRes = await fetch(`${API_URL}/api/markets`);
  const marketsJson = await marketsRes.json() as any;
  const markets = marketsJson.markets;
  if (!markets || markets.length === 0) throw new Error("No markets found");
  const market = markets[0];
  console.log(`Testing on Market: ${market.id} (${market.title})`);

  const exchangeAddress = process.env.EXCHANGE_ADDRESS;
  const conditionalTokensAddress = process.env.CONDITIONAL_TOKENS_ADDRESS;
  if (!exchangeAddress || !conditionalTokensAddress) throw new Error("EXCHANGE_ADDRESS or CONDITIONAL_TOKENS_ADDRESS not found in .env");

  // User B splits position so they can sell YES tokens
  console.log("User B splitting position...");
  const ctB = await ethers.getContractAt("ConditionalTokens", conditionalTokensAddress, userB);
  const usdgB = await ethers.getContractAt("IERC20", usdgAddress, userB);
  await (await usdgB.approve(conditionalTokensAddress, ethers.parseUnits("10", 6))).wait();
  await (await ctB.splitPosition(market.id, ethers.parseUnits("10", 6))).wait();
  
  // Both approve Exchange
  console.log("Approving exchange...");
  const usdgA = await ethers.getContractAt("IERC20", usdgAddress, userA);
  await (await usdgA.approve(exchangeAddress, ethers.parseUnits("100", 6))).wait();
  await (await ctB.setApprovalForAll(exchangeAddress, true)).wait();

  const chainId = hre.network.config.chainId || 46630;
  const domain = { name: "EdgeProtocolExchange", version: "1", chainId, verifyingContract: exchangeAddress };
  const types = { Order: [
    { name: "maker", type: "address" }, { name: "marketId", type: "uint256" },
    { name: "outcome", type: "uint8" }, { name: "amount", type: "uint256" },
    { name: "price", type: "uint256" }, { name: "isBuy", type: "bool" },
    { name: "nonce", type: "uint256" }, { name: "expiration", type: "uint256" },
  ]};

  const yesOrder = {
    maker: userA.address, marketId: market.id, outcome: 1,
    amount: ethers.parseUnits("10", 6).toString(), price: ethers.parseUnits("0.6", 6).toString(),
    isBuy: true, nonce: Math.floor(Math.random() * 1000000), expiration: Math.floor(Date.now() / 1000) + 3600
  };
  const yesSignature = await userA.signTypedData(domain, types, yesOrder);

  console.log("Submitting YES Buy...");
  const resA = await fetch(`${API_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ market_id: market.id, side: 'YES', order_type: 'LIMIT', amount: 10, price: 60, wallet_address: userA.address, signature: yesSignature, rawOrder: yesOrder })
  });

  const noOrder = {
    maker: userB.address, marketId: market.id, outcome: 1, // Selling YES!
    amount: ethers.parseUnits("10", 6).toString(), price: ethers.parseUnits("0.4", 6).toString(),
    isBuy: false, nonce: Math.floor(Math.random() * 1000000), expiration: Math.floor(Date.now() / 1000) + 3600
  };
  const noSignature = await userB.signTypedData(domain, types, noOrder);

  console.log("Submitting NO Buy (YES Sell)...");
  const resB = await fetch(`${API_URL}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ market_id: market.id, side: 'NO', order_type: 'LIMIT', amount: 10, price: 40, wallet_address: userB.address, signature: noSignature, rawOrder: noOrder })
  });

  console.log("Waiting 3 seconds for match...");
  await new Promise(r => setTimeout(r, 3000));

  const tradesRes = await fetch(`${API_URL}/api/markets/${market.id}/trades`);
  const tradesData = await tradesRes.json() as any;
  if (tradesData.trades && tradesData.trades.length > 0) {
    console.log("✅ Match successful! Trades recorded:", tradesData.trades.length);
  } else {
    console.log("❌ Match failed or pending.");
  }
}
main().catch(console.error);
