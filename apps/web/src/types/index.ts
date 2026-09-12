export * from './social';

export interface MarketOption {
  label: string;
  probability?: number;
  yesProbability?: number;
}

export interface Market {
  id: string;
  title: string;
  slug?: string;
  category: string;
  description: string;
  image: string;
  yesProbability: number;
  noProbability: number;
  yesPrice: number;
  noPrice: number;
  totalVolume: number;
  status: "Live" | "Closed" | "Resolved";
  endTime: string;
  isYield: boolean;
  options?: MarketOption[];
}

export interface OrderBookEntry {
  price: number;
  shares: number;
  total: number;
}

export interface ChartDataPoint {
  time: string;
  price: number;
}

export interface MarketDetail extends Omit<Market, 'yesProbability' | 'noProbability' | 'yesPrice' | 'noPrice'> {
  priceToBeat: number;
  currentPrice: number;
  priceChangePercent: number;
  timeLeft: string;
  closeTimeFormatted: string;
  chance: number;
  resolutionRules: string;
  chartData: ChartDataPoint[];
  orderBook: {
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
  };
  rewards: {
    pointsToEarn: number;
    status: string;
  };
}
