import { Activity, ArrowRight, BarChart3, Eye, MousePointerClick, Sparkles, Users } from 'lucide-react';
import type { AnalyticsKpi } from '@/types/analytics';

const iconMap = {
  impressions: Eye,
  reach: Users,
  engagement: Activity,
  'engagement-rate': Sparkles,
  clicks: MousePointerClick,
  published: BarChart3,
};

const toneMap = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  rose: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
};

export function AnalyticsKpiGrid({ items }: { items: AnalyticsKpi[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = iconMap[item.id as keyof typeof iconMap] || BarChart3;
        return (
          <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className={`rounded-2xl p-3 ${toneMap[item.tone]}`}>
                <Icon size={18} />
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                {item.delta}
                <ArrowRight size={10} />
              </div>
            </div>
            <div className="mt-5 text-3xl font-black tracking-tight text-slate-900">{item.value}</div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{item.helper}</p>
          </div>
        );
      })}
    </section>
  );
}
