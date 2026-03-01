"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Loader2 } from "lucide-react";

interface Insight {
    type: "saving" | "alert" | "opportunity";
    icon: string;
    title: string;
    description: string;
    actionLabel: string;
    accentColor: string;
}

const colorConfig = {
    saving: {
        borderClass: "border-cyan-500/20 hover:border-cyan-500/40",
        iconBg: "bg-cyan-500/20",
        iconText: "text-cyan-400",
        titleText: "text-cyan-400",
        btnClass: "bg-cyan-400 text-zinc-950 hover:brightness-110",
    },
    alert: {
        borderClass: "border-orange-500/20 hover:border-orange-500/40",
        iconBg: "bg-orange-500/20",
        iconText: "text-orange-400",
        titleText: "text-orange-400",
        btnClass: "bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30",
    },
    opportunity: {
        borderClass: "border-blue-500/20 hover:border-blue-500/40",
        iconBg: "bg-blue-500/20",
        iconText: "text-blue-400",
        titleText: "text-blue-400",
        btnClass: "bg-blue-500 text-white hover:brightness-110",
    },
};

const iconMap = {
    saving: Sparkles,
    alert: AlertTriangle,
    opportunity: TrendingUp,
};

export function AIInsights() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/ai/insights")
            .then(res => res.json())
            .then(data => setInsights(data.insights || []))
            .catch(() => setInsights([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <section className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                    <Lightbulb className="h-6 w-6 text-cyan-400" />
                    <h4 className="font-bold text-base uppercase tracking-wider text-zinc-200">Insights da Inteligência</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-vibrant p-6 rounded-2xl animate-pulse">
                            <div className="flex gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/10" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-white/10 rounded w-24" />
                                    <div className="h-3 bg-white/10 rounded w-full" />
                                    <div className="h-3 bg-white/10 rounded w-3/4" />
                                </div>
                            </div>
                            <div className="h-9 bg-white/10 rounded-lg" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (insights.length === 0) return null;

    return (
        <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
                <Lightbulb className="h-6 w-6 text-cyan-400" />
                <h4 className="font-bold text-base uppercase tracking-wider text-zinc-200">Insights da Inteligência</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {insights.map((insight, idx) => {
                    const config = colorConfig[insight.type] || colorConfig.saving;
                    const Icon = iconMap[insight.type] || Sparkles;
                    return (
                        <div
                            key={idx}
                            className={`glass-vibrant p-6 rounded-2xl flex flex-col justify-between transition-all cursor-pointer ${config.borderClass}`}
                        >
                            <div className="flex gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}>
                                    <Icon className={`h-5 w-5 ${config.iconText}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className={`text-xs font-black ${config.titleText} uppercase tracking-tight`}>{insight.title}</h5>
                                    <p className="text-sm text-zinc-300 leading-tight mt-1.5">{insight.description}</p>
                                </div>
                            </div>
                            <button className={`w-full text-[10px] font-black py-2.5 rounded-lg uppercase ${config.btnClass} transition-all`}>
                                {insight.actionLabel}
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
