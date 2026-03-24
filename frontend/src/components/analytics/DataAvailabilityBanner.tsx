import { CheckCircle2, Clock3, ShieldAlert } from 'lucide-react';

type StatusItem = {
  id: string;
  label: string;
  tone: 'success' | 'warning' | 'muted';
  description: string;
};

const toneMap = {
  success: {
    icon: CheckCircle2,
    wrapper: 'border-emerald-200/70 bg-emerald-50/70 text-emerald-900',
    iconColor: 'text-emerald-600',
  },
  warning: {
    icon: ShieldAlert,
    wrapper: 'border-amber-200/80 bg-amber-50/80 text-amber-900',
    iconColor: 'text-amber-600',
  },
  muted: {
    icon: Clock3,
    wrapper: 'border-slate-200 bg-white text-slate-800',
    iconColor: 'text-slate-500',
  },
};

export function DataAvailabilityBanner({ items }: { items: StatusItem[] }) {
  return (
    <div className="grid gap-3 xl:grid-cols-3">
      {items.map((item) => {
        const tone = toneMap[item.tone];
        const Icon = tone.icon;

        return (
          <div key={item.id} className={`rounded-2xl border px-4 py-3 ${tone.wrapper}`}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-xl bg-white/70 p-2 ${tone.iconColor}`}>
                <Icon size={16} />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em]">{item.label}</div>
                <p className="mt-1 text-sm font-medium leading-relaxed text-slate-600">{item.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
