import type {
  AnalyticsAccountCard,
  AnalyticsDataStatus,
  AnalyticsHubModel,
  AnalyticsPlatform,
  AnalyticsPostRow,
  ConnectedAnalyticsAccount,
  AnalyticsTrendPoint,
  PlatformBreakdownCard,
} from '@/types/analytics';

const PLATFORM_META: Record<AnalyticsPlatform, { label: string; handlePrefix: string }> = {
  facebook: { label: 'Facebook', handlePrefix: 'facebook.com/' },
  instagram: { label: 'Instagram', handlePrefix: '@' },
  linkedin: { label: 'LinkedIn', handlePrefix: 'linkedin.com/company/' },
};

const numberFormatter = new Intl.NumberFormat('en-US');

function seedFromString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickPlatform(seed: number): AnalyticsPlatform {
  const platforms: AnalyticsPlatform[] = ['facebook', 'instagram', 'linkedin'];
  return platforms[seed % platforms.length];
}

function statusForPlatform(platform: AnalyticsPlatform): AnalyticsDataStatus {
  if (platform === 'linkedin') return 'live';
  return 'limited';
}

function statusLabelForPlatform(platform: AnalyticsPlatform): string {
  return platform === 'linkedin' ? 'Live Data Ready' : 'Limited API Access';
}

function helperTextForPlatform(platform: AnalyticsPlatform): string {
  if (platform === 'linkedin') {
    return 'Designed for live company-page analytics once the provider endpoint is connected.';
  }
  if (platform === 'instagram') {
    return 'UI is ready now, then account and post insights can unlock after Meta business verification.';
  }
  return 'This layout is ready for page-level and post-level Meta insights once expanded permissions are approved.';
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return numberFormatter.format(value);
}

function buildSparkline(seed: number): number[] {
  return Array.from({ length: 8 }, (_, index) => 28 + ((seed + index * 11) % 55));
}

function buildTrend(companySeed: number): AnalyticsTrendPoint[] {
  const labels = ['Mar 11', 'Mar 12', 'Mar 13', 'Mar 14', 'Mar 15', 'Mar 16', 'Mar 17'];
  return labels.map((label, index) => {
    const base = companySeed % 400;
    return {
      label,
      impressions: 3200 + base + index * 310,
      reach: 1900 + base + index * 220,
      engagement: 240 + (companySeed % 60) + index * 17,
      clicks: 42 + (companySeed % 12) + index * 3,
      followers: 8 + ((companySeed + index * 5) % 9),
    };
  });
}

function normalizePlatform(provider: string | undefined | null): AnalyticsPlatform | null {
  const value = String(provider || '').toLowerCase();
  if (value.includes('facebook')) return 'facebook';
  if (value.includes('instagram')) return 'instagram';
  if (value.includes('linkedin')) return 'linkedin';
  return null;
}

function buildAccountCards(
  companyId: string | undefined,
  posts: AnalyticsPostRow[],
  connectedAccounts: ConnectedAnalyticsAccount[] = [],
): AnalyticsAccountCard[] {
  const baseSeed = seedFromString(companyId || 'default-company');
  const accountPlatforms: AnalyticsPlatform[] = ['facebook', 'instagram', 'linkedin'];
  const accountsByPlatform = new Map<AnalyticsPlatform, ConnectedAnalyticsAccount>();

  connectedAccounts.forEach((account) => {
    const platform = normalizePlatform(account.provider);
    if (platform && !accountsByPlatform.has(platform)) {
      accountsByPlatform.set(platform, account);
    }
  });

  return accountPlatforms.map((platform, index) => {
    const platformPosts = posts.filter((post) => post.platform === platform);
    const seed = baseSeed + index * 97;
    const connectedAccount = accountsByPlatform.get(platform);
    const status = connectedAccount ? statusForPlatform(platform) : 'disconnected';
    const label = PLATFORM_META[platform].label;
    const accountName = connectedAccount?.profile_name || `${label} Growth Desk`;
    const handleBase = connectedAccount?.profile_name || (platform === 'instagram' ? 'startuplabcontent' : 'startuplab-growth');
    const handle = platform === 'instagram'
      ? `@${handleBase.replace(/^@/, '').replace(/\s+/g, '').toLowerCase()}`
      : `${PLATFORM_META[platform].handlePrefix}${handleBase.replace(/\s+/g, '-').toLowerCase()}`;

    return {
      id: connectedAccount?.id || `${platform}-account`,
      platform,
      accountName,
      handle,
      profilePicture: connectedAccount?.profile_picture || null,
      status,
      statusLabel: connectedAccount ? statusLabelForPlatform(platform) : 'Not Connected',
      followers: formatCompact(2800 + (seed % 5600)),
      followerDelta: `+${8 + (seed % 15)}%`,
      engagementRate: `${(2.1 + ((seed % 18) / 10)).toFixed(1)}%`,
      postsPublished: platformPosts.length,
      lastSyncLabel: connectedAccount
        ? (status === 'live' ? 'Synced 18 min ago' : 'Awaiting expanded permissions')
        : 'Connect this account to centralize reporting',
      helperText: connectedAccount
        ? helperTextForPlatform(platform)
        : `No ${label} account connected yet. This slot is ready once the channel is linked.`,
      sparkline: buildSparkline(seed),
    };
  });
}

