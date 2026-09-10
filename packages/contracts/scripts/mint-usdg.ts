import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const usdgAddress = process.env.USDG_ADDRESS;
  if (!usdgAddress) throw new Error("USDG_ADDRESS not found in .env");

  // Get the address from env variable MINT_TO
  const targetAddress = process.env.MINT_TO;
  
  if (!targetAddress || !targetAddress.startsWith("0x")) {
    console.error("Please provide a valid wallet address using the MINT_TO environment variable.");
    console.error("Usage: MINT_TO=0xYourWalletAddress npx hardhat run scripts/mint-usdg.ts --network robinhoodTestnet");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Using deployer: ${deployer.address}`);

  const erc20Abi = [
    "function mint(address to, uint256 amount) public",
    "function balanceOf(address owner) view returns (uint256)"
  ];

  const usdg = new ethers.Contract(usdgAddress, erc20Abi, deployer);

  const amount = ethers.parseUnits("1000", 6); // Mint 1,000 USDG

  console.log(`Minting 1000 USDG to ${targetAddress}...`);
  const tx = await usdg.mint(targetAddress, amount);
  await tx.wait();

  const newBalance = await usdg.balanceOf(targetAddress);
  console.log(`Success! New balance: ${ethers.formatUnits(newBalance, 6)} USDG`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
