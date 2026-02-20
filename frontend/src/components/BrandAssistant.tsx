import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, RefreshCw, X, MessageSquare, Zap, Target, BrainCircuit } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface BrandAssistantProps {
    brandKbId: string;
    currentBrandData: {
        brandPack?: string;
        brandCapability?: string;
        writerAgent?: string;
        reviewPrompt1?: string;
        systemInstruction?: string;
        emojiRule?: string;
    };
    onUpdate: (updatedData: any) => void;
    authedFetch: (url: string, init?: RequestInit) => Promise<Response>;
    notify: (msg: string, tone?: 'success' | 'error' | 'info') => void;
    backendBaseUrl: string;
}

export function BrandAssistant({
    brandKbId,
    currentBrandData,
    onUpdate,
    authedFetch,
    notify,
    backendBaseUrl
}: BrandAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isProcessing]);

    const handleSend = async (overrideMsg?: string) => {
        const textToSend = overrideMsg || message;
        if (!textToSend.trim() || isProcessing) return;

        setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
        if (!overrideMsg) setMessage('');
        setIsProcessing(true);

        try {
            const res = await authedFetch(`${backendBaseUrl}/api/brandkb/${brandKbId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: textToSend,
                    currentBrandData,
                    history: messages
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                if (data.brandKB) {
                    onUpdate(data.brandKB);
                    notify('Brand Core refined by Strategy Assistant', 'success');
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                notify(errorData.error || 'Assistant failed to process request.', 'error');
            }
        } catch (err) {
            console.error('Brand Assistant Error:', err);
            notify('Error communicating with Assistant.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all group"
            >
                <Sparkles size={16} className="group-hover:animate-pulse" />
                Ask Strategy Assistant
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh] border border-slate-200 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <header className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                            <BrainCircuit size={20} className="text-blue-300" />
                        </div>
                        <div>
                            <h3 className="text-base font-black tracking-tight">Strategy Assistant</h3>
                            <p className="text-[10px] font-bold text-blue-300/80 uppercase tracking-widest">Brand Core Intelligence</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300"
                    >
                        <X size={20} />
                    </button>
                </header>

                {/* Chat Body */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30"
                >
                    {messages.length === 0 && (
                        <div className="space-y-6 py-4">
                            <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-xl shadow-blue-500/20 flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                                    <Sparkles size={20} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black uppercase tracking-widest">Strategic Refinement</h4>
                                    <p className="text-sm text-blue-50/90 leading-relaxed font-medium">
                                        Describe how you want your brand to sound, look, or behave. I'll translate your vision into technical rules for the AI components.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    {
                                        icon: Zap,
                                        label: "Make it bolder",
                                        text: "Our current voice is too safe. Make it punchier, more controversial, and use more marketing psychology."
                                    },
                                    {
                                        icon: Target,
                                        label: "Target High-Net-Worth",
                                        text: "Adjust our brand core to target luxury buyers. Use formal, sophisticated language and emphasize exclusivity."
                                    },
                                    {
                                        icon: MessageSquare,
                                        label: "Clean up Emojis",
                                        text: "I want a clean, professional look. Disable all emojis except for bullet points, and keep the tone very serious."
                                    },
                                    {
                                        icon: RefreshCw,
                                        label: "Rewrite AI Guidelines",
                                        text: "The AI is currently too verbose. Update the writer and reviewer prompts to favor brevity and directness."
                                    }
                                ].map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(s.text)}
                                        className="flex flex-col items-start gap-2 p-4 text-left bg-white hover:bg-blue-50 border border-slate-200 rounded-2xl transition-all group hover:border-blue-300 hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-2">
                                            <s.icon size={14} className="text-blue-500" />
                                            <span className="text-xs font-black text-slate-900 group-hover:text-blue-700">{s.label}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium line-clamp-2">{s.text}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-semibold'
                                }`}>
                                <div className="whitespace-pre-wrap">{m.content}</div>
                            </div>
                        </div>
                    ))}

                    {isProcessing && (
                        <div className="flex flex-col items-start animate-in fade-in duration-300">
                            <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analyzing Brand Strategy...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-slate-100">
                    <div className="relative">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Describe your brand changes..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pr-16 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all resize-none min-h-[64px] max-h-32"
                            rows={1}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!message.trim() || isProcessing}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 disabled:opacity-20 transition-all shadow-lg"
                        >
                            {isProcessing ? <RefreshCw size={18} className="animate-spin text-blue-400" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
