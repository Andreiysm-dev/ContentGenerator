import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, RefreshCw, X } from "lucide-react";
import { useParams } from "react-router-dom";

interface Message {
    role: "user" | "ai";
    content: string;
    timestamp: Date;
}

interface DMPAIChatProps {
    contentCalendarId: string;
    currentDmp: string;
    onUpdateDmp: (updatedDmp: string) => void;
    notify: (message: string, tone?: "success" | "error" | "info") => void;
    authedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    onClose?: () => void;
}

export function DMPAIChat({ contentCalendarId, currentDmp, onUpdateDmp, notify, authedFetch, onClose }: DMPAIChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "ai",
            content: "Hi! I'm your Design Assistant. How can I help you refine this image prompt? You can ask me to change colors, add details, or update the text.",
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

            const response = await authedFetch(`${backendBaseUrl}/api/content-calendar/${contentCalendarId}/dmp-chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: userMessage,
                    currentDmp: currentDmp
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to get AI response");
            }

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: "ai",
                content: data.response,
                timestamp: new Date()
            }]);

            if (data.updatedDmp) {
                onUpdateDmp(data.updatedDmp);
                notify("✨ Design Prompt updated!", "success");
            }

        } catch (error: any) {
            console.error("DMP Chat Error:", error);
            setMessages(prev => [...prev, {
                role: "ai",
                content: `I'm sorry, I encountered an error: ${error.message}`,
                timestamp: new Date()
            }]);
            notify("Failed to process your request.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[400px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
            {/* Header */}
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">AI Assistant</span>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={14} className="text-slate-400" />
                    </button>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-blue-600 text-white"
                                }`}>
                                {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
                            </div>
                            <div className={`p-3 rounded-xl text-xs font-medium leading-relaxed ${msg.role === "user"
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
                        <div className="flex gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                <Bot size={12} />
                            </div>
                            <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none flex items-center gap-2">
                                <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-200">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Refine prompt..."
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
