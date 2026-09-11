import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || '3001';

app.use(cors());
app.use(express.json());

import marketRoutes from './routes/market.routes';
import orderRoutes from './routes/order.routes';
import logRoutes from './routes/log.routes';
import portfolioRoutes from './routes/portfolio.routes';
import userRoutes from './routes/user.routes';
import statsRoutes from './routes/stats.routes';
import tradesRoutes from './routes/trades.routes';
import perpRoutes from './routes/perp.routes';

// Routes
app.use('/api/markets', marketRoutes);
app.use('/api/markets', tradesRoutes); // /api/markets/:marketId/trades
app.use('/api/orders', orderRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/perps', perpRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'edge-protocol-backend' });
});

import { startIndexer } from './services/indexer';
import { startProbabilityIndexEngine } from './services/probabilityIndex';
import { startMarkPriceEngine } from './services/markPriceEngine';
import { startFundingEngine } from './services/fundingEngine';
import { startLiquidationMonitor } from './services/liquidationMonitor';
import { startPerpSettlementMonitor } from './services/perpSettlement';
import { startTradingBotService } from './services/tradingBotService';
import { startMatchingEngineRunner } from './services/matchingEngineRunner';
import { startRealOracleFeedService } from './services/realOracleService';

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend is running on http://localhost:${PORT}`);
  
  // Start Core Indexer & Financial Engines
  startIndexer();
  startProbabilityIndexEngine();
  startMarkPriceEngine();
  startFundingEngine();
  startLiquidationMonitor();
  startPerpSettlementMonitor();

  // Start Real Oracle Live Data Feed & Testnet Engine
  if (process.env.ENABLE_AUTO_BOTS !== 'false') {
    console.log(`📡 Starting Real Testnet Live Oracle Data Feed & Matching Workers...`);
    startRealOracleFeedService();
    startMatchingEngineRunner();
    startTradingBotService();
  }
});
