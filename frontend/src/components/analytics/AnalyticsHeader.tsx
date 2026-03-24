import { BarChart3, CalendarRange, ChevronDown, Download, RefreshCw } from 'lucide-react';

interface AnalyticsHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  platformFilter: string;
  onPlatformFilterChange: (value: string) => void;
  accountFilter: string;
  onAccountFilterChange: (value: string) => void;
  metricMode: string;
  onMetricModeChange: (value: string) => void;
  accountOptions: Array<{ id: string; label: string }>;
}

const metricModes = [
  { id: 'impressions', label: 'Impressions' },
  { id: 'reach', label: 'Reach' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'clicks', label: 'Clicks' },
  { id: 'followers', label: 'Followers' },
];

export function AnalyticsHeader({
  search,
  onSearchChange,
  platformFilter,
  onPlatformFilterChange,
  accountFilter,
  onAccountFilterChange,
  metricMode,
  onMetricModeChange,
  accountOptions,
}: AnalyticsHeaderProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600">
            <BarChart3 size={12} />
            Analytics Hub
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">See every connected channel in one reporting surface.</h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-slate-600">
            Designed for cross-platform post analytics now, and ready to plug into verified Meta and LinkedIn provider data once those APIs are available.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <CalendarRange size={15} />
            Last 30 Days
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Sync Placeholder
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <Download size={15} />
            Export Ready
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.8fr))]">
        <label className="block">
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Search Posts</div>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search captions, themes, or campaign names"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:bg-white"
          />
        </label>

        <label className="block">
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Platform</div>
          <select
            value={platformFilter}
            onChange={(event) => onPlatformFilterChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-300"
          >
            <option value="all" className="text-slate-900">All Platforms</option>
            <option value="facebook" className="text-slate-900">Facebook</option>
            <option value="instagram" className="text-slate-900">Instagram</option>
            <option value="linkedin" className="text-slate-900">LinkedIn</option>
          </select>
        </label>

        <label className="block">
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Account</div>
          <select
            value={accountFilter}
            onChange={(event) => onAccountFilterChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-300"
          >
            <option value="all" className="text-slate-900">All Accounts</option>
            {accountOptions.map((account) => (
              <option key={account.id} value={account.id} className="text-slate-900">{account.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Trend Metric</div>
          <select
            value={metricMode}
            onChange={(event) => onMetricModeChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-slate-300"
          >
            {metricModes.map((metric) => (
              <option key={metric.id} value={metric.id} className="text-slate-900">{metric.label}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
