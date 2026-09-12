export type NetworkType = 'testnet' | 'mainnet';

export interface ProfileDTO {
  id: string;
  walletAddress: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl: string;
  xHandle?: string | null;
  isVerified: boolean;
  createdAt: Date;
}

export interface CalloutDTO {
  id: string;
  network: NetworkType;
  creatorId: string;
  headline: string;
  thesis?: string | null;
  category: string;
  conviction: 'YES' | 'NO';
  confidence: number;
  marketId?: string | null;
  marketProposalId?: string | null;
  callProbability: number;
  currentProbability: number;
  deadline: Date;
  status: 'LIVE' | 'WON' | 'LOST' | 'INVALID' | 'EXPIRED' | 'MARKET_PENDING';
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: Date;
  resolvedAt?: Date | null;
}

export interface CalloutSnapshotDTO {
  id: string;
  network: NetworkType;
  calloutId: string;
  probabilityAtCall: number;
  marketId: string;
  marketRulesHash?: string | null;
  timestamp: Date;
}

export interface CreatorStatsDTO {
  id: string;
  network: NetworkType;
  profileId: string;
  totalCalls: number;
  resolvedCalls: number;
  correctCalls: number;
  incorrectCalls: number;
  accuracy: number;
  edgeScore: number;
  currentStreak: number;
  bestStreak: number;
  avgCallProbability: number;
  volumeAttributed: number;
  followersCount: number;
  followingCount: number;
  updatedAt: Date;
}

export interface TradeAttributionDTO {
  id: string;
  network: NetworkType;
  calloutId: string;
  creatorId: string;
  traderAddress: string;
  marketId: string;
  volume: number;
  createdAt: Date;
}
