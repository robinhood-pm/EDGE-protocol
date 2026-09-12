import { ethers } from 'ethers';
import { getStaticProvider } from '../utils/provider';
import * as dotenv from 'dotenv';

dotenv.config();

const MARKET_FACTORY_ABI = [
  "function resolveMarket(uint256 marketId, uint8 winningOutcome) external"
];

export class OracleService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private marketFactoryContract: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.ROBINHOOD_RPC_URL as string;
    const privateKey = process.env.ORACLE_PRIVATE_KEY; // The trusted oracle key
    const factoryAddress = process.env.MARKET_FACTORY_ADDRESS;

    if (!privateKey || !factoryAddress) {
      throw new Error("Missing ORACLE_PRIVATE_KEY or MARKET_FACTORY_ADDRESS in env");
    }

    this.provider = getStaticProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.marketFactoryContract = new ethers.Contract(factoryAddress, MARKET_FACTORY_ABI, this.wallet);
  }

  /**
   * Called by the backend when a real-world event is finalized (e.g., via UMA or an internal cron job).
   * Submits the resolution to the MarketFactory.
   */
  async resolveMarket(marketId: number, winningOutcome: 0 | 1) {
    console.log(`Resolving market ${marketId} with outcome ${winningOutcome}...`);
    try {
      const tx = await this.marketFactoryContract.resolveMarket(marketId, winningOutcome);
      
      console.log(`Resolution transaction submitted! Hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Market ${marketId} successfully resolved in block ${receipt.blockNumber}`);
      
      return receipt;
    } catch (error) {
      console.error("Market resolution failed:", error);
      throw error;
    }
  }
}
