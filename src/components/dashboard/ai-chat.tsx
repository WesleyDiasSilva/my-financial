"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2, User, Bot, Minimize2, CreditCard, Target, CheckCircle2, Activity, Tags, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createGoal } from "@/actions/goal";
import { createTransactionsBatch } from "@/actions/transaction";
import { toast } from "sonner";

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

const parseActions = (content: string) => {
    let cleanContent = content || "";
    let actions: { type: string; payload: string[] }[] = [];

    const actionsMatch = content.match(/<ACTIONS>([\s\S]*?)<\/ACTIONS>/i);
    if (actionsMatch && actionsMatch[1]) {
        try {
            const rawActions = JSON.parse(actionsMatch[1].trim());
            if (Array.isArray(rawActions)) {
                actions = rawActions.filter(a => a.type && Array.isArray(a.payload));
            }
        } catch (error) {
            console.error("Falha ao parsear bloco JSON de Ações", error);
        }
        cleanContent = cleanContent.replace(actionsMatch[0], '');
    }

    return { cleanContent: cleanContent.trim(), actions };
};

export function AIChat() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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

    const handleCreateGoal = (name: string, targetAmount: number, msgIdx: number) => {
        startTransition(async () => {
            try {
                await createGoal({
                    name,
                    targetAmount,
                    currentAmount: 0,
                    icon: "🎯",
                    color: "cyan",
                });
                setActionSuccess(`goal-${msgIdx}`);
                setMessages(prev => [...prev, { role: "assistant", content: `Pronto! A meta "${name}" de R$ ${targetAmount.toLocaleString('pt-BR')} foi criada com sucesso.` }]);
            } catch (error) {
                console.error(error);
                toast.error("Erro ao criar meta.");
            }
        });
    };

    const handleExecuteBatchTx = (txActions: any[], msgIdx: number) => {
        startTransition(async () => {
            try {
                const items = txActions.map(action => {
                    if (action.type === 'CREATE_ACCOUNT_TX') {
                        return {
                            type: (action.payload[0] as "INCOME" | "EXPENSE") || "EXPENSE",
                            amount: Number(action.payload[1]) || 0,
                            description: action.payload[2] || "Lançamento",
                            date: action.payload[3] ? new Date(action.payload[3] + "T12:00:00") : new Date(),
                            categoryId: action.payload[4] || null,
                            accountId: action.payload[5] || null,
                            isPaid: true,
                        };
                    } else {
                        // CREATE_CARD_TX
                        return {
                            type: "EXPENSE" as const,
                            amount: Number(action.payload[0]) || 0,
                            description: action.payload[1] || "Gasto Cartão",
                            date: action.payload[2] ? new Date(action.payload[2] + "T12:00:00") : new Date(),
                            categoryId: action.payload[3] || null,
                            creditCardId: action.payload[4] || null,
                            isPaid: false,
                        };
                    }
                });

                await createTransactionsBatch(items);
                setActionSuccess(`batchtx-${msgIdx}`);
                setMessages(prev => [...prev, { role: "assistant", content: `Pronto! ${txActions.length} lançamento(s) realizados com sucesso.` }]);
            } catch (error) {
                console.error(error);
                toast.error("Erro ao lançar transações em lote.");
            }
        });
    };

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
                        {messages.map((msg, idx) => {
                            const { cleanContent, actions } = msg.role === "assistant" ? parseActions(msg.content) : { cleanContent: msg.content, actions: [] };

                            return (
                                <div key={idx} className={cn("flex flex-col gap-1 w-full")}>
                                    <div className={cn(
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
                                            {msg.role === "user" ? msg.content : formatMessage(cleanContent)}
                                        </div>
                                    </div>

                                    {actions.length > 0 && msg.role === "assistant" && (
                                        <div className="flex flex-col gap-2 mt-1 ml-11 max-w-[85%]">
                                            {(() => {
                                                const txActions = actions.filter(a => a.type === 'CREATE_ACCOUNT_TX' || a.type === 'CREATE_CARD_TX');
                                                const otherActions = actions.filter(a => a.type !== 'CREATE_ACCOUNT_TX' && a.type !== 'CREATE_CARD_TX');

                                                return (
                                                    <>
                                                        {txActions.length > 0 && (
                                                            <div className="glass border border-emerald-500/20 rounded-xl p-3 flex flex-col gap-2">
                                                                <div className="flex items-start gap-2">
                                                                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1">
                                                                        <Activity className="h-3 w-3 text-emerald-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase">Lançamentos em Lote ({txActions.length})</p>
                                                                        <div className="flex flex-col gap-1 mt-1">
                                                                            {txActions.map((a, i) => {
                                                                                const isAccount = a.type === 'CREATE_ACCOUNT_TX';
                                                                                const amount = Number(a.payload[isAccount ? 1 : 0]) || 0;
                                                                                const desc = a.payload[isAccount ? 2 : 1] || "Transação";
                                                                                return <p key={i} className="text-[11px] font-medium text-white">• {desc} - {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleExecuteBatchTx(txActions, idx)}
                                                                    disabled={isPending || actionSuccess === `batchtx-${idx}`}
                                                                    className="w-full mt-2 cursor-pointer text-xs font-bold py-2 bg-emerald-500 text-zinc-950 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                                >
                                                                    {actionSuccess === `batchtx-${idx}` ? (
                                                                        <><CheckCircle2 className="h-3.5 w-3.5" /> Transações Confirmadas</>
                                                                    ) : isPending ? (
                                                                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...</>
                                                                    ) : (
                                                                        "Confirmar Lançamentos"
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {otherActions.map((action, aIdx) => {
                                                            if (action.type === 'CREATE_GOAL') {
                                                                const name = action.payload[0] || 'Nova Meta';
                                                                const amount = Number(action.payload[1]) || 0;
                                                                const isDone = actionSuccess === `goal-${idx}`;

                                                                return (
                                                                    <div key={aIdx} className="glass border border-cyan-500/20 rounded-xl p-3 flex flex-col gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-6 h-6 rounded-md bg-cyan-500/20 flex items-center justify-center shrink-0">
                                                                                <Target className="h-3 w-3 text-cyan-400" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-bold text-zinc-400 uppercase">Sugestão de Meta</p>
                                                                                <p className="text-xs font-medium text-white">{name} - {amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleCreateGoal(name, amount, idx)}
                                                                            disabled={isPending || isDone}
                                                                            className="w-full cursor-pointer text-xs font-bold py-2 bg-cyan-500 text-zinc-950 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                                        >
                                                                            {isDone ? (
                                                                                <><CheckCircle2 className="h-3.5 w-3.5" /> Meta Criada</>
                                                                            ) : isPending ? (
                                                                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Criando...</>
                                                                            ) : (
                                                                                "Criar esta Meta"
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            }

                                                            if (action.type === 'GO_TO_CARDS') {
                                                                return (
                                                                    <button
                                                                        key={aIdx}
                                                                        onClick={() => router.push('/credit-cards')}
                                                                        className="glass cursor-pointer border border-purple-500/20 rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                                                                            <CreditCard className="h-4 w-4 text-purple-400" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="text-xs font-bold text-white flex items-center gap-2">Acessar Cartões de Crédito <ArrowRight className="h-3 w-3 ml-auto text-zinc-500" /></p>
                                                                            <p className="text-[10px] text-zinc-400">Ver faturas e limites</p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            }

                                                            if (action.type === 'GO_TO_TRANSACTIONS') {
                                                                return (
                                                                    <button
                                                                        key={aIdx}
                                                                        onClick={() => router.push('/transactions')}
                                                                        className="glass cursor-pointer border border-cyan-500/20 rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                                                                            <Activity className="h-4 w-4 text-cyan-400" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="text-xs font-bold text-white flex items-center gap-2">Histórico de Transações <ArrowRight className="h-3 w-3 ml-auto text-zinc-500" /></p>
                                                                            <p className="text-[10px] text-zinc-400">Ver todas as despesas e receitas</p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            }

                                                            if (action.type === 'GO_TO_CATEGORIES') {
                                                                return (
                                                                    <button
                                                                        key={aIdx}
                                                                        onClick={() => router.push('/planning')}
                                                                        className="glass cursor-pointer border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                                            <Tags className="h-4 w-4 text-emerald-400" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="text-xs font-bold text-white flex items-center gap-2">Configurar Categorias <ArrowRight className="h-3 w-3 ml-auto text-zinc-500" /></p>
                                                                            <p className="text-[10px] text-zinc-400">Editar nomes e limites de gastos</p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            }

                                                            return null;
                                                        })}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

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
