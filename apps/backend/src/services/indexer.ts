import { ethers } from 'ethers';
import { supabase } from '../utils/supabase';

// Minimal ABI to listen to OrderMatched
const EXCHANGE_ABI = [
  "event OrderMatched(bytes32 buyOrderHash, bytes32 sellOrderHash, address indexed buyer, address indexed seller, uint256 marketId, uint8 outcome, uint256 amount, uint256 price)"
];

export const startIndexer = () => {
  const rpcUrl = process.env.ROBINHOOD_RPC_URL;
  const exchangeAddress = process.env.EXCHANGE_ADDRESS;
  const network = process.env.NETWORK || 'TESTNET';

  if (!rpcUrl || !exchangeAddress) {
    console.warn("⚠️ [Indexer] Missing ROBINHOOD_RPC_URL or EXCHANGE_ADDRESS. Indexer not started.");
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const exchangeContract = new ethers.Contract(exchangeAddress, EXCHANGE_ABI, provider);

  console.log(`📡 [Indexer] Listening to Exchange at ${exchangeAddress} on ${network}`);

  exchangeContract.on("OrderMatched", async (buyOrderHash, sellOrderHash, buyer, seller, marketIdRaw, outcome, amountRaw, priceRaw, event) => {
    try {
      const marketId = marketIdRaw.toString();
      
      let tradePrice = Number(priceRaw);
      if (tradePrice > 100) {
        tradePrice = tradePrice / 1e6;
      }

      const tradeAmount = Number(ethers.formatUnits(amountRaw, 6)); 
      const txHash = event.log.transactionHash;

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
    } catch (error) {
      console.error(`[Indexer] ❌ Error processing OrderMatched event:`, error);
    }
  });
};
