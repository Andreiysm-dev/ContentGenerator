import { AlertTriangle, CheckCircle2, Linkedin, Instagram, Facebook, Users } from 'lucide-react';
import type { AnalyticsAccountCard } from '@/types/analytics';

const iconMap = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
};

const statusTone = {
  live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  limited: 'border-amber-200 bg-amber-50 text-amber-700',
  placeholder: 'border-slate-200 bg-slate-100 text-slate-600',
  disconnected: 'border-rose-200 bg-rose-50 text-rose-700',
};

export function ConnectedAccountsGrid({ accounts }: { accounts: AnalyticsAccountCard[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Connected Accounts</div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Account-level rollups and readiness states</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-1">
        {accounts.map((account) => {
          const PlatformIcon = iconMap[account.platform];
          const isLive = account.status === 'live';

          return (
            <div key={account.id} className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-white">
                    {account.profilePicture ? (
                      <img
                        src={account.profilePicture}
                        alt={account.accountName}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <PlatformIcon size={18} />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">{account.accountName}</div>
                    <div className="text-xs font-medium text-slate-500">{account.handle}</div>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusTone[account.status]}`}>
                  {isLive ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                  {account.statusLabel}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3">
                <div>
                  <div className="text-lg font-black text-slate-900">{account.followers}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Followers</div>
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">{account.engagementRate}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Engagement</div>
                </div>
                <div>
                  <div className="text-lg font-black text-slate-900">{account.postsPublished}</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Published</div>
                </div>
              </div>

              <div className="mt-4 h-12 rounded-2xl bg-slate-100 px-3 py-2">
                <div className="flex h-full items-end gap-1.5">
                  {account.sparkline.map((point, index) => (
                    <div key={`${account.id}-${index}`} className="flex-1 rounded-t-full bg-slate-300" style={{ height: `${point}%` }} />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
                <div className="inline-flex items-center gap-1.5">
                  <Users size={13} />
                  Growth {account.followerDelta}
                </div>
                <div>{account.lastSyncLabel}</div>
              </div>

              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{account.helperText}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
