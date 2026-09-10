const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  const domain = {
    name: "EdgeProtocolExchange",
    version: "1",
    chainId: Number(process.env.ROBINHOOD_CHAIN_ID || 46630),
    verifyingContract: process.env.EXCHANGE_ADDRESS
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
  
  const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY);
  
  const order = {
    maker: wallet.address,
    marketId: 11,
    outcome: 1,
    amount: "10000000",
    price: "500000",
    isBuy: true,
    nonce: 12345,
    expiration: Math.floor(Date.now() / 1000) + 3600
  };

  const signature = await wallet.signTypedData(domain, types, order);

  const rawOrder = {
    maker: order.maker,
    marketId: order.marketId.toString(),
    outcome: order.outcome,
    amount: order.amount.toString(),
    price: order.price.toString(),
    isBuy: order.isBuy,
    nonce: order.nonce.toString(),
    expiration: order.expiration.toString()
  };

  const payload = {
    market_id: order.marketId.toString(),
    wallet_address: wallet.address,
    side: "YES",
    order_type: "LIMIT",
    amount: 10,
    price: 0.5,
    signature,
    rawOrder
  };

  console.log("Sending payload...");
  const res = await fetch("http://localhost:8080/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", data);
}

main().catch(console.error);
