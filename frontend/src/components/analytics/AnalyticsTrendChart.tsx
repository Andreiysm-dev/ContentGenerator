import { TrendingUp } from 'lucide-react';
import type { AnalyticsTrendPoint } from '@/types/analytics';

const metricLabels: Record<string, string> = {
  impressions: 'Impressions',
  reach: 'Reach',
  engagement: 'Engagement',
  clicks: 'Clicks',
  followers: 'Follower Growth',
};

export function AnalyticsTrendChart({
  points,
  metricMode,
}: {
  points: AnalyticsTrendPoint[];
  metricMode: string;
}) {
  const values = points.map((point) => point[metricMode as keyof AnalyticsTrendPoint] as number);
  const maxValue = Math.max(...values, 1);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Performance Trend</div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">{metricLabels[metricMode] || 'Metric'} over time</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
          <TrendingUp size={12} />
          Mock trend ready for provider sync
        </div>
      </div>

      <div className="mt-8 grid h-[220px] grid-cols-7 items-end gap-3">
        {points.map((point) => {
          const value = point[metricMode as keyof AnalyticsTrendPoint] as number;
          const height = Math.max(12, Math.round((value / maxValue) * 162));

          return (
            <div key={point.label} className="flex h-full flex-col items-center justify-end gap-3">
              <div className="w-full rounded-t-[20px] bg-gradient-to-t from-[#1f87d7] via-[#3fa9f5] to-[#88d3ff] transition hover:opacity-90" style={{ height }} />
              <div className="text-center">
                <div className="text-xs font-black text-slate-800">{value.toLocaleString()}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{point.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
