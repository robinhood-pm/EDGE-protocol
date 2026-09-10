import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { verifyTypedData } from 'ethers';
import * as dotenv from 'dotenv';
import { matchOrdersAsync } from '../services/matchingEngine';
dotenv.config();

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { market_id, wallet_address, side, order_type, amount, price, signature, rawOrder } = req.body;

    if (!signature || !rawOrder) {
      return res.status(400).json({ error: "Missing signature or rawOrder" });
    }

    const domain = {
      name: "EdgeProtocolExchange",
      version: "1",
      chainId: Number(process.env.ROBINHOOD_CHAIN_ID),
      verifyingContract: process.env.EXCHANGE_ADDRESS as string
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

    // Verify EIP-712 Signature
    const signerAddress = verifyTypedData(domain, types, rawOrder, signature);
    
    if (signerAddress.toLowerCase() !== wallet_address.toLowerCase()) {
      return res.status(401).json({ error: "Invalid cryptographic signature. Signer mismatch." });
    }

    const network = process.env.NETWORK || 'TESTNET';

    // Upsert user to prevent foreign key constraint violation
    await supabase
      .from('users')
      .upsert({ wallet_address, network }, { onConflict: 'wallet_address, network' });

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          market_id,
          network: process.env.NETWORK || 'TESTNET',
          wallet_address,
          side,
          order_type,
          amount,
          price,
          signature,
          raw_order: rawOrder,
          status: 'PENDING'
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Trigger order matching engine asynchronously
    setTimeout(() => {
        matchOrdersAsync(market_id, process.env.NETWORK || 'TESTNET');
    }, 0);

    res.status(201).json({ order: data[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // In production, we should require a signature to cancel

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'CANCELLED' })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Order cancelled', order: data[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMarketOrders = async (req: Request, res: Response) => {
  try {
    const { marketId } = req.params;
    const network = process.env.NETWORK || 'TESTNET';

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('market_id', marketId)
      .eq('network', network)
      .in('status', ['PENDING', 'PARTIALLY_FILLED'])
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ orders: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
