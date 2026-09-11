import { ethers } from "hardhat";

/**
 * Fund Perp Bots Script
 * 
 * This script:
 * 1. Sends RH testnet gas to each bot wallet (if low)
 * 2. Mints USDG testnet tokens to each bot wallet (if low)
 * 3. Approves MarginVault to spend USDG
 * 4. Deposits USDG into MarginVault for each bot
 * 5. Also funds the Relayer wallet (used by matching engine as AMM counter-party)
 */

const BOT_PRIVATE_KEYS = [
    process.env.PRIVKEY_BOT_A,
    process.env.PRIVKEY_BOT_B,
    process.env.PRIVKEY_BOT_C,
    process.env.PRIVKEY_BOT_D,
    process.env.PRIVKEY_BOT_E
].filter(Boolean) as string[];

// Relayer is also used as AMM counter-party in matching engine
const RELAYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY!;

const USDG_ADDRESS = process.env.USDG_ADDRESS!;
const MARGIN_VAULT_ADDRESS = process.env.MARGIN_VAULT_ADDRESS!;

const USDG_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function mint(address to, uint256 amount) public",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

const MARGIN_VAULT_ABI = [
    "function deposit(uint256 amount) external",
    "function availableMargin(address trader) view returns (uint256)",
    "function reservedMargin(address trader) view returns (uint256)",
    "function getBalance(address trader) view returns (uint256)"
];

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
    console.log(`${colors.cyan}================================================${colors.reset}`);
    console.log(`${colors.cyan}🏦 FUNDING PERP BOT WALLETS & MARGIN VAULT 🏦${colors.reset}`);
    console.log(`${colors.cyan}================================================${colors.reset}\n`);

    if (!USDG_ADDRESS) throw new Error("Missing USDG_ADDRESS in .env");
    if (!MARGIN_VAULT_ADDRESS) throw new Error("Missing MARGIN_VAULT_ADDRESS in .env");

    const [admin] = await ethers.getSigners();
    console.log(`${colors.yellow}Admin/Deployer:${colors.reset} ${admin.address}`);
    console.log(`${colors.yellow}USDG:${colors.reset} ${USDG_ADDRESS}`);
    console.log(`${colors.yellow}MarginVault:${colors.reset} ${MARGIN_VAULT_ADDRESS}\n`);

    const USDG = new ethers.Contract(USDG_ADDRESS, USDG_ABI, admin);
    const MarginVault = new ethers.Contract(MARGIN_VAULT_ADDRESS, MARGIN_VAULT_ABI, admin);

    // Detect USDG decimals
    let decimals = 6;
    try {
        decimals = Number(await USDG.decimals());
    } catch {
        console.log(`${colors.dim}Could not read decimals, defaulting to 6${colors.reset}`);
    }
    console.log(`${colors.dim}USDG decimals: ${decimals}${colors.reset}\n`);

    const MINT_AMOUNT = ethers.parseUnits("100000", decimals);   // 100,000 USDG each
    const DEPOSIT_AMOUNT = ethers.parseUnits("5000", decimals);  // 5,000 USDG deposit to vault
    const MIN_USDG = ethers.parseUnits("1000", decimals);
    const MIN_RH = ethers.parseEther("0.0001");
    const FUND_RH = ethers.parseEther("0.001");

    // Collect all wallets: bots + relayer
    const botWallets = BOT_PRIVATE_KEYS.map(pk => new ethers.Wallet(pk, ethers.provider));
    const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, ethers.provider);
    
    // Add relayer to list  
    const allWallets = [...botWallets, relayerWallet];
    const walletLabels = [...botWallets.map((_, i) => `Bot ${String.fromCharCode(65 + i)}`), "Relayer"];

    console.log(`${colors.cyan}--- PHASE 1: FUND GAS (RH Testnet) ---${colors.reset}`);
    for (let i = 0; i < allWallets.length; i++) {
        const wallet = allWallets[i];
        const label = walletLabels[i];
        const rhBalance = await ethers.provider.getBalance(wallet.address);
        
        if (rhBalance < MIN_RH) {
            console.log(`  ${label} (${wallet.address}): ${colors.dim}Low RH balance (${ethers.formatEther(rhBalance)}), funding...${colors.reset}`);
            const tx = await admin.sendTransaction({ to: wallet.address, value: FUND_RH });
            await tx.wait();
            console.log(`  ${colors.green}✅ Funded ${ethers.formatEther(FUND_RH)} RH${colors.reset}`);
        } else {
            console.log(`  ${label}: ${colors.green}✅ RH OK (${ethers.formatEther(rhBalance)})${colors.reset}`);
        }
    }

    console.log(`\n${colors.cyan}--- PHASE 2: MINT USDG ---${colors.reset}`);
    for (let i = 0; i < allWallets.length; i++) {
        const wallet = allWallets[i];
        const label = walletLabels[i];
        const usdgBalance = await USDG.balanceOf(wallet.address);
        
        if (usdgBalance < MIN_USDG) {
            console.log(`  ${label} (${wallet.address}): ${colors.dim}Low USDG (${ethers.formatUnits(usdgBalance, decimals)}), minting...${colors.reset}`);
            const tx = await USDG.mint(wallet.address, MINT_AMOUNT);
            await tx.wait();
            const newBal = await USDG.balanceOf(wallet.address);
            console.log(`  ${colors.green}✅ Minted! New balance: ${ethers.formatUnits(newBal, decimals)} USDG${colors.reset}`);
        } else {
            console.log(`  ${label}: ${colors.green}✅ USDG OK (${ethers.formatUnits(usdgBalance, decimals)})${colors.reset}`);
        }
    }

    console.log(`\n${colors.cyan}--- PHASE 3: APPROVE & DEPOSIT TO MARGIN VAULT ---${colors.reset}`);
    for (let i = 0; i < allWallets.length; i++) {
        const wallet = allWallets[i];
        const label = walletLabels[i];
        
        // Check current vault balance
        const vaultBalance = await MarginVault.availableMargin(wallet.address);
        
        if (vaultBalance < MIN_USDG) {
            console.log(`  ${label} (${wallet.address}): ${colors.dim}Low vault margin (${ethers.formatUnits(vaultBalance, decimals)}), depositing...${colors.reset}`);
            
            // Connect USDG with bot signer for approve
            const botUSDG = USDG.connect(wallet) as any;
            const botVault = MarginVault.connect(wallet) as any;

            // Check allowance
            const currentAllowance = await USDG.allowance(wallet.address, MARGIN_VAULT_ADDRESS);
            if (currentAllowance < DEPOSIT_AMOUNT) {
                console.log(`    ${colors.dim}Approving MarginVault to spend USDG...${colors.reset}`);
                const approveTx = await botUSDG.approve(MARGIN_VAULT_ADDRESS, ethers.MaxUint256);
                await approveTx.wait();
                console.log(`    ${colors.green}✅ Approved${colors.reset}`);
            }

            // Deposit
            console.log(`    ${colors.dim}Depositing ${ethers.formatUnits(DEPOSIT_AMOUNT, decimals)} USDG to MarginVault...${colors.reset}`);
            const depositTx = await botVault.deposit(DEPOSIT_AMOUNT);
            await depositTx.wait();
            
            const newVaultBal = await MarginVault.availableMargin(wallet.address);
            console.log(`    ${colors.green}✅ Deposited! Vault balance: ${ethers.formatUnits(newVaultBal, decimals)} USDG${colors.reset}`);
        } else {
            console.log(`  ${label}: ${colors.green}✅ Vault OK (${ethers.formatUnits(vaultBalance, decimals)} USDG)${colors.reset}`);
        }
    }

    // Final Summary
    console.log(`\n${colors.cyan}--- SUMMARY ---${colors.reset}`);
    for (let i = 0; i < allWallets.length; i++) {
        const wallet = allWallets[i];
        const label = walletLabels[i];
        const rhBal = await ethers.provider.getBalance(wallet.address);
        const usdgBal = await USDG.balanceOf(wallet.address);
        const vaultBal = await MarginVault.availableMargin(wallet.address);
        const reservedBal = await MarginVault.reservedMargin(wallet.address);
        
        console.log(`  ${colors.magenta}${label}${colors.reset} (${wallet.address}):`);
        console.log(`    RH Gas:          ${ethers.formatEther(rhBal)}`);
        console.log(`    USDG Wallet:     ${ethers.formatUnits(usdgBal, decimals)}`);
        console.log(`    Vault Available: ${ethers.formatUnits(vaultBal, decimals)}`);
        console.log(`    Vault Reserved:  ${ethers.formatUnits(reservedBal, decimals)}`);
    }

    console.log(`\n${colors.green}✅ All bots are funded and ready for perp trading!${colors.reset}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
