export type NetworkType = 'testnet' | 'mainnet';

export interface ProfileStats {
  totalCalls: number;
  resolvedCalls: number;
  correctCalls: number;
  incorrectCalls: number;
  accuracy: number; // Percentage (e.g. 68.3)
  edgeScore: number; // Prediction Edge points
  currentStreak: number;
  bestStreak: number;
  avgCallProbability: number;
  volumeAttributed: string;
  followersCount: number;
  followingCount: number;
}

export interface Profile {
  id: string;
  address: string;
  handle: string;
  displayName: string;
  bio?: string;
  avatarUrl: string;
  xHandle?: string | null;
  isVerified: boolean;
  joinedAt?: number;
  stats?: ProfileStats;
}

export interface CalloutSnapshot {
  probabilityAtCall: number;
  marketId: string;
  timestamp: number;
}

export interface CalloutMetrics {
  views: number;
  likes: number;
  comments: number;
  reposts: number;
  saves: number;
  tradesAttributed: number;
  volumeAttributed: string;
  marketCap?: string;
}

export interface CalloutMarket {
  id: string;
  title: string;
  image: string;
  yesProbability: number;
  noProbability: number;
  totalVolume: number;
  status?: 'Live' | 'Closed' | 'Resolved';
  endTime?: string;
  positionValue?: string;
  profitValue?: string;
  marketCap?: string;
}

export type ConvictionType = 'YES' | 'NO';
export type CalloutStatus = 'LIVE' | 'WON' | 'LOST' | 'INVALID' | 'EXPIRED' | 'MARKET_PENDING';

export interface Callout {
  id: string;
  network: NetworkType;
  creator: Profile;
  headline: string;
  thesis?: string | null;
  category: string;
  conviction: ConvictionType;
  confidence: number; // Percentage 50-99
  market: CalloutMarket;
  callProbability: number;
  currentProbability: number;
  deadline: number;
  status: CalloutStatus;
  createdAt: number;
  resolvedAt?: number | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  metrics: CalloutMetrics;
  snapshot: CalloutSnapshot;
}

export interface CounterCall {
  id: string;
  creator: Profile;
  conviction: ConvictionType;
  confidence: number;
  thesis?: string;
  callProbability: number;
  createdAt: number;
}

export interface CommentPositionBadge {
  side: ConvictionType;
  shares: number;
}

export interface Comment {
  id: string;
  userId: string;
  creator: Profile;
  content: string;
  likes: number;
  createdAt: number;
  parentId?: string | null;
  positionBadge?: CommentPositionBadge | null;
}

export type NotificationType =
  | 'new_callout'
  | 'counter_call'
  | 'probability_moved'
  | 'callout_won'
  | 'callout_lost'
  | 'new_follower'
  | 'reply'
  | 'trending'
  | 'market_closing';

export interface NotificationItem {
  id: string;
  network: NetworkType;
  type: NotificationType;
  userId: string;
  refId: string;
  content: string;
  isRead: boolean;
  createdAt: number;
  creator?: {
    handle: string;
    avatarUrl: string;
  } | null;
}

export interface LeaderboardEntry {
  rank: number;
  profileId: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  edgeScore: number;
  accuracy: number;
  resolvedCalls: number;
  followersCount: number;
  volumeAttributed: string;
}

export interface LeaderboardData {
  network: NetworkType;
  periods: {
    '24h': LeaderboardEntry[];
    '7d'?: LeaderboardEntry[];
    '30d'?: LeaderboardEntry[];
    'all_time'?: LeaderboardEntry[];
  };
}