function buildPosts(rows: any[]): AnalyticsPostRow[] {
  return rows.map((row, index) => {
    const id = String(row.contentCalendarId || `mock-row-${index}`);
    const seed = seedFromString(id);
    const platform = pickPlatform(seed);
    const impressions = 1800 + (seed % 9200);
    const reach = Math.round(impressions * 0.72);
    const likes = 40 + (seed % 260);
    const comments = 6 + (seed % 42);
    const shares = 4 + (seed % 31);
    const saves = 3 + (seed % 28);
    const clicks = 10 + (seed % 74);
    const totalEngagement = likes + comments + shares + saves;
    const engagementRate = impressions > 0 ? ((totalEngagement / impressions) * 100).toFixed(1) : '0.0';

    return {
      id,
      title: row.card_name || row.theme || row.brandHighlight || 'Untitled Campaign',
      caption: row.finalCaption || row.captionOutput || row.theme || 'No caption available yet.',
      platform,
      platformLabel: PLATFORM_META[platform].label,
      status: statusForPlatform(platform),
      publishedAt: row.date || row.scheduled_at || 'Unscheduled',
      thumbnailUrl: row.thumbnailUrl || row.imageUrl || row.imageGeneratedUrl || row.imageGenerated || null,
      accountName: `${PLATFORM_META[platform].label} Growth Desk`,
      impressions,
      reach,
      likes,
      comments,
      shares,
      saves,
      clicks,
      engagementRate: `${engagementRate}%`,
    };
  });
}

function buildPlatformBreakdown(accounts: AnalyticsAccountCard[], posts: AnalyticsPostRow[]): PlatformBreakdownCard[] {
  return accounts.map((account) => {
    const relatedPosts = posts.filter((post) => post.platform === account.platform);
    const totalImpressions = relatedPosts.reduce((sum, post) => sum + post.impressions, 0);
    const totalClicks = relatedPosts.reduce((sum, post) => sum + post.clicks, 0);

    return {
      platform: account.platform,
      label: PLATFORM_META[account.platform].label,
      status: account.status,
      primaryMetricLabel: account.platform === 'linkedin' ? 'Post Views' : 'Impressions',
      primaryMetricValue: formatCompact(totalImpressions),
      secondaryMetricLabel: account.platform === 'instagram' ? 'Saves + Shares' : 'Clicks',
      secondaryMetricValue: account.platform === 'instagram'
        ? formatCompact(relatedPosts.reduce((sum, post) => sum + post.saves + post.shares, 0))
        : formatCompact(totalClicks),
      helperText: helperTextForPlatform(account.platform),
      availableMetrics: account.platform === 'linkedin'
        ? ['Views', 'Engagement Rate', 'Clicks', 'Top Posts']
        : ['Reach', 'Reactions', 'Comments', 'Ready for verified-account insights'],
    };
  });
}

export function buildAnalyticsHubModel(
  rows: any[],
  companyId?: string,
  connectedAccounts: ConnectedAnalyticsAccount[] = [],
): AnalyticsHubModel {
  const posts = buildPosts(rows);
  const companySeed = seedFromString(companyId || 'default-company');
  const totalImpressions = posts.reduce((sum, post) => sum + post.impressions, 0);
  const totalReach = posts.reduce((sum, post) => sum + post.reach, 0);
  const totalClicks = posts.reduce((sum, post) => sum + post.clicks, 0);
  const totalEngagement = posts.reduce((sum, post) => sum + post.likes + post.comments + post.shares + post.saves, 0);
  const accounts = buildAccountCards(companyId, posts, connectedAccounts);
  const averageEngagementRate = totalImpressions > 0 ? `${((totalEngagement / totalImpressions) * 100).toFixed(1)}%` : '0.0%';

  return {
    statusSummary: [
      {
        id: 'linkedin-live',
        label: 'LinkedIn Ready',
        tone: 'success',
        description: 'This layout is ready for live company-page analytics once the backend endpoint is connected.',
      },
      {
        id: 'meta-limited',
        label: 'Meta Access Limited',
        tone: 'warning',
        description: 'Facebook and Instagram cards are showing production-ready placeholders until your verified business access is approved.',
      },
      {
        id: 'central-hub',
        label: 'Central Hub Mode',
        tone: 'muted',
        description: 'All connected channels are normalized into one shared reporting surface for future cross-platform comparisons.',
      },
    ],
    kpis: [
      {
        id: 'impressions',
        label: 'Total Impressions',
        value: formatCompact(totalImpressions),
        delta: `+${12 + (companySeed % 8)}%`,
        trend: 'up',
        tone: 'blue',
        helper: 'Cross-channel visibility across connected accounts',
      },
      {
        id: 'reach',
        label: 'Total Reach',
        value: formatCompact(totalReach),
        delta: `+${7 + (companySeed % 6)}%`,
        trend: 'up',
        tone: 'emerald',
        helper: 'Unique audience estimate for the selected range',
      },
      {
        id: 'engagement',
        label: 'Total Engagement',
        value: formatCompact(totalEngagement),
        delta: `+${5 + (companySeed % 4)}%`,
        trend: 'up',
        tone: 'rose',
        helper: 'Likes, comments, shares, and saves',
      },
      {
        id: 'engagement-rate',
        label: 'Engagement Rate',
        value: averageEngagementRate,
        delta: 'Stable',
        trend: 'flat',
        tone: 'violet',
        helper: 'Weighted against total impressions',
      },
      {
        id: 'clicks',
        label: 'Outbound Clicks',
        value: formatCompact(totalClicks),
        delta: `+${3 + (companySeed % 5)}%`,
        trend: 'up',
        tone: 'amber',
        helper: 'Link actions from tracked posts',
      },
      {
        id: 'published',
        label: 'Posts Published',
        value: numberFormatter.format(posts.length),
        delta: `${accounts.length} connected accounts`,
        trend: 'flat',
        tone: 'blue',
        helper: 'Published items contributing to the selected report',
      },
    ],
    trend: buildTrend(companySeed),
    accounts,
    posts,
    platformBreakdown: buildPlatformBreakdown(accounts, posts),
  };
}
