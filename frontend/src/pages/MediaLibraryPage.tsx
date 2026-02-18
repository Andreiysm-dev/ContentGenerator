import React, { useState, useMemo } from "react";
import { Search, Download, Eye, Image as ImageIcon, Filter, FilterX, FileText } from "lucide-react";

interface MediaItem {
    id: string;
    url: string;
    type: string;
    date: string;
    caption: string;
    row: any;
}

interface MediaLibraryPageProps {
    calendarRows: any[];
    getImageGeneratedUrl: (row: any) => string | null;
    getAttachedDesignUrls: (row: any) => string[];
    setSelectedRow: (row: any) => void;
    setIsViewModalOpen: (value: boolean) => void;
    activeCompanyId: string | undefined;
}

export function MediaLibraryPage({
    calendarRows,
    getImageGeneratedUrl,
    getAttachedDesignUrls,
    setSelectedRow,
    setIsViewModalOpen,
    activeCompanyId,
}: MediaLibraryPageProps) {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");

    // Extract all media items from calendar rows
    const mediaItems = useMemo(() => {
        const items: MediaItem[] = [];
        calendarRows.forEach((row) => {
            const generatedUrl = getImageGeneratedUrl(row);
            const attachedUrls = getAttachedDesignUrls(row);

            const allUrls = Array.from(new Set([
                ...(generatedUrl ? [generatedUrl] : []),
                ...attachedUrls
            ]));

            allUrls.forEach((url, index) => {
                items.push({
                    id: `${row.contentCalendarId}-${index}`,
                    url,
                    type: row.contentType || "Uncategorized",
                    date: row.date || "No date",
                    caption: row.finalCaption || row.captionOutput || row.theme || "",
                    row,
                });
            });
        });
        return items;
    }, [calendarRows, getImageGeneratedUrl, getAttachedDesignUrls]);

    const filteredItems = useMemo(() => {
        return mediaItems.filter((item) => {
            const matchesSearch = item.caption.toLowerCase().includes(search.toLowerCase()) ||
                item.type.toLowerCase().includes(search.toLowerCase());
            const matchesType = filterType === "all" || item.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [mediaItems, search, filterType]);

    const types = useMemo(() => {
        const t = new Set(mediaItems.map(i => i.type));
        return Array.from(t);
    }, [mediaItems]);

    const handleDownload = (url: string, filename: string) => {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6 relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-7%] w-[40%] h-[40%] bg-gradient-to-bl from-[#3fa9f5]/17 to-[#6fb6e8]/13 rounded-full blur-[95px] animate-pulse" />
                <div className="absolute bottom-[-12%] left-[-5%] w-[38%] h-[38%] bg-gradient-to-tr from-[#a78bfa]/13 to-[#e5a4e6]/10 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '700ms' }} />
            </div>

            <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full relative z-10">
                <div className="px-8 py-8 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden">
                    <ImageIcon className="absolute top-4 right-8 text-blue-400/10 w-32 h-32 rotate-12 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-3">
                            Asset Management
                        </div>
                        <h2 className="text-2xl font-black text-white">Media Library</h2>
                        <p className="mt-1 text-sm font-medium text-slate-400">Manage and download your generated visual assets.</p>
                    </div>

                    <div className="relative z-10">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="search"
                                className="w-full md:w-72 rounded-xl border border-white/20 bg-white/10 pl-11 pr-4 py-3 text-sm font-medium text-white placeholder:text-white/40 outline-none focus:bg-white/20 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                                placeholder="Search your assets..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 shadow-sm w-full sm:w-auto">
                            <span className="inline-flex items-center gap-2 text-[0.78rem] font-bold text-brand-dark/60 whitespace-nowrap">
                                <Filter className="h-4 w-4" />
                                Category
                            </span>
                            <select
                                className="bg-transparent border-none p-0 text-[0.78rem] font-medium text-brand-dark focus:ring-0 cursor-pointer"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="all">All Types</option>
                                {types.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        {(search || filterType !== "all") && (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    setFilterType("all");
                                }}
                                className="inline-flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-600 transition"
                            >
                                <FilterX className="h-4 w-4" />
                                Clear Filters
                            </button>
                        )}

                        <div className="ml-auto text-xs font-bold text-slate-400">
                            Showing {filteredItems.length} assets
                        </div>
                    </div>

                    {filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <ImageIcon className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No media found</h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                Generate some content or attach designs to your calendar to see them here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                                >
                                    <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                                        <img
                                            src={item.url}
                                            alt={item.caption}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />

                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedRow(item.row);
                                                    setIsViewModalOpen(true);
                                                }}
                                                className="p-2 bg-white rounded-xl text-slate-900 hover:bg-slate-50 transition"
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(item.url, `media-${item.id}.jpg`)}
                                                className="p-2 bg-white rounded-xl text-slate-900 hover:bg-slate-50 transition"
                                                title="Download"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-[#3fa9f5] uppercase tracking-wider">{item.type}</span>
                                            <span className="text-[10px] font-medium text-slate-400">{item.date}</span>
                                        </div>
                                        <p className="text-xs text-slate-700 font-medium line-clamp-1">{item.caption || "No caption"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
