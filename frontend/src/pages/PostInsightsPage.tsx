import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, MessageSquare, Heart, Eye, ArrowUpRight, Search, Filter, RefreshCw } from "lucide-react";
import { useMemo } from "react";

interface PostInsightsPageProps {
    calendarRows: any[];
    getStatusValue: (status: any) => string;
    activeCompanyId: string | undefined;
}

export function PostInsightsPage({ calendarRows, getStatusValue, activeCompanyId }: PostInsightsPageProps) {
    const [search, setSearch] = useState("");

    // State for live insights loaded from backend
    const [liveInsights, setLiveInsights] = useState<Record<string, any>>({});
    const [syncingId, setSyncingId] = useState<string | null>(null);

    const fetchInsights = async (postId: string) => {
        setSyncingId(postId);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/social/facebook/insights/${postId}`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setLiveInsights(prev => ({ ...prev, [postId]: data }));
        } catch (err) {
            console.error("Error fetching insights:", err);
        } finally {
            setSyncingId(null);
        }
    };

    // Filter for published posts only
    const publishedPosts = calendarRows.filter(row => getStatusValue(row.status).toLowerCase() === 'published');

    const filteredPosts = publishedPosts.filter(post =>
        (post.finalCaption || post.captionOutput || "").toLowerCase().includes(search.toLowerCase()) ||
        (post.theme || "").toLowerCase().includes(search.toLowerCase())
    );

    // Aggregates using real data (with fallback to 0)
    const stats = useMemo(() => {
        let reach = 0;
        let likes = 0;
        let comments = 0;

        publishedPosts.forEach(post => {
            const live = liveInsights[post.contentCalendarId];
            reach += (live?.reach || post.reach || 0);
            likes += (live?.likes || post.likes || 0);
            comments += (live?.comments || post.comments || 0);
        });

        return {
            totalReach: reach,
            totalEngagement: likes + comments,
            avgLikes: publishedPosts.length > 0 ? Math.round(likes / publishedPosts.length) : 0,
            growth: "--" // Now that it's real data, we show -- unless we have history
        };
    }, [publishedPosts, liveInsights]);

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6 relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-7%] w-[40%] h-[40%] bg-gradient-to-bl from-[#3fa9f5]/17 to-[#6fb6e8]/13 rounded-full blur-[95px] animate-pulse" />
                <div className="absolute bottom-[-12%] left-[-5%] w-[38%] h-[38%] bg-gradient-to-tr from-[#a78bfa]/13 to-[#e5a4e6]/10 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '700ms' }} />
            </div>

            <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative z-10">
                <div className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-[#3fa9f5]/85 via-[#6fb6e8]/75 to-[#a78bfa]/65 border-t border-l border-r border-[#3fa9f5]/60 rounded-t-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-0 shadow-sm">
                    <div>
                        <h2 className="text-sm md:text-lg font-bold">Post Insights</h2>
                        <p className="mt-0.5 text-xs font-medium text-white/90">Track performance metrics from your social platforms.</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/60" />
                        <input
                            type="search"
                            placeholder="Search posts..."
                            className="pl-9 pr-4 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-white/60 focus:outline-none focus:bg-white/20 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    {/* Top Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: "Total Reach", value: stats.totalReach.toLocaleString(), icon: Eye, color: "text-blue-500", bg: "bg-blue-50" },
                            { label: "Engagement", value: stats.totalEngagement.toLocaleString(), icon: Activity, color: "text-purple-500", bg: "bg-purple-50" },
                            { label: "Avg. Likes", value: stats.avgLikes.toString(), icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
                            { label: "Growth", value: stats.growth, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`p-2 rounded-xl ${stat.bg} ${stat.color} transition-colors group-hover:scale-110 duration-300`}>
                                        <stat.icon size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full uppercase">Real-time</span>
                                </div>
                                <div className="text-2xl font-black text-slate-800">{stat.value}</div>
                                <div className="text-[11px] font-bold text-slate-400 mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-[#3fa9f5]" />
                        Recent Performance
                    </h3>

                    {filteredPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                            <div className="h-14 w-14 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
                                <Activity size={24} />
                            </div>
                            <h4 className="text-md font-bold text-slate-900">No published posts found</h4>
                            <p className="text-xs text-slate-500 max-w-[240px] mt-1 leading-relaxed">
                                Insights are only available for content items that have been marked as "Published".
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredPosts.map((post) => {
                                const live = liveInsights[post.contentCalendarId];
                                const reach = live?.reach ?? post.reach ?? 0;
                                const likes = live?.likes ?? post.likes ?? 0;
                                const comments = live?.comments ?? post.comments ?? 0;
                                const isSyncing = syncingId === post.contentCalendarId;

                                return (
                                    <div key={post.contentCalendarId} className="group bg-white border border-slate-100 hover:border-[#3fa9f5]/30 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 transition-all hover:shadow-lg">
                                        <div className="w-full md:w-[40%] flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-slate-100 bg-cover bg-center shrink-0 border border-slate-200" style={{ backgroundImage: `url(${post.imageGeneratedUrl || post.imageUrl || 'https://via.placeholder.com/150'})` }} />
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-slate-900 line-clamp-1 truncate">{post.finalCaption || post.captionOutput || post.theme || "Untitled Post"}</div>
                                                <div className="text-[10px] font-medium text-slate-400 mt-0.5">{post.date} &bull; {post.social_provider || 'Direct'}</div>
                                            </div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-3 gap-8 w-full">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                                                    <Eye size={14} className="text-blue-400" />
                                                    {reach.toLocaleString()}
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Reach</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                                                    <Heart size={14} className="text-rose-400" />
                                                    {likes.toLocaleString()}
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Likes</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                                                    <MessageSquare size={14} className="text-purple-400" />
                                                    {comments.toLocaleString()}
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Comments</span>
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            <button
                                                onClick={() => fetchInsights(post.contentCalendarId)}
                                                disabled={isSyncing}
                                                className={`p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-[#3fa9f5] hover:bg-[#3fa9f5]/5 transition-all ${isSyncing ? "animate-spin" : ""}`}
                                                title="Sync live insights"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

import { Activity } from "lucide-react";
