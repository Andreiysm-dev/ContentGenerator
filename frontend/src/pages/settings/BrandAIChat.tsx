import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare, Bot, User, Trash2, RefreshCw } from "lucide-react";
import { useParams } from "react-router-dom";

interface Message {
    role: "user" | "ai";
    content: string;
    timestamp: Date;
}

interface BrandAIChatProps {
    brandKB: any;
    onUpdateBrandKB: (newKB: any) => void;
    notify: (message: string, tone?: "success" | "error" | "info") => void;
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export function BrandAIChat({ brandKB, onUpdateBrandKB, notify, authedFetch }: BrandAIChatProps) {
    const { companyId } = useParams<{ companyId: string }>();
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            content: "Hi! I'm your Brand Intelligence Assistant. You can ask me questions about your brand or tell me to update your brand rules in natural language. For example: 'Make our writing style more energetic' or 'Our primary colors for images are blue and gold'.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
        setIsLoading(true);

        try {
            const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

            const response = await authedFetch(`${backendBaseUrl}/api/brandkb/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    companyId: decodeURIComponent(companyId || ""),
                    message: userMessage
                })
            });

            if (!response.ok) {
                throw new Error("Failed to get AI response");
            }

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: "ai",
                content: data.response,
                timestamp: new Date()
            }]);

            if (data.updatesApplied) {
                onUpdateBrandKB(data.brandKB);
                notify("✨ Brand Core updated based on your request!", "success");
            }

        } catch (error) {
            console.error("Brand Chat Error:", error);
            setMessages(prev => [...prev, {
                role: "ai",
                content: "I'm sorry, I encountered an error. Please try again later.",
                timestamp: new Date()
            }]);
            notify("Failed to process your request.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">AI Brand Editor</h3>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Natural Language Sync</p>
                    </div>
                </div>
                <button
                    onClick={() => setMessages([messages[0]])}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/50">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`flex gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-blue-600 text-white"
                                }`}>
                                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === "user"
                                ? "bg-slate-900 text-white rounded-tr-none shadow-sm"
                                : "bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm"
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                <Bot size={16} />
                            </div>
                            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Tell AI how to update your brand..."
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-200"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p className="mt-2 text-[10px] text-center font-bold text-slate-400 uppercase tracking-tighter">
                    AI will automatically propose and apply changes to your Brand Core.
                </p>
            </div>
        </div>
    );
}
