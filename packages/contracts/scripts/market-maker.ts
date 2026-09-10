import { ethers } from "hardhat";

// Deterministic private keys for our 5 bots loaded from .env
const BOT_PRIVATE_KEYS = [
    process.env.PRIVKEY_BOT_A,
    process.env.PRIVKEY_BOT_B,
    process.env.PRIVKEY_BOT_C,
    process.env.PRIVKEY_BOT_D,
    process.env.PRIVKEY_BOT_E
].filter(Boolean) as string[];

const API_URL = process.env.API_URL || "http://localhost:8080";
const MAX_INT = ethers.MaxUint256;

// ANSI Colors for console output
const colors = {
    reset: "\x1b[0m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    magenta: "\x1b[35m",
    red: "\x1b[31m",
    dim: "\x1b[2m"
};

async function main() {
    console.log(`${colors.cyan}==========================================${colors.reset}`);
    console.log(`${colors.cyan}🚀 STARTING ROBINHOOD MARKET MAKER BOTS 🚀${colors.reset}`);
    console.log(`${colors.cyan}==========================================${colors.reset}\n`);

    const [admin] = await ethers.getSigners();
    console.log(`${colors.yellow}Admin Wallet:${colors.reset} ${admin.address}`);

    // Addresses from .env
    const EXCHANGE_ADDRESS = process.env.EXCHANGE_ADDRESS as string; 
    const USDG_ADDRESS = process.env.USDG_ADDRESS as string;
    const CONDITIONAL_TOKENS_ADDRESS = process.env.CONDITIONAL_TOKENS_ADDRESS as string;

    const network = await ethers.provider.getNetwork();
    
    const erc20Abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function mint(address to, uint256 amount) public",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)"
    ];
    const USDG = new ethers.Contract(USDG_ADDRESS, erc20Abi, admin) as any;
    const ConditionalTokens = await ethers.getContractAt("ConditionalTokens", CONDITIONAL_TOKENS_ADDRESS, admin);

    const bots = BOT_PRIVATE_KEYS.map(pk => new ethers.Wallet(pk, ethers.provider));
    console.log(`${colors.yellow}Loaded ${bots.length} Bot Wallets.${colors.reset}\n`);

    // 1. Funding & Approval Phase
    console.log(`${colors.cyan}--- PHASE 1: FUNDING & APPROVALS ---${colors.reset}`);
    for (let i = 0; i < bots.length; i++) {
        const bot = bots[i];
        process.stdout.write(`Bot ${i + 1} (${bot.address}): `);
        
        // Check RH balance
        const rhBalance = await ethers.provider.getBalance(bot.address);
        if (rhBalance < ethers.parseEther("0.0001")) {
            process.stdout.write(`${colors.dim}Funding RH... ${colors.reset}`);
            const tx = await admin.sendTransaction({ to: bot.address, value: ethers.parseEther("0.0005") });
            await tx.wait();
        }

        // Check USDG balance
        const usdgBalance = await USDG.balanceOf(bot.address);
        if (usdgBalance < ethers.parseUnits("500", 6)) {
            process.stdout.write(`${colors.dim}Minting USDG... ${colors.reset}`);
            // Assuming MockUSDG has mint function
            const tx = await USDG.mint(bot.address, ethers.parseUnits("10000", 6));
            await tx.wait();
        }

        // Connect contracts with bot signer
        const botUSDG = USDG.connect(bot);
        const botCT = ConditionalTokens.connect(bot);

        // Check USDG Allowance
        const allowance = await botUSDG.allowance(bot.address, EXCHANGE_ADDRESS);
        if (allowance < ethers.parseUnits("1000", 6)) {
            process.stdout.write(`${colors.dim}Approving USDG... ${colors.reset}`);
            const tx = await botUSDG.approve(EXCHANGE_ADDRESS, MAX_INT);
            await tx.wait();
        }

        // Check CT Approval
        const isApproved = await botCT.isApprovedForAll(bot.address, EXCHANGE_ADDRESS);
        if (!isApproved) {
            process.stdout.write(`${colors.dim}Approving CT... ${colors.reset}`);
            const tx = await botCT.setApprovalForAll(EXCHANGE_ADDRESS, true);
            await tx.wait();
        }

        console.log(`${colors.green}READY${colors.reset}`);
    }

    console.log(`\n${colors.cyan}--- PHASE 2: MARKET MAKING LOOP ---${colors.reset}`);
    
    // 2. Trading Loop
    while (true) {
        try {
            const res = await fetch(`${API_URL}/api/markets`);
            const data = await res.json() as any;
            const markets = data.markets;

            if (!markets || markets.length === 0) {
                console.log(`${colors.red}No active markets found. Retrying in 10s...${colors.reset}`);
                await new Promise(r => setTimeout(r, 10000));
                continue;
            }

            const bot = bots[Math.floor(Math.random() * bots.length)];
            const market = markets[Math.floor(Math.random() * markets.length)];
            const outcome = Math.random() > 0.5 ? 1 : 0;
            const isBuy = Math.random() > 0.3; // 70% buy

            const currentPriceNum = market.currentPrice;
            const priceNum = Math.max(0.01, Math.min(0.99, currentPriceNum + (Math.random() * 0.06 - 0.03)));
            const priceContract = BigInt(Math.floor(priceNum * 1000000));

            const inputNum = Math.floor(Math.random() * 25) + 5;
            let sharesContract: bigint;
            if (isBuy) {
                sharesContract = (BigInt(Math.floor(inputNum * 1000000)) * BigInt(1000000)) / priceContract;
            } else {
                sharesContract = BigInt(inputNum * 1000000);
            }

            const domain = {
                name: "EdgeProtocolExchange",
                version: "1",
                chainId: Number(network.chainId),
                verifyingContract: EXCHANGE_ADDRESS as `0x${string}`
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
                    { name: "expiration", type: "uint256" }
                ]
            };

            const order = {
                maker: bot.address,
                marketId: BigInt(market.id),
                outcome: outcome,
                amount: sharesContract,
                price: priceContract,
                isBuy: isBuy,
                nonce: BigInt(Math.floor(Math.random() * 1000000)),
                expiration: BigInt(Math.floor(Date.now() / 1000) + 3600)
            };

            const signature = await bot.signTypedData(domain, types, order);

            const rawOrderForBackend = {
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
                market_id: market.id,
                wallet_address: bot.address,
                side: outcome === 1 ? 'YES' : 'NO',
                order_type: 'LIMIT',
                amount: Number(ethers.formatUnits(sharesContract, 6)),
                price: priceNum,
                signature: signature,
                rawOrder: rawOrderForBackend
            };

            const postRes = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (postRes.ok) {
                const actionColor = isBuy ? colors.green : colors.red;
                const sideText = outcome === 1 ? 'UP' : 'DOWN';
                console.log(`[${bot.address.slice(0,6)}] ${actionColor}${isBuy ? 'BUY ' : 'SELL'}${colors.reset} ${sideText} | Price: ${priceNum.toFixed(2)} | Shares: ${payload.amount.toFixed(2)} | Market: ${market.title.slice(0, 25)}...`);
            } else {
                const err = await postRes.text();
                console.log(`${colors.red}[Error]${colors.reset} Failed to post order: ${err}`);
            }

            // Wait 2 to 6 seconds
            const waitMs = Math.floor(Math.random() * 4000) + 2000;
            await new Promise(r => setTimeout(r, waitMs));

        } catch (error) {
            console.error(`${colors.red}Loop Error:${colors.reset}`, error);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
