import { supabase } from '../utils/supabase';
import { ethers } from 'ethers';

/**
 * Calculates the Initial Margin Requirement (IMR) for a given size and mark price.
 * IMR = Size * MarkPrice * InitialMarginRate / Leverage
 * (Assuming size is in the asset amount, not notionally scaled unless specified)
 * For probability perps, Max payout is $1 per contract.
 * Therefore, Notional Value = Size * Mark Price.
 */
export const calculateInitialMargin = (
    size: number,
    price: number,
    leverage: number,
    initialMarginRate: number
): number => {
    // For testnet probability perps, margin required = (Size * Price * IMR_rate) / Leverage
    return (size * price * initialMarginRate) / leverage;
};

/**
 * Calculates the Maintenance Margin Requirement (MMR) for a position.
 * MMR = Size * MarkPrice * MaintenanceMarginRate
 */
export const calculateMaintenanceMargin = (
    size: number,
    markPrice: number,
    maintenanceMarginRate: number
): number => {
    return size * markPrice * maintenanceMarginRate;
};

/**
 * Validates if a new order meets the margin requirements before entering the orderbook.
 */
export const validateOrderMargin = async (
    marketId: string,
    network: string,
    trader: string,
    size: number,
    price: number,
    marginProvided: number,
    leverage: number
): Promise<{ valid: boolean; reason?: string }> => {
    try {
        // Fetch market parameters
        const { data: market, error } = await supabase
            .from('perp_markets')
            .select('initial_margin_rate, max_leverage')
            .eq('id', marketId)
            .eq('network', network)
            .single();

        if (error || !market) return { valid: false, reason: 'Market not found' };

        if (leverage > Number(market.max_leverage)) {
            return { valid: false, reason: `Leverage exceeds maximum allowed (${market.max_leverage}x)` };
        }

        const requiredMargin = calculateInitialMargin(
            size,
            price,
            leverage,
            Number(market.initial_margin_rate)
        );

        if (marginProvided < requiredMargin) {
            return { valid: false, reason: `Insufficient margin. Required: ${requiredMargin.toFixed(4)}, Provided: ${marginProvided.toFixed(4)}` };
        }

        // Additional check: Does the user have enough free margin in MarginVault?
        // Since MarginVault is an on-chain contract, we'd theoretically check `marginVault.getFreeMargin(trader)`
        // For the backend engine, if the transaction reverts on-chain it's fine, but off-chain we just verify the math.

        return { valid: true };
    } catch (e) {
        console.error(`[Margin Engine] Error validating order:`, e);
        return { valid: false, reason: 'Internal error validating margin' };
    }
};

/**
 * Calculates the exact Equity and Unrealized PnL of a position at the current Mark Price.
 */
export const calculatePositionEquity = (
    side: 'LONG' | 'SHORT',
    size: number,
    entryPrice: number,
    markPrice: number,
    margin: number,
    fundingAccrued: number
): { equity: number; unrealizedPnL: number } => {
    
    let unrealizedPnL = 0;
    if (side === 'LONG') {
        unrealizedPnL = size * (markPrice - entryPrice);
    } else {
        unrealizedPnL = size * (entryPrice - markPrice);
    }

    const equity = margin + unrealizedPnL + fundingAccrued;
    
    return { equity, unrealizedPnL };
};
