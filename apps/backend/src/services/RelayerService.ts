import { ethers } from 'ethers';
import { getStaticProvider } from '../utils/provider';
import * as dotenv from 'dotenv';

dotenv.config();

const EXCHANGE_ABI = [
  "function matchOrders(tuple(address maker, uint256 marketId, uint8 outcome, uint256 amount, uint256 price, bool isBuy, uint256 nonce, uint256 expiration) buyOrder, bytes buySignature, tuple(address maker, uint256 marketId, uint8 outcome, uint256 amount, uint256 price, bool isBuy, uint256 nonce, uint256 expiration) sellOrder, bytes sellSignature) external"
];

export class RelayerService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private exchangeContract: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.ROBINHOOD_RPC_URL as string;
    const privateKey = process.env.RELAYER_PRIVATE_KEY;
    const exchangeAddress = process.env.EXCHANGE_ADDRESS;

    if (!privateKey || !exchangeAddress) {
      throw new Error("Missing RELAYER_PRIVATE_KEY or EXCHANGE_ADDRESS in env");
    }

    this.provider = getStaticProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.exchangeContract = new ethers.Contract(exchangeAddress, EXCHANGE_ABI, this.wallet);
  }

  /**
   * Called by the backend matching engine when a buy and sell order match.
   * Submits the transaction to the Robinhood Chain.
   */
  async executeMatch(buyOrder: any, buySignature: string, sellOrder: any, sellSignature: string) {
    console.log(`Executing match for market ${buyOrder.marketId}...`);
    try {
      const tx = await this.exchangeContract.matchOrders(
        buyOrder,
        buySignature,
        sellOrder,
        sellSignature
      );
      
      console.log(`Transaction submitted! Hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      return receipt;
    } catch (error) {
      console.error("Match execution failed:", error);
      throw error;
    }
  }
}
