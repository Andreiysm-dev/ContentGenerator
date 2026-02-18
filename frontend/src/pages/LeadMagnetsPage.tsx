import React, { useState } from "react";
import { BookOpen, FileCheck, ListChecks, ArrowRight, Sparkles, Download, Eye, Layout, Plus, Wand2, FileText, ChevronRight, Magnet } from "lucide-react";

interface LeadMagnetType {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
    bg: string;
}

const MAGNET_TYPES: LeadMagnetType[] = [
    {
        id: "checklist",
        name: "Ultimate Checklist",
        description: "Step-by-step guides that users love to download and tick off.",
        icon: ListChecks,
        color: "text-emerald-500",
        bg: "bg-emerald-50"
    },
    {
        id: "ebook",
        name: "Mini E-Book",
        description: "Deep-dive knowledge packed into a 5-page digital booklet.",
        icon: BookOpen,
        color: "text-blue-500",
        bg: "bg-blue-50"
    },
    {
        id: "template",
        name: "Ready-to-use Template",
        description: "Fill-in-the-blanks sheets for specific business processes.",
        icon: Layout,
        color: "text-purple-500",
        bg: "bg-purple-50"
    }
];

export function LeadMagnetsPage() {
    const [view, setView] = useState<"grid" | "create">("grid");
    const [selectedType, setSelectedType] = useState<LeadMagnetType | null>(null);
    const [topic, setTopic] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<any | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim() || !selectedType) return;
        setIsGenerating(true);
        try {
            // Logic for generating lead magnet content
            // This would typically involve a specific chain: Outline -> Content
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/generate-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Create a professional ${selectedType.name} about "${topic}". Include an catchy title, a clear introduction, and a 5-point detailed body. Format it with clear headers.`,
                    noStream: true
                })
            });

            const data = await response.json();
            setGeneratedContent({
                title: `${selectedType.name}: ${topic}`,
                date: new Date().toLocaleDateString(),
                content: data.content || "Connection error. Please try again."
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    if (view === "create" && selectedType) {
        return (
            <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6 relative">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-7%] w-[42%] h-[42%] bg-gradient-to-bl from-indigo-100 to-transparent rounded-full blur-[105px]" />
                </div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <button
                        onClick={() => { setView("grid"); setGeneratedContent(null); setTopic(""); }}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition mb-8 font-bold text-sm"
                    >
                        <ChevronRight className="rotate-180" size={16} />
                        Cancel and Return
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${selectedType.bg} ${selectedType.color}`}>
                                    <selectedType.icon size={28} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800">Generating {selectedType.name}</h2>
                                <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                                    Tell AI what this lead magnet is about. The more specific you are, the better the PDF will be.
                                </p>

                                <div className="mt-8 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-700 uppercase tracking-widest px-1">Main Topic / Goal</label>
                                        <textarea
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all min-h-[140px] font-medium"
                                            placeholder="e.g., A checklist for first-time home buyers in California..."
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !topic.trim()}
                                        className="w-full btn btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 group"
                                    >
                                        {isGenerating ? <Sparkles className="animate-spin" /> : <Wand2 className="group-hover:rotate-12 transition-transform" />}
                                        {isGenerating ? "Drafting Content..." : "Start AI Generation"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            {generatedContent ? (
                                <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
                                    <div className="bg-slate-900 px-8 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ribon Document Preview</span>
                                    </div>

                                    <div className="p-10 min-h-[600px] flex flex-col">
                                        <div className="mb-10 pb-10 border-b border-slate-100 italic text-slate-400 text-xs">
                                            {generatedContent.date} &bull; Generated Draft
                                        </div>

                                        <h1 className="text-4xl font-black text-slate-900 mb-8 leading-tight">
                                            {generatedContent.title}
                                        </h1>

                                        <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                            {generatedContent.content}
                                        </div>

                                        <div className="mt-auto pt-10 flex gap-4">
                                            <button className="flex-1 btn btn-primary py-3 rounded-xl flex items-center justify-center gap-2">
                                                <Download size={18} />
                                                Download PDF
                                            </button>
                                            <button className="flex-1 btn btn-secondary py-3 rounded-xl flex items-center justify-center gap-2">
                                                <Eye size={18} />
                                                Full Preview
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full min-h-[500px] bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-10">
                                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-6 text-slate-200">
                                        <FileText size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-400">Preview will appear here</h3>
                                    <p className="text-xs text-slate-400 max-w-xs mt-2 italic font-medium">Use the left panel to define your strategy and watch the AI build your lead magnet in real-time.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6 relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-7%] w-[40%] h-[40%] bg-gradient-to-bl from-emerald-100 to-transparent rounded-full blur-[95px] animate-pulse" />
                <div className="absolute bottom-[-12%] left-[-5%] w-[38%] h-[38%] bg-gradient-to-tr from-blue-100 to-transparent rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '700ms' }} />
            </div>

            <div className="w-full flex flex-col gap-6 relative z-10">
                <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="px-8 py-10 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden">
                        <Magnet className="absolute top-4 right-8 text-emerald-400/10 w-32 h-32 rotate-12 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20 mb-3">
                                Lead Capture Engine
                            </div>
                            <h2 className="text-2xl font-black text-white">Lead Magnets</h2>
                            <p className="mt-1 text-sm font-medium text-slate-400 max-w-2xl">
                                Convert your social media reach into email subscribers. Create high-value digital assets in minutes.
                            </p>
                        </div>

                        <button className="relative z-10 btn btn-primary px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-xl hover:scale-105 transition-all text-white bg-emerald-600 border-emerald-500 hover:bg-emerald-700">
                            <Plus size={20} />
                            New Asset
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
                        {MAGNET_TYPES.map((type) => (
                            <div
                                key={type.id}
                                className="group bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden flex flex-col"
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${type.bg}`} />

                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${type.bg} ${type.color}`}>
                                    <type.icon size={32} />
                                </div>

                                <h3 className="text-2xl font-black text-slate-800 mb-3">{type.name}</h3>
                                <p className="text-sm font-semibold text-slate-400 group-hover:text-slate-600 transition-colors leading-relaxed mb-10">
                                    {type.description}
                                </p>

                                <button
                                    onClick={() => { setSelectedType(type); setView("create"); }}
                                    className={`mt-auto w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${type.bg} ${type.color} group-hover:bg-opacity-100 hover:brightness-95`}
                                >
                                    Create Now
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Recent Assets Section Mock */}
                    <div className="mt-12 bg-white/40 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-10">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <FileCheck className="text-emerald-500" />
                                Your Library
                            </h3>
                            <button className="text-xs font-bold text-slate-400 hover:text-slate-600 transition">View All Assets</button>
                        </div>

                        <div className="flex flex-col items-center justify-center py-10 opacity-60">
                            <FileText size={48} className="text-slate-200 mb-4" />
                            <p className="text-sm font-bold text-slate-300">No assets created yet.</p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
