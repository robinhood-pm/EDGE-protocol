import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT as string;

app.use(cors());
app.use(express.json());

import marketRoutes from './routes/market.routes';
import orderRoutes from './routes/order.routes';
import logRoutes from './routes/log.routes';
import portfolioRoutes from './routes/portfolio.routes';
import userRoutes from './routes/user.routes';
import statsRoutes from './routes/stats.routes';
import tradesRoutes from './routes/trades.routes';

// Routes
app.use('/api/markets', marketRoutes);
app.use('/api/markets', tradesRoutes); // /api/markets/:marketId/trades
app.use('/api/orders', orderRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'edge-protocol-backend' });
});

import { startIndexer } from './services/indexer';

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend is running on http://localhost:${PORT}`);
  
  // Start Indexer
  startIndexer();
});
