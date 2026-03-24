import { ArrowUpRight, Facebook, ImageOff, Instagram, Linkedin, MousePointerClick } from 'lucide-react';
import type { AnalyticsPostRow } from '@/types/analytics';

const iconMap = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
};

const statusTone = {
  live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  limited: 'bg-amber-50 text-amber-700 border-amber-200',
  placeholder: 'bg-slate-100 text-slate-600 border-slate-200',
  disconnected: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function TopPostsTable({ posts }: { posts: AnalyticsPostRow[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Top Content</div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Cross-channel post performance</h2>
        </div>
        <div className="text-xs font-medium text-slate-500">Sorted by the current filtered set</div>
      </div>

      {posts.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
          <div className="text-lg font-black text-slate-900">No matching posts</div>
          <p className="mt-2 text-sm font-medium text-slate-500">Adjust the filters, publish more posts, or connect additional accounts to grow this view into a fuller cross-platform reporting table.</p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                <th className="px-3">Post</th>
                <th className="px-3">Platform</th>
                <th className="px-3">Published</th>
                <th className="px-3">Impr.</th>
                <th className="px-3">Reach</th>
                <th className="px-3">Eng.</th>
                <th className="px-3">Clicks</th>
                <th className="px-3">Rate</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const PlatformIcon = iconMap[post.platform];
                const engagement = post.likes + post.comments + post.shares + post.saves;
                return (
                  <tr key={post.id} className="rounded-2xl bg-slate-50/70">
                    <td className="rounded-l-2xl px-3 py-3">
                      <div className="flex min-w-[280px] items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                          {post.thumbnailUrl ? (
                            <img
                              src={post.thumbnailUrl}
                              alt={post.title}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageOff size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-slate-900">{post.title}</div>
                          <div className="mt-1 truncate text-xs font-medium text-slate-500">{post.caption}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
                          <PlatformIcon size={14} />
                          {post.platformLabel}
                        </div>
                        <div className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${statusTone[post.status]}`}>
                          {post.status === 'live' ? 'Live' : 'Limited'}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-slate-600">{post.publishedAt}</td>
                    <td className="px-3 py-3 text-sm font-black text-slate-900">{post.impressions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm font-black text-slate-900">{post.reach.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-black text-slate-900">{engagement.toLocaleString()}</div>
                      <div className="text-[11px] font-medium text-slate-500">{post.likes} likes • {post.comments} comments</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="inline-flex items-center gap-1.5 text-sm font-black text-slate-900">
                        <MousePointerClick size={13} className="text-cyan-600" />
                        {post.clicks.toLocaleString()}
                      </div>
                    </td>
                    <td className="rounded-r-2xl px-3 py-3">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                        {post.engagementRate}
                        <ArrowUpRight size={12} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
