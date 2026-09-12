import { ethers } from 'ethers';
import { supabase } from '../utils/supabase';
import { getStaticProvider, safeAddress } from '../utils/provider';
import { updateUserTradeStats } from './userService';

// Minimal ABI to listen to OrderMatched
const EXCHANGE_ABI = [
  "event OrderMatched(bytes32 buyOrderHash, bytes32 sellOrderHash, address indexed buyer, address indexed seller, uint256 marketId, uint8 outcome, uint256 amount, uint256 price)"
];

const PERP_EXCHANGE_ABI = [
  "event PerpOrderMatched(address indexed longTrader, address indexed shortTrader, uint256 marketId, uint256 size, uint256 price)"
];

export const startIndexer = () => {
  const rpcUrl = process.env.ROBINHOOD_RPC_URL || process.env.RPC_URL;
  const exchangeAddress = process.env.EXCHANGE_ADDRESS;
  const perpExchangeAddress = process.env.PERP_EXCHANGE_ADDRESS;
  const network = process.env.NETWORK || 'testnet';

  if (!rpcUrl || !exchangeAddress) {
    console.warn("⚠️ [Indexer] Missing ROBINHOOD_RPC_URL or EXCHANGE_ADDRESS. Indexer not started.");
    return;
  }

  const provider = getStaticProvider(rpcUrl);
  const exchangeContract = new ethers.Contract(safeAddress(exchangeAddress), EXCHANGE_ABI, provider);
  const perpExchangeContract = perpExchangeAddress ? new ethers.Contract(safeAddress(perpExchangeAddress), PERP_EXCHANGE_ABI, provider) : null;

  console.log(`📡 [Indexer] Starting stateless block poll indexer on ${network}`);

  let lastProcessedBlock: number | null = null;
  let isPolling = false;

  const pollBlocks = async () => {
    if (isPolling) return;
    isPolling = true;

    try {
      const currentBlock = await provider.getBlockNumber();
      if (lastProcessedBlock === null) {
        lastProcessedBlock = Math.max(0, currentBlock - 5);
      }

      if (currentBlock <= lastProcessedBlock) {
        isPolling = false;
        return;
      }

      const fromBlock = lastProcessedBlock + 1;
      // Cap at maximum 10 blocks (fromBlock to fromBlock + 9) for Alchemy Free Tier limits
      const toBlock = Math.min(currentBlock, fromBlock + 9);

      // 1. Process Spot Exchange OrderMatched events
      try {
        const spotEvents = await exchangeContract.queryFilter("OrderMatched", fromBlock, toBlock);
        for (const event of spotEvents) {
          if (!('args' in event)) continue;
          const [buyOrderHash, sellOrderHash, buyer, seller, marketIdRaw, outcome, amountRaw, priceRaw] = event.args;
          const marketId = marketIdRaw.toString();
          
          let tradePrice = Number(priceRaw);
          if (tradePrice > 100) {
            tradePrice = tradePrice / 1e6;
          }

          const tradeAmount = Number(ethers.formatUnits(amountRaw, 6)); 
          const txHash = event.transactionHash;

          console.log(`[Indexer] 🟢 OrderMatched caught! Market: ${marketId}, Buyer: ${buyer}, Seller: ${seller}, Price: ${tradePrice}¢, Amount: ${tradeAmount}`);

          const { error: insertError } = await supabase.from('trades').insert({
            network,
            market_id: marketId,
            price: tradePrice / 100,
            amount: tradeAmount,
            buyer_address: buyer,
            seller_address: seller,
            transaction_hash: txHash,
          });

          if (insertError) {
            console.error(`[Indexer] Error inserting trade:`, insertError.message);
          }

          const tradeVolume = (tradePrice / 100) * tradeAmount;
          const isYes = Number(outcome) === 1;
          const newYesProbability = isYes ? tradePrice : (100 - tradePrice);

          try {
            await supabase.rpc('increment_volume', { market_id_param: marketId, network_param: network, volume_delta: tradeVolume });
          } catch (err) {
            const { data: m } = await supabase.from('markets').select('total_volume_usdg').eq('id', marketId).eq('network', network).single();
            if (m) {
              await supabase.from('markets')
                .update({ 
                  total_volume_usdg: Number(m.total_volume_usdg) + tradeVolume, 
                  current_yes_probability: newYesProbability 
                })
                .eq('id', marketId)
                .eq('network', network);
            }
          }

          console.log(`[Indexer] ✅ Successfully updated DB for trade in Market ${marketId}`);
          updateUserTradeStats(buyer, network);
          updateUserTradeStats(seller, network);
        }
      } catch (spotErr) {
        console.error(`[Indexer] Error querying OrderMatched events:`, spotErr);
      }

      // 2. Process Perp Exchange PerpOrderMatched events
      if (perpExchangeContract) {
        try {
          const perpEvents = await perpExchangeContract.queryFilter("PerpOrderMatched", fromBlock, toBlock);
          for (const event of perpEvents) {
            if (!('args' in event)) continue;
            const [longTrader, shortTrader, marketIdRaw, sizeRaw, priceRaw] = event.args;
            const marketId = marketIdRaw.toString();
            const size = Number(ethers.formatUnits(sizeRaw, 18));
            const price = Number(ethers.formatUnits(priceRaw, 18));

            console.log(`[Indexer] 🟣 PerpOrderMatched! Market: ${marketId}, Long: ${longTrader}, Short: ${shortTrader}, Price: ${price}, Size: ${size}`);
          }
        } catch (perpErr) {
          console.error(`[Indexer] Error querying PerpOrderMatched events:`, perpErr);
        }
      }

      lastProcessedBlock = toBlock;
    } catch (pollErr) {
      console.error(`[Indexer] Error during block poll:`, pollErr);
    } finally {
      isPolling = false;
    }
  };

  // Poll every 5 seconds without stateful RPC filters
  setInterval(pollBlocks, 5000);
  pollBlocks();
};
