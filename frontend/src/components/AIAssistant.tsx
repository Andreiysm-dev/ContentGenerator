import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, Zap, Target, Layout, RefreshCw, PanelRightClose, PanelRightOpen, MessageSquare, Terminal, Paperclip, FileText, Mic, MicOff, AlertCircle } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    plan?: any[];
    attachment?: {
        name: string;
        type: string;
    };
}

interface AIAssistantProps {
    activeCompanyId: string | null | undefined;
    authedFetch: (url: string, init?: RequestInit) => Promise<Response>;
    navigate: (path: string) => void;
    notify: (msg: string, tone?: any) => void;
    extraContext?: any;
    onRefresh?: () => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onApplyPlan?: (plan: any[]) => void;
}

export function AIAssistant({
    activeCompanyId,
    authedFetch,
    navigate,
    notify,
    extraContext,
    onRefresh,
    isOpen,
    setIsOpen,
    onApplyPlan
}: AIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; content?: string } | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            notify("File too large (max 5MB)", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setSelectedFile({
                name: file.name,
                type: file.type,
                content: content
            });
        };

        if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.txt')) {
            reader.readAsText(file);
        } else {
            // For now only support text-based context
            setSelectedFile({
                name: file.name,
                type: file.type
            });
            notify("Note: Non-text files are sent as metadata only for now.", "info");
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
            notify("Speech recognition not supported in this browser.", "error");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleSendMessage = async (overrideMessage?: string) => {
        const textToSend = (overrideMessage || inputValue).trim();
        if (!textToSend || !activeCompanyId) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend,
            timestamp: new Date(),
            attachment: selectedFile ? { name: selectedFile.name, type: selectedFile.type } : undefined
        };

        setMessages(prev => [...prev, userMsg]);
        const currentFile = selectedFile;
        setSelectedFile(null);
        if (!overrideMessage) setInputValue('');
        setIsTyping(true);

        try {
            const res = await authedFetch(`/api/assistant/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-company-id': activeCompanyId
                },
                body: JSON.stringify({
                    message: userMsg.content,
                    history: messages,
                    currentPage: window.location.pathname,
                    extraContext: {
                        ...extraContext,
                        fileContext: currentFile ? {
                            name: currentFile.name,
                            type: currentFile.type,
                            content: currentFile.content
                        } : null
                    }
                })
            });

            if (!res.ok) throw new Error('Failed to reach assistant');

            const data = await res.json();

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                plan: data.intent === 'CREATE_PLAN' ? data.payload : undefined
            };

            setMessages(prev => [...prev, assistantMsg]);

            // Handle Intents
            if (data.intent === 'NAVIGATE' && data.payload) {
                notify(`Navigating to ${data.payload}...`, 'info');
                navigate(data.payload);
            } else if (data.intent === 'UPDATE_BRAND' || data.intent === 'UPDATE_DMP') {
                notify("Success! " + data.message, "success");
                if (onRefresh) onRefresh();
            } else if (data.intent === 'CREATE_PLAN') {
                notify("Action Plan Generated!", "success");
            } else if (data.intent === 'REFRESH') {
                if (onRefresh) onRefresh();
            }

        } catch (err: any) {
            notify(err.message || 'Assistant error', 'error');
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] group border border-white/10"
                title="Command Center (⌘+K)"
            >
                <Terminal size={24} className="group-hover:text-blue-400 transition-colors" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
            </button>
        );
    }

    return (
        <div className="fixed top-[64px] right-0 bottom-0 w-[400px] bg-white border-l border-slate-200 flex flex-col z-[100] shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <header className="px-5 py-4 flex items-center justify-between bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg">
                        <Terminal size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Command Center</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight -mt-0.5">Autonomous Agent</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                        title="Close Panel"
                    >
                        <PanelRightClose size={18} />
                    </button>
                </div>
            </header>

            {/* Chat Body */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-5 space-y-5 bg-white custom-scrollbar"
            >
                {messages.length === 0 && (
                    <div className="space-y-6 pt-2">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/10">
                                <Sparkles size={20} className="text-blue-600" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">How can I help?</h4>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                    I am your central hub for automation. I can navigate the app, update brand identities, or refine your image prompts.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Suggested Commands</h5>
                            <div className="grid gap-2">
                                {[
                                    { icon: Layout, label: "View Content Calendar", text: "What's my schedule looking like?" },
                                    { icon: Zap, label: "Review Writing Style", text: "How is our writing style defined right now?" },
                                    { icon: Target, label: "Optimize Brand Pack", text: "Propose a more professional writing style for our brand." }
                                ].map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInputValue(s.text);
                                            setTimeout(() => handleSendMessage(s.text), 0);
                                        }}
                                        className="flex items-center justify-between w-full p-3 text-left bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <s.icon size={14} />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{s.label}</span>
                                        </div>
                                        <Terminal size={12} className="text-slate-200 group-hover:text-slate-400" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
                    >
                        <div className={`flex items-center gap-2 mb-1.5 px-1`}>
                            {m.role === 'assistant' && (
                                <div className="p-1 bg-slate-900 rounded shadow-sm">
                                    <Terminal size={10} className="text-blue-400" />
                                </div>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {m.role === 'user' ? 'You' : 'Assistant'}
                            </span>
                        </div>
                        <div className={`max-w-[92%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${m.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                            : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none font-semibold'
                            }`}>
                            {m.attachment && (
                                <div className={`flex items-center gap-2 mb-2 p-2 rounded-lg border ${m.role === 'user' ? 'bg-blue-700/50 border-blue-400/30' : 'bg-slate-100 border-slate-200'}`}>
                                    <FileText size={14} className={m.role === 'user' ? 'text-blue-200' : 'text-slate-400'} />
                                    <span className="text-[10px] font-bold truncate max-w-[150px]">{m.attachment.name}</span>
                                </div>
                            )}
                            {m.content}

                            {m.plan && m.plan.length > 0 && (
                                <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Proposed Strategy</span>
                                        <button
                                            onClick={() => onApplyPlan && onApplyPlan(m.plan!)}
                                            className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded uppercase tracking-tighter hover:bg-blue-700 transition"
                                        >
                                            Apply All
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                        {m.plan.map((item, idx) => (
                                            <div key={idx} className="p-2 bg-white border border-slate-100 rounded-lg text-[11px]">
                                                <div className="flex justify-between font-black text-slate-400 uppercase tracking-tighter mb-1">
                                                    <span>{item.date}</span>
                                                    <span className="text-blue-500">{item.contentType}</span>
                                                </div>
                                                <div className="text-slate-900 leading-tight">{item.theme}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2 mb-1.5 px-1">
                            <div className="p-1 bg-slate-900 rounded shadow-sm">
                                <Terminal size={10} className="text-blue-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thinking...</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-5 bg-white border-t border-slate-100">
                {selectedFile && (
                    <div className="mb-3 flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-xl animate-in slide-in-from-bottom-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                <FileText size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-blue-900 uppercase tracking-tighter truncate max-w-[200px]">{selectedFile.name}</span>
                                <span className="text-[9px] text-blue-500 font-bold uppercase">{selectedFile.type || 'Document'}</span>
                            </div>
                        </div>
                        <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-blue-200 rounded-full text-blue-400 transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                )}
                <div className="relative group">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Enter command..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 pr-20 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/40 outline-none transition-all resize-none min-h-[56px] max-h-48 scrollbar-hide"
                        rows={1}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Attach context file"
                        >
                            <Paperclip size={18} />
                        </button>
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={(!inputValue.trim() && !selectedFile) || isTyping}
                            className="p-2 bg-slate-900 text-white rounded-lg hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/10"
                        >
                            {isTyping ? <RefreshCw size={18} className="animate-spin text-blue-400" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                        <button
                            onClick={toggleListening}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${isListening
                                ? 'bg-red-50 text-red-600 animate-pulse'
                                : 'hover:bg-slate-100 text-slate-400'
                                }`}
                        >
                            {isListening ? (
                                <>
                                    <MicOff size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Stop Listening</span>
                                </>
                            ) : (
                                <>
                                    <Mic size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Dictate Command</span>
                                </>
                            )}
                        </button>
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Press Enter to Send</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-100/50">
                        <AlertCircle size={10} className="text-slate-400" />
                        <span className="text-[9px] font-medium text-slate-500 italic">
                            AI may make mistakes. Please verify important strategies.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ArrowRight = ({ size }: { size: number }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);
