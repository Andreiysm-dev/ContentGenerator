import React, { useState } from "react";
import { Zap, Hash, UserCircle, MessageSquare, ArrowRight, Sparkles, Copy, Check, ChevronLeft } from "lucide-react";

interface Tool {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
    bg: string;
    prompt: string;
    placeholder: string;
}

const TOOLS: Tool[] = [
    {
        id: "hook",
        name: "Hook Generator",
        description: "Create 5 scroll-stopping headlines for your next post.",
        icon: Zap,
        color: "text-amber-500",
        bg: "bg-amber-50",
        prompt: "Generate 5 viral hooks for a social media post about:",
        placeholder: "Topic (e.g., Why remote work is the future...)"
    },
    {
        id: "bio",
        name: "Bio Optimizer",
        description: "Refine your social media bios for maximum conversion.",
        icon: UserCircle,
        color: "text-blue-500",
        bg: "bg-blue-50",
        prompt: "Optimize a professional social media bio for:",
        placeholder: "Current bio or description of what you do..."
    },
    {
        id: "hashtag",
        name: "Hashtag Strategist",
        description: "Generate a mix of reach and niche-specific hashtags.",
        icon: Hash,
        color: "text-purple-500",
        bg: "bg-purple-50",
        prompt: "Suggest 20 relevant hashtags (mix of trending and niche) for:",
        placeholder: "Post topic or niche..."
    },
    {
        id: "reply",
        name: "Smart Reply",
        description: "Generate thoughtful replies to increase engagement.",
        icon: MessageSquare,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        prompt: "Generate a thoughtful, engaging reply to this comment:",
        placeholder: "Paste the comment you want to reply to..."
    }
];

export function AIToolboxPage() {
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        if (!input.trim() || !selectedTool) return;

        setIsGenerating(true);
        try {
            // For now, we'll use a local mock or call the existing caption gen if possible
            // In a real implementation, this would call a dedicated /api/tools endpoint
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/generate-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `${selectedTool.prompt}\n\n"${input}"\n\nFollow the brand voice rules if applicable.`,
                    noStream: true // Assuming backend can handle a single response
                })
            });

            const data = await response.json();
            setOutput(data.content || data.suggestion || "No response. Please try again.");
        } catch (err) {
            console.error(err);
            setOutput("Error generating content. Please check your connection.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (selectedTool) {
        return (
            <main className="flex-1 overflow-y-auto bg-gray-50/50 p-2.5 md:p-6 relative">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className={`absolute top-[-10%] right-[-7%] w-[40%] h-[40%] bg-gradient-to-bl from-blue-100 to-transparent rounded-full blur-[95px]`} />
                </div>

                <div className="max-w-4xl mx-auto flex flex-col h-full relative z-10">
                    <button
                        onClick={() => { setSelectedTool(null); setOutput(""); setInput(""); }}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition mb-6 font-bold text-sm bg-white w-fit px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
                    >
                        <ChevronLeft size={16} />
                        Back to Toolbox
                    </button>

                    <div className="bg-white border border-slate-200/60 rounded-3xl shadow-md overflow-hidden flex flex-col">
                        <div className={`px-8 py-6 flex items-center gap-5 border-b border-slate-100 ${selectedTool.bg}`}>
                            <div className={`p-3 rounded-2xl bg-white shadow-sm ${selectedTool.color}`}>
                                <selectedTool.icon size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800">{selectedTool.name}</h2>
                                <p className="text-sm font-medium text-slate-500">{selectedTool.description}</p>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-700 uppercase tracking-wider pl-1">What are we working on?</label>
                                <textarea
                                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all min-h-[120px] font-medium"
                                    placeholder={selectedTool.placeholder}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !input.trim()}
                                className="w-full btn btn-primary py-4 rounded-2xl flex items-center justify-center gap-3 text-lg group"
                            >
                                {isGenerating ? (
                                    <Sparkles className="animate-spin h-5 w-5" />
                                ) : (
                                    <Sparkles className="h-5 w-5 group-hover:scale-125 transition-transform" />
                                )}
                                {isGenerating ? "Generating Magic..." : "Generate with AI"}
                            </button>

                            {(output || isGenerating) && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between pl-1">
                                        <label className="text-sm font-black text-slate-700 uppercase tracking-wider">The Result</label>
                                        {output && (
                                            <button
                                                onClick={handleCopy}
                                                className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-600 transition"
                                            >
                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                                {copied ? "Copied!" : "Copy result"}
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <div className={`w-full bg-slate-900 text-slate-100 rounded-2xl p-6 text-sm font-medium leading-relaxed min-h-[100px] whitespace-pre-wrap transition-all shadow-inner ${isGenerating ? "opacity-50 blur-[2px]" : "opacity-100"}`}>
                                            {output || "AI is thinking..."}
                                        </div>
                                        {isGenerating && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="flex gap-1.5">
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:200ms]" />
                                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:400ms]" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                <div className="absolute top-[-10%] right-[-7%] w-[40%] h-[40%] bg-gradient-to-bl from-[#3fa9f5]/17 to-[#6fb6e8]/13 rounded-full blur-[95px] animate-pulse" />
                <div className="absolute bottom-[-12%] left-[-5%] w-[38%] h-[38%] bg-gradient-to-tr from-[#a78bfa]/13 to-[#e5a4e6]/10 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '700ms' }} />
            </div>

            <div className="w-full flex flex-col gap-6 relative z-10">
                <section className="w-full bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="px-8 py-10 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 border-b border-slate-700 flex flex-col gap-2 relative">
                        <Sparkles className="absolute top-8 right-8 text-blue-400/20 w-32 h-32 rotate-12" />
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full w-fit text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mb-2">
                            Turbocharged AI
                        </div>
                        <h2 className="text-2xl font-black text-white">AI Toolbox</h2>
                        <p className="text-slate-400 max-w-xl text-sm font-medium leading-relaxed">
                            A collection of mini-tools designed to tackle specific creative tasks in seconds. Pick a tool and let the magic happen.
                        </p>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                            {TOOLS.map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => setSelectedTool(tool)}
                                    className="group relative bg-white border border-slate-100 p-6 rounded-2xl text-left hover:border-blue-500/30 hover:shadow-xl transition-all duration-300 overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${tool.bg}`} />

                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${tool.bg} ${tool.color}`}>
                                        <tool.icon size={24} />
                                    </div>

                                    <h3 className="text-lg font-black text-slate-800 mb-2">{tool.name}</h3>
                                    <p className="text-xs font-semibold text-slate-400 leading-relaxed group-hover:text-slate-600 transition-colors">
                                        {tool.description}
                                    </p>

                                    <div className="mt-8 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#3fa9f5] opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">Launch Tool</span>
                                        <ArrowRight size={18} className="text-slate-300 group-hover:text-[#3fa9f5] group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
