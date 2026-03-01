"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2, User, Bot, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

const formatMessage = (content: string) => {
    if (!content) return null;
    const boldRegex = /\*\*(.*?)\*\*/g;
    const paragraphs = content.split('\n');

    return paragraphs.map((par, i) => {
        if (!par.trim()) return <br key={i} />;

        if (par.trim().startsWith('* ') || par.trim().startsWith('- ')) {
            const text = par.replace(/^[\*\-]\s+/, '');
            const parts = text.split(boldRegex);
            return (
                <li key={i} className="ml-4 list-disc mb-1">
                    {parts.map((p, j) => {
                        if (p === undefined || p === null) return null;
                        return j % 2 === 1 ? <strong key={j} className="text-white font-bold">{p}</strong> : p;
                    })}
                </li>
            );
        }

        const parts = par.split(boldRegex);
        return (
            <p key={i} className="mb-2 last:mb-0">
                {parts.map((p, j) => {
                    if (p === undefined || p === null) return null;
                    return j % 2 === 1 ? <strong key={j} className="text-white font-bold">{p}</strong> : p;
                })}
            </p>
        );
    });
};

export function AIChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Olá! Sou seu assistente MyLife AI. Como posso ajudar com suas finanças hoje?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, userMsg] }),
            });

            if (!response.ok) throw new Error("Falha ao conectar");

            const data = await response.json();
            const assistantMsg = data.content || "Desculpe, não consegui processar sua mensagem.";

            setMessages(prev => [...prev, { role: "assistant", content: assistantMsg }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "assistant", content: "Desculpe, tive um problema técnico. Pode tentar novamente?" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Panel */}
            {isOpen && (
                <div className="mb-4 w-[350px] md:w-[400px] h-[550px] glass overflow-hidden flex flex-col shadow-2xl border border-cyan-500/20 chat-panel-enter">
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 bg-cyan-500/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-cyan-400 ai-glow-badge" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-tighter">MyLife AI Assistant</h4>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] text-zinc-400 font-bold uppercase">Online & Pronto</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
                        >
                            <Minimize2 className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar"
                    >
                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn(
                                "flex gap-3 max-w-[85%]",
                                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}>
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                    msg.role === "user" ? "bg-white/5" : "bg-cyan-500/10"
                                )}>
                                    {msg.role === "user" ? <User className="h-4 w-4 text-zinc-400" /> : <Bot className="h-4 w-4 text-cyan-400" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl text-xs leading-relaxed",
                                    msg.role === "user" ? "bg-white/10 text-white rounded-tr-none" : "bg-white/5 text-zinc-300 rounded-tl-none border border-white/5"
                                )}>
                                    {msg.role === "user" ? msg.content : formatMessage(msg.content)}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-3 max-w-[85%] mr-auto">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-cyan-500/10">
                                    <Bot className="h-4 w-4 text-cyan-400" />
                                </div>
                                <div className="p-3 rounded-2xl text-xs leading-relaxed bg-white/5 text-zinc-200 rounded-tl-none border border-white/5 flex items-center h-[38px]">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/5 bg-zinc-950/50">
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Pergunte qualquer coisa sobre suas finanças..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="absolute right-2 p-2 bg-cyan-500 rounded-lg text-zinc-950 hover:brightness-110 transition-all disabled:opacity-50 disabled:grayscale"
                            >
                                <Send className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-center text-[8px] text-zinc-600 mt-3 uppercase font-bold tracking-widest">
                            AI pode cometer erros. Revise informações importantes.
                        </p>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl",
                    isOpen ? "bg-zinc-800 text-white" : "bg-cyan-500 text-zinc-950 ai-fab-glow"
                )}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                {!isOpen && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-900 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                )}
            </button>
        </div>
    );
}
