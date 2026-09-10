import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Seeding markets with account:", deployer.address);

  // 1. Get MarketFactory contract
  // Make sure you have deployed MarketFactory and set MARKET_FACTORY_ADDRESS in .env
  const marketFactoryAddress = process.env.MARKET_FACTORY_ADDRESS;
  if (!marketFactoryAddress) {
    throw new Error("MARKET_FACTORY_ADDRESS is missing in .env");
  }

  const marketFactory = await ethers.getContractAt("MarketFactory", marketFactoryAddress);

  // 2. Read markets data from JSON
  const dataPath = path.join(__dirname, "data", "markets.json");
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const markets = JSON.parse(rawData);

  // 3. Backend URL for off-chain sync
  const backendUrl = process.env.API_URL || "http://localhost:8080";

  // Fetch existing markets to avoid duplicates
  console.log("Fetching existing markets from backend...");
  let existingMarkets: any = { markets: [] };
  try {
    const res = await fetch(`${backendUrl}/api/markets`);
    if (res.ok) {
      existingMarkets = await res.json();
    }
  } catch (err) {
    console.warn("Could not fetch existing markets. Proceeding anyway...");
  }
  const existingTitles = new Set(existingMarkets.markets.map((m: any) => m.title));

  for (const market of markets) {
    if (existingTitles.has(market.title)) {
      console.log(`\n⏭️ Skipping Market: "${market.title}" (Already exists)`);
      continue;
    }

    // If close_time is not provided, default to +7 days from now
    const closeTimeUnix = market.close_time || Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    
    console.log(`\nCreating Market: ${market.title}`);
    console.log(`Close Time (Unix): ${closeTimeUnix}`);

    // Create market on-chain
    // Function signature: createMarket(string question, string ipfsHash, uint256 closeTime, address resolver)
    const tx = await marketFactory.createMarket(
      market.title,
      market.ipfs_hash,
      closeTimeUnix,
      deployer.address // Using deployer as resolver for testnet
    );

    console.log(`Waiting for tx: ${tx.hash}...`);
    const receipt = await tx.wait();

    // Extract MarketCreated event
    const iface = marketFactory.interface;
    let marketId = "";

    for (const log of receipt?.logs || []) {
      try {
        const parsedLog = iface.parseLog(log as any);
        if (parsedLog && parsedLog.name === "MarketCreated") {
          marketId = parsedLog.args.marketId.toString();
          break;
        }
      } catch (e) {
        // Ignore logs from other contracts
      }
    }

    if (!marketId) {
      console.error("Failed to extract marketId from event logs. Skipping offchain sync.");
      continue;
    }

    console.log(`Market created on-chain with ID: ${marketId}`);

    // 4. Sync off-chain to Supabase via Backend API
    try {
      // Generate slug from title
      const slug = market.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      const response = await fetch(`${backendUrl}/api/markets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: marketId,
          title: market.title,
          slug: slug,
          description: market.description,
          image_url: market.image_url,
          resolution_rules: market.resolution_rules,
          close_time: closeTimeUnix,
          resolver_address: deployer.address,
          category: market.category || "General"
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error("Failed to sync off-chain:", errData);
      } else {
        console.log(`Successfully synced Market ${marketId} to Supabase!`);
      }
    } catch (error) {
      console.error("Failed to call backend API:", error);
    }
  }

  console.log("\nSeeding complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
