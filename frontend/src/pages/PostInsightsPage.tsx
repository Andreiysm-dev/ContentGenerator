import { useEffect, useMemo, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { AnalyticsKpiGrid } from '@/components/analytics/AnalyticsKpiGrid';
import { AnalyticsTrendChart } from '@/components/analytics/AnalyticsTrendChart';
import { ConnectedAccountsGrid } from '@/components/analytics/ConnectedAccountsGrid';
import { TopPostsTable } from '@/components/analytics/TopPostsTable';
import { PlatformBreakdown } from '@/components/analytics/PlatformBreakdown';
import { DataAvailabilityBanner } from '@/components/analytics/DataAvailabilityBanner';
import { buildAnalyticsHubModel } from '@/data/analyticsMockData';
import { getImageGeneratedUrl } from '@/utils/contentUtils';
import type { AnalyticsSummaryResponse } from '@/types/analytics';

interface PostInsightsPageProps {
  calendarRows: any[];
  getStatusValue: (status: any) => string;
  activeCompanyId: string | undefined;
  authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  backendBaseUrl: string;
  connectedAccounts?: Array<{
    id: string;
    provider: string;
    profile_name?: string | null;
    profile_picture?: string | null;
    created_at?: string | null;
  }>;
}

export function PostInsightsPage({
  calendarRows,
  getStatusValue,
  activeCompanyId,
  authedFetch,
  backendBaseUrl,
  connectedAccounts = [],
}: PostInsightsPageProps) {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [metricMode, setMetricMode] = useState('impressions');
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummaryResponse | null>(null);

  const publishedRows = useMemo(() => {
    return calendarRows
      .filter((row) => String(getStatusValue(row.status) || '').toLowerCase() === 'published')
      .map((row) => ({
        ...row,
        imageUrl: getImageGeneratedUrl(row),
      }));
  }, [calendarRows, getStatusValue]);

  useEffect(() => {
    if (!activeCompanyId) {
      setAnalyticsSummary(null);
      return;
    }

    let cancelled = false;

    const loadAnalyticsSummary = async () => {
      try {
        const response = await authedFetch(`${backendBaseUrl}/api/social/${activeCompanyId}/analytics-summary`);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setAnalyticsSummary(data);
        }
      } catch (error) {
        console.error('Failed to load analytics summary:', error);
      }
    };

    loadAnalyticsSummary();
    return () => {
      cancelled = true;
    };
  }, [activeCompanyId, authedFetch, backendBaseUrl]);

  const sourceAccounts = analyticsSummary?.accounts?.length ? analyticsSummary.accounts : connectedAccounts;
  const sourcePosts = analyticsSummary?.publishedPosts?.length ? analyticsSummary.publishedPosts : publishedRows;

  const analyticsModel = useMemo(
    () => buildAnalyticsHubModel(sourcePosts, activeCompanyId, sourceAccounts),
    [activeCompanyId, sourceAccounts, sourcePosts],
  );

  const accountOptions = useMemo(() => {
    return analyticsModel.accounts.map((account) => ({
      id: account.id,
      label: account.accountName,
    }));
  }, [analyticsModel.accounts]);

  const filteredPosts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return analyticsModel.posts.filter((post) => {
      if (platformFilter !== 'all' && post.platform !== platformFilter) return false;
      if (accountFilter !== 'all' && `${post.platform}-account` !== accountFilter) return false;
      if (!searchValue) return true;

      return [
        post.title,
        post.caption,
        post.platformLabel,
        post.accountName,
      ].join(' ').toLowerCase().includes(searchValue);
    });
  }, [accountFilter, analyticsModel.posts, platformFilter, search]);

  const filteredAccounts = useMemo(() => {
    return analyticsModel.accounts.filter((account) => {
      if (platformFilter !== 'all' && account.platform !== platformFilter) return false;
      if (accountFilter !== 'all' && account.id !== accountFilter) return false;
      return true;
    });
  }, [accountFilter, analyticsModel.accounts, platformFilter]);

  const filteredBreakdown = useMemo(() => {
    return analyticsModel.platformBreakdown.filter((item) => platformFilter === 'all' || item.platform === platformFilter);
  }, [analyticsModel.platformBreakdown, platformFilter]);

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-3 md:p-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <AnalyticsHeader
          search={search}
          onSearchChange={setSearch}
          platformFilter={platformFilter}
          onPlatformFilterChange={setPlatformFilter}
          accountFilter={accountFilter}
          onAccountFilterChange={setAccountFilter}
          metricMode={metricMode}
          onMetricModeChange={setMetricMode}
          accountOptions={accountOptions}
        />

        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-2 text-sm font-medium text-slate-600 lg:flex-row lg:items-center lg:justify-between">
            <span>This hub is the cross-platform readout for connected accounts, published posts, and upcoming provider analytics.</span>
            <span>Connected account details are live now. Provider performance metrics will become fully live as platform access is approved.</span>
          </div>
        </section>

        <div className="[content-visibility:auto] [contain-intrinsic-size:220px]">
          <DataAvailabilityBanner items={analyticsModel.statusSummary} />
        </div>

        <div className="[content-visibility:auto] [contain-intrinsic-size:520px]">
          <AnalyticsKpiGrid items={analyticsModel.kpis} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)] [content-visibility:auto] [contain-intrinsic-size:780px]">
          <AnalyticsTrendChart points={analyticsModel.trend} metricMode={metricMode} />
          <ConnectedAccountsGrid accounts={filteredAccounts} />
        </div>

        <div className="[content-visibility:auto] [contain-intrinsic-size:920px]">
          <TopPostsTable posts={filteredPosts} />
        </div>

        <div className="[content-visibility:auto] [contain-intrinsic-size:560px]">
          <PlatformBreakdown items={filteredBreakdown} />
        </div>

        {sourcePosts.length === 0 && (
          <section className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
              <LayoutGrid size={24} />
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900">Publish a few posts to unlock the full hub preview.</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500">
              This page is already structured for cross-platform reporting. Once your real providers are verified, live metrics can replace the mock layer without changing the layout.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
