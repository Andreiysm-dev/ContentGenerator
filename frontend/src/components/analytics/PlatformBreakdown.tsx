import { Facebook, Instagram, Linkedin, LockKeyhole } from 'lucide-react';
import type { PlatformBreakdownCard } from '@/types/analytics';

const iconMap = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
};

export function PlatformBreakdown({ items }: { items: PlatformBreakdownCard[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Platform Readiness</div>
        <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Metric groups that will light up as provider access expands</h2>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = iconMap[item.platform];
          return (
            <div key={item.platform} className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-slate-900 p-3 text-white">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">{item.label}</div>
                    <div className="text-xs font-medium text-slate-500">{item.status === 'live' ? 'Ready for sync' : 'Permission limited'}</div>
                  </div>
                </div>
                {item.status !== 'live' && <LockKeyhole size={16} className="text-amber-500" />}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xl font-black text-slate-900">{item.primaryMetricValue}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{item.primaryMetricLabel}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-xl font-black text-slate-900">{item.secondaryMetricValue}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{item.secondaryMetricLabel}</div>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">{item.helperText}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.availableMetrics.map((metric) => (
                  <span key={metric} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
