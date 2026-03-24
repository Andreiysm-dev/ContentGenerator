export type AnalyticsDataStatus = 'live' | 'limited' | 'placeholder' | 'disconnected';

export type AnalyticsPlatform = 'facebook' | 'instagram' | 'linkedin';

export interface AnalyticsKpi {
  id: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  tone: 'blue' | 'emerald' | 'rose' | 'amber' | 'violet';
  helper: string;
}

export interface AnalyticsTrendPoint {
  label: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  followers: number;
}

export interface AnalyticsAccountCard {
  id: string;
  platform: AnalyticsPlatform;
  accountName: string;
  handle: string;
  profilePicture?: string | null;
  status: AnalyticsDataStatus;
  statusLabel: string;
  followers: string;
  followerDelta: string;
  engagementRate: string;
  postsPublished: number;
  lastSyncLabel: string;
  helperText: string;
  sparkline: number[];
}

export interface AnalyticsPostRow {
  id: string;
  title: string;
  caption: string;
  platform: AnalyticsPlatform;
  platformLabel: string;
  status: AnalyticsDataStatus;
  publishedAt: string;
  thumbnailUrl: string | null;
  accountName: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagementRate: string;
}

export interface PlatformBreakdownCard {
  platform: AnalyticsPlatform;
  label: string;
  status: AnalyticsDataStatus;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  helperText: string;
  availableMetrics: string[];
}

export interface AnalyticsHubModel {
  statusSummary: Array<{
    id: string;
    label: string;
    tone: 'success' | 'warning' | 'muted';
    description: string;
  }>;
  kpis: AnalyticsKpi[];
  trend: AnalyticsTrendPoint[];
  accounts: AnalyticsAccountCard[];
  posts: AnalyticsPostRow[];
  platformBreakdown: PlatformBreakdownCard[];
}

export interface ConnectedAnalyticsAccount {
  id: string;
  provider: string;
  profile_name?: string | null;
  profile_picture?: string | null;
  created_at?: string | null;
}

export interface AnalyticsSummaryResponse {
  companyId: string;
  accounts: ConnectedAnalyticsAccount[];
  publishedPosts: any[];
  availability: Array<{
    platform: string;
    connected: boolean;
    dataStatus: string;
    reason: string;
  }>;
  fetchedAt: string;
}
