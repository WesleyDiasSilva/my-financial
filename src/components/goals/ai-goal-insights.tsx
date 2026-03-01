"use client";

import { useEffect, useState } from "react";
import { Sparkles, Lightbulb, Loader2, ArrowRight, Target, Zap, TrendingUp } from "lucide-react";
import { getGoalInsights, GoalInsight } from "@/actions/ai-goals";
import { cn } from "@/lib/utils";

export function AICoalInsights() {
    const [insight, setInsight] = useState<GoalInsight | null>(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const res = await getGoalInsights();
                setInsight(res);
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
                    <div className="space-y-4">
                        <div className="h-6 bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-white/10 rounded w-full" />
                        <div className="h-3 bg-white/10 rounded w-5/6" />
                    </div>
                </div>
            </div>
        );
    }

    if (!insight) return null;

    return (
        <div className="w-full mb-10 overflow-hidden">
            <div className={cn(
                "relative glass-vibrant rounded-3xl border transition-all duration-500 overflow-hidden",
                isExpanded ? "p-8 border-emerald-500/20 shadow-2xl" : "p-4 border-zinc-800/50 shadow-lg"
            )}>
                {/* Background Decor */}
                {isExpanded && (
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Target className="w-32 h-32 text-emerald-400" />
                    </div>
                )}

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "rounded-2xl flex items-center justify-center border transition-all duration-500",
                            isExpanded ? "w-12 h-12 bg-emerald-500/20 border-emerald-500/30" : "w-10 h-10 bg-zinc-900 border-zinc-800"
                        )}>
                            <Sparkles className={cn(
                                "transition-all duration-500",
                                isExpanded ? "h-6 w-6 text-emerald-400 ai-glow" : "h-5 w-5 text-zinc-500"
                            )} />
                        </div>
                        <div>
                            <h4 className={cn(
                                "font-black tracking-tight text-white leading-none transition-all duration-500",
                                isExpanded ? "text-lg uppercase" : "text-base"
                            )}>
                                {isExpanded ? "Consultoria Estratégica" : insight.title}
                            </h4>
                            {isExpanded && <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Sua IA motivacional financeira</p>}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:text-white transition-colors"
                    >
                        {isExpanded ? "Minimizar" : "Expandir Insight"}
                    </button>
                </div>

                {isExpanded && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative items-center mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="lg:col-span-2 space-y-4">
                            <h5 className="text-xl font-black text-white leading-tight italic">
                                "{insight.title}"
                            </h5>
                            <p className="text-zinc-300 text-base leading-relaxed font-medium">
                                {insight.message}
                            </p>
                        </div>

                        <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl relative overflow-hidden group/sug shadow-inner">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Zap className="w-12 h-12 text-emerald-400" />
                            </div>
                            <h6 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-3 flex items-center gap-2 text-glow-emerald">
                                <TrendingUp className="w-3.5 h-3.5" /> Recomendação IA
                            </h6>
                            <p className="text-zinc-200 text-sm font-bold leading-relaxed relative z-10">
                                {insight.suggestion}
                            </p>
                        </div>
                    </div>
                )}

                {/* Bottom Accent */}
                {isExpanded && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />}
            </div>
        </div>
    );
}
