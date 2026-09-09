import { Request, Response } from 'express';
import { supabase } from '../utils/supabase';
// import { verifyMessage } from 'ethers'; // Used for verifying EIP-712 signature in production

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { market_id, wallet_address, side, order_type, amount, price, signature } = req.body;

    // TODO: Verify EIP-712 Signature using ethers.js
    // const signerAddress = verifyMessage(...);
    // if (signerAddress.toLowerCase() !== wallet_address.toLowerCase()) {
    //   return res.status(401).json({ error: "Invalid signature" });
    // }

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          market_id,
          wallet_address,
          side,
          order_type,
          amount,
          price,
          signature,
          status: 'PENDING'
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Trigger order matching engine (offchain CLOB matching) here...

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
