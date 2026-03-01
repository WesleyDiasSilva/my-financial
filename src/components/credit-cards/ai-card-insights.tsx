"use client";

import { useEffect, useState } from "react";
import { Sparkles, Lightbulb, Loader2, ArrowRight, TrendingUp, Zap } from "lucide-react";
import { getCreditCardInsights, CardInsight } from "@/actions/ai-credit-cards";
import { cn } from "@/lib/utils";

export function AICardInsights() {
    const [insights, setInsights] = useState<CardInsight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await getCreditCardInsights();
                setInsights(res.insights || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    if (loading) {
        return (
            <div className="w-full mb-8">
                <div className="glass-vibrant p-8 rounded-3xl border border-white/5 animate-pulse">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-zinc-500" />
                        </div>
                        <div className="h-4 bg-white/10 rounded w-48" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2].map(i => (
                            <div key={i} className="space-y-4">
                                <div className="h-6 bg-white/10 rounded w-3/4" />
                                <div className="h-3 bg-white/10 rounded w-full" />
                                <div className="h-3 bg-white/10 rounded w-5/6" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (insights.length === 0) return null;

    return (
        <div className="w-full mb-10 overflow-hidden">
            <div className="relative glass-vibrant p-8 rounded-3xl border border-indigo-500/20 shadow-2xl group transition-all duration-500 hover:border-indigo-500/40">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Sparkles className="w-32 h-32 text-indigo-400" />
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-indigo-500/10 shadow-lg">
                        <Zap className="h-6 w-6 text-indigo-400 ai-glow" />
                    </div>
                    <div>
                        <h4 className="font-black text-lg uppercase tracking-tight text-white leading-none">Smart Card Insights</h4>
                        <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">Análise estratégica em tempo real</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative">
                    {insights.map((insight, idx) => (
                        <div key={idx} className={cn(
                            "relative flex flex-col justify-between",
                            idx === 0 && "md:border-r md:border-white/5 md:pr-10"
                        )}>
                            <div>
                                <h5 className="text-sm font-black text-indigo-400 uppercase tracking-tight mb-3 flex items-center gap-2">
                                    {insight.type === "recommendation" ? <TrendingUp className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                                    {insight.title}
                                </h5>
                                <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                                    {insight.description}
                                </p>
                            </div>

                            {insight.actionLabel && (
                                <button className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-all group/btn w-fit">
                                    {insight.actionLabel}
                                    <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
            </div>
        </div>
    );
}
