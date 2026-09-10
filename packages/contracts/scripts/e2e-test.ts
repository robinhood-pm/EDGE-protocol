import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as readline from "readline";
dotenv.config();

const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  brightGreen: "\x1b[92m",
  dimGreen: "\x1b[32;2m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  bold: "\x1b[1m",
  blink: "\x1b[5m"
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const typeWriter = async (text: string, delay = 10) => {
  for (let i = 0; i < text.length; i++) {
    process.stdout.write(text.charAt(i));
    await sleep(delay);
  }
  console.log();
};

const rl = readline.createInterface({
  input: process.stdin as any,
  output: process.stdout as any,
  prompt: `${C.brightGreen}╭──[DEV@EDGE-PROTOCOL-E2E]${C.reset}\n${C.brightGreen}╰─❯${C.reset} `
});

const bootSequence = async () => {
  console.log(`${C.green}`);
  console.log(`
  ███████╗██████╗  ██████╗ ███████╗    ██████╗ ██████╗  ██████╗ ████████╗██████╗  ██████╗ ██████╗ ██╗     
  ██╔════╝██╔══██╗██╔════╝ ██╔════╝    ██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██╔══██╗██╔═══██╗██╔══██╗██║     
  █████╗  ██║  ██║██║  ███╗█████╗      ██████╔╝██████╔╝██║   ██║   ██║   ██║  ██║██║      ██║  ██║██║     
  ██╔══╝  ██║  ██║██║   ██║██╔══╝      ██╔═══╝ ██╔══██╗██║   ██║   ██║   ██║  ██║██║   ██║██║  ██║██║     
  ███████╗██████╔╝╚██████╔╝███████╗    ██║     ██║  ██║╚██████╔╝   ██║   ██████╔╝╚██████╔╝██████╔╝███████╗
  ╚══════╝╚═════╝  ╚═════╝ ╚══════╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝
  `);
  console.log(`${C.dimGreen}[+] SECURE UPLINK ESTABLISHED${C.reset}`);
  console.log(`${C.dimGreen}[+] ENCRYPTED CONNECTION TO ROBINHOOD TESTNET... OK${C.reset}`);
  console.log(`${C.dimGreen}[+] AWAITING E2E EXECUTION COMMAND...${C.reset}\n`);
  rl.prompt();
};

async function executeE2E() {
  const [admin] = await ethers.getSigners();
  console.log(`\n${C.cyan}[>] Initializing Admin Wallet: ${C.bold}${admin.address}${C.reset}`);

  const usdgAddress = "0xF47593cac046C3a4C15B495eDAd59DE5868B6BbB";
  const conditionalTokensAddress = "0x9a20Bc35433f999b8feA6fD407D161FB2e725D66";
  const marketFactoryAddress = "0x96c2622e4786b53555C3Ed6eb3ac254cbae52d48";
  const manualAdapterAddress = "0x33F36519bC67D5E09499A904Eb3e5AFC0A30BE4C";
  
  // Minimal ERC20 ABI to check balance
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function mint(address to, uint256 amount) public",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];
  const usdg = new ethers.Contract(usdgAddress, erc20Abi, admin) as any;
  
  const adminUsdgBalance = await usdg.balanceOf(admin.address);
  console.log(`${C.dimGreen}    └─ USDG Balance: ${ethers.formatUnits(adminUsdgBalance, 6)} USDG${C.reset}`);
  
  try {
    process.stdout.write(`${C.yellow}[*] Minting 1000 USDG to Admin... `);
    const tx = await usdg.mint(admin.address, ethers.parseUnits("1000", 6));
    await tx.wait();
    console.log(`${C.green}SUCCESS${C.reset}`);
  } catch (e: any) {
    console.log(`${C.red}FAILED${C.reset}`);
  }

  // 1. Create a Market
  const MarketFactory = await ethers.getContractAt("MarketFactory", marketFactoryAddress, admin);
  const question = "Will BTC hit 100k by 2026? " + Date.now();
  const ipfsHash = "QmTestHash12345";
  const closeTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  console.log(`\n${C.yellow}[1] PHASE 1: MARKET CREATION${C.reset}`);
  process.stdout.write(`${C.dimGreen}    └─ Sending TX to MarketFactory... `);
  const createTx = await MarketFactory.createMarket(question, ipfsHash, closeTime, admin.address);
  const createReceipt = await createTx.wait();
  if (!createReceipt) {
    throw new Error("Transaction failed or receipt is null");
  }
  console.log(`${C.green}SUCCESS${C.reset}`);
  console.log(`${C.dimGreen}    └─ TX Hash:   ${createReceipt.hash}${C.reset}`);

  // Retrieve Market ID from Event
  const marketCreatedEvent = createReceipt.logs.find((log: any) => {
    try {
      const parsed = MarketFactory.interface.parseLog(log);
      return parsed && parsed.name === 'MarketCreated';
    } catch { return false; }
  });
  
  if (!marketCreatedEvent) {
    throw new Error("MarketCreated event not found!");
  }
  const parsedEvent = MarketFactory.interface.parseLog(marketCreatedEvent);
  const marketId = parsedEvent?.args[0];
  console.log(`${C.brightGreen}    └─ Market ID: ${marketId}${C.reset}`);

  // 2. Setup Test Users
  console.log(`\n${C.yellow}[2] PHASE 2: GENERATING TRADER ACCOUNTS${C.reset}`);
  const userA = ethers.Wallet.createRandom().connect(ethers.provider);
  const userB = ethers.Wallet.createRandom().connect(ethers.provider);
  console.log(`${C.cyan}[>] User A generated: ${C.bold}${userA.address}${C.reset}`);
  console.log(`${C.cyan}[>] User B generated: ${C.bold}${userB.address}${C.reset}`);

  // Send RH for gas
  process.stdout.write(`${C.dimGreen}    └─ Injecting RH Gas... `);
  await (await admin.sendTransaction({ to: userA.address, value: ethers.parseEther("0.00005") })).wait();
  await (await admin.sendTransaction({ to: userB.address, value: ethers.parseEther("0.00005") })).wait();
  console.log(`${C.green}SUCCESS${C.reset}`);

  // Transfer USDG to Users (assuming admin has some)
  process.stdout.write(`${C.dimGreen}    └─ Injecting 100 USDG capital... `);
  const usdgAmount = ethers.parseUnits("100", 6);
  // Transfer ABI
  const usdgTransferAbi = ["function transfer(address to, uint256 amount) returns (bool)"];
  const usdgTransfer = new ethers.Contract(usdgAddress, usdgTransferAbi, admin);
  await (await usdgTransfer.transfer(userA.address, usdgAmount)).wait();
  await (await usdgTransfer.transfer(userB.address, usdgAmount)).wait();
  console.log(`${C.green}SUCCESS${C.reset}`);

  // Verify Balances
  const balA = await usdg.balanceOf(userA.address);
  const balB = await usdg.balanceOf(userB.address);
  console.log(`${C.dimGreen}    └─ User A Balance: ${ethers.formatUnits(balA, 6)} USDG${C.reset}`);
  console.log(`${C.dimGreen}    └─ User B Balance: ${ethers.formatUnits(balB, 6)} USDG${C.reset}`);

  // 3. Position Splitting
  console.log(`\n${C.yellow}[3] PHASE 3: POSITION SPLITTING (USER A)${C.reset}`);
  const conditionalTokens = await ethers.getContractAt("ConditionalTokens", conditionalTokensAddress, userA);
  
  process.stdout.write(`${C.dimGreen}    └─ User A approving USDG for ConditionalTokens... `);
  await (await usdg.connect(userA).approve(conditionalTokensAddress, ethers.parseUnits("50", 6))).wait();
  console.log(`${C.green}SUCCESS${C.reset}`);
  
  process.stdout.write(`${C.dimGreen}    └─ User A splitting 50 USDG into YES & NO tokens... `);
  await (await conditionalTokens.splitPosition(marketId, ethers.parseUnits("50", 6))).wait();
  console.log(`${C.green}SUCCESS${C.reset}`);
  
  const yesTokenId = (BigInt(marketId) << 1n) | 1n;
  const noTokenId = (BigInt(marketId) << 1n) | 0n;
  const userAYesBalance = await conditionalTokens.balanceOf(userA.address, yesTokenId);
  const userANoBalance = await conditionalTokens.balanceOf(userA.address, noTokenId);
  console.log(`${C.cyan}    [>] User A YES Tokens: ${ethers.formatUnits(userAYesBalance, 6)}${C.reset}`);
  console.log(`${C.cyan}    [>] User A NO Tokens:  ${ethers.formatUnits(userANoBalance, 6)}${C.reset}`);

  // 4. Order Creation and Matching
  console.log(`\n${C.yellow}[4] PHASE 4: OFF-CHAIN ORDER MATCHING (EXCHANGE)${C.reset}`);
  const exchangeAddress = "0x86EbB3f3feC769f3a7DD6CC215fe39A10bf5027E";
  const Exchange = await ethers.getContractAt("Exchange", exchangeAddress, admin);

  process.stdout.write(`${C.dimGreen}    └─ User A approving Exchange to move ConditionalTokens... `);
  await (await conditionalTokens.setApprovalForAll(exchangeAddress, true)).wait();
  console.log(`${C.green}SUCCESS${C.reset}`);

  process.stdout.write(`${C.dimGreen}    └─ User B approving USDG for Exchange... `);
  await (await usdg.connect(userB).approve(exchangeAddress, ethers.parseUnits("30", 6))).wait();
  console.log(`${C.green}SUCCESS${C.reset}`);

  const domain = {
    name: "EdgeProtocolExchange",
    version: "1",
    chainId: Number((await ethers.provider.getNetwork()).chainId), // Dynamic Chain ID
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

  // User A Sells 10 NO tokens for 4 USDG (0.4 USDG/token)
  const sellOrder = {
    maker: userA.address,
    marketId: marketId,
    outcome: 0,
    amount: ethers.parseUnits("10", 6), // 10 shares
    price: ethers.parseUnits("4", 6), // 4 USDG total for 10 shares
    isBuy: false,
    nonce: Math.floor(Math.random() * 1000000),
    expiration: Math.floor(Date.now() / 1000) + 3600
  };
  process.stdout.write(`${C.dimGreen}    └─ User A signing Sell Order (10 NO @ 4 USDG)... `);
  const sellSignature = await userA.signTypedData(domain, types, sellOrder);
  console.log(`${C.green}SIGNED${C.reset}`);

  // User B Buys 10 NO tokens for 4 USDG
  const buyOrder = {
    maker: userB.address,
    marketId: marketId,
    outcome: 0,
    amount: ethers.parseUnits("10", 6),
    price: ethers.parseUnits("4", 6),
    isBuy: true,
    nonce: Math.floor(Math.random() * 1000000),
    expiration: Math.floor(Date.now() / 1000) + 3600
  };
  process.stdout.write(`${C.dimGreen}    └─ User B signing Buy Order (10 NO @ 4 USDG)... `);
  const buySignature = await userB.signTypedData(domain, types, buyOrder);
  console.log(`${C.green}SIGNED${C.reset}`);

  process.stdout.write(`${C.yellow}[*] Admin Relayer matching orders on-chain... `);
  await (await Exchange.matchOrders(buyOrder, buySignature, sellOrder, sellSignature)).wait();
  console.log(`${C.green}MATCHED!${C.reset}`);

  const userBNoBalance = await conditionalTokens.balanceOf(userB.address, noTokenId);
  console.log(`${C.cyan}    [>] User B NO Tokens after match:  ${ethers.formatUnits(userBNoBalance, 6)}${C.reset}`);

  // 5. Resolution
  console.log(`\n${C.yellow}[5] PHASE 5: MARKET RESOLUTION${C.reset}`);
  process.stdout.write(`${C.dimGreen}    └─ Admin closing and resolving Market to NO (0)... `);
  await (await MarketFactory.closeMarket(marketId)).wait();
  await (await MarketFactory.resolveMarket(marketId, 0)).wait();
  console.log(`${C.green}RESOLVED${C.reset}`);

  // 6. Redemption
  console.log(`\n${C.yellow}[6] PHASE 6: REDEEM WINNINGS (USER B)${C.reset}`);
  process.stdout.write(`${C.dimGreen}    └─ User B redeeming 10 winning NO tokens for USDG... `);
  await (await conditionalTokens.connect(userB).redeemPositions(marketId)).wait();
  console.log(`${C.green}REDEEMED${C.reset}`);
  
  const finalBalB = await usdg.balanceOf(userB.address);
  console.log(`${C.cyan}    [>] User B Final USDG Balance: ${ethers.formatUnits(finalBalB, 6)}${C.reset} (Expected: 100 - 4 + 10 = 106)`);

  console.log(`\n${C.green}=========================================${C.reset}`);
  await typeWriter(`${C.blink}${C.bold}${C.green} [E2E SCENARIO FULLY COMPLETED]${C.reset}`, 15);
  console.log(`${C.green}=========================================${C.reset}\n`);
  
  rl.prompt();
}

async function main() {
  console.clear();
  await bootSequence();
  
  rl.on('line', async (line) => {
    const cmd = line.trim();
    if (cmd === 'start e2e' || cmd === 'run e2e') {
      console.log(`\n${C.yellow}[*] INITIATING PROTOCOL OVERRIDE...${C.reset}`);
      await executeE2E();
    } else if (cmd === 'exit' || cmd === 'clear') {
      if (cmd === 'clear') {
        console.clear();
        bootSequence();
      } else {
        console.log(`${C.red}Terminating connection...${C.reset}`);
        process.exit(0);
      }
    } else if (cmd !== '') {
      console.log(`${C.red}zsh: command not found: ${cmd.split(' ')[0]}${C.reset}`);
      rl.prompt();
    } else {
      rl.prompt();
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
