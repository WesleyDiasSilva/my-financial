"use client";

import { useEffect, useState } from "react";
import { Play, Music, Cloud, Dumbbell, Car, Code, Tv, Gamepad2, BookOpen, Loader2 } from "lucide-react";

interface Subscription {
    name: string;
    category: string;
    amount: number;
    icon: string;
    iconColor: string;
    iconBg: string;
}

const lucideIconMap: Record<string, any> = {
    play: Play,
    play_arrow: Play,
    music: Music,
    music_note: Music,
    cloud: Cloud,
    dumbbell: Dumbbell,
    car: Car,
    code: Code,
    tv: Tv,
    gamepad: Gamepad2,
    book: BookOpen,
};

function getIcon(name: string) {
    const key = name.toLowerCase().replace(/-/g, "_");
    return lucideIconMap[key] || Play;
}

export function SubscriptionsDetected() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [totalMonthly, setTotalMonthly] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/ai/subscriptions")
            .then(res => res.json())
            .then(data => {
                setSubscriptions(data.subscriptions || []);
                setTotalMonthly(data.totalMonthly || 0);
            })
            .catch(() => {
                setSubscriptions([]);
                setTotalMonthly(0);
            })
            .finally(() => setLoading(false));
    }, []);

    const iconColorMap: Record<string, string> = {
        "text-red-500": "text-red-500",
        "text-green-500": "text-green-500",
        "text-blue-500": "text-blue-500",
        "text-purple-500": "text-purple-500",
        "text-orange-500": "text-orange-500",
    };
    const bgColorMap: Record<string, string> = {
        "bg-red-500/20": "bg-red-500/20",
        "bg-green-500/20": "bg-green-500/20",
        "bg-blue-500/20": "bg-blue-500/20",
        "bg-purple-500/20": "bg-purple-500/20",
        "bg-orange-500/20": "bg-orange-500/20",
    };

    return (
        <div className="glass p-8 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight">
                    <Tv className="h-5 w-5 text-purple-400" />
                    Assinaturas
                </h4>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-bold uppercase">
                    Detectado pela AI
                </span>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-8 gap-2">
                    <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                    <span className="text-xs text-zinc-500">Analisando padrões...</span>
                </div>
            ) : subscriptions.length === 0 ? (
                <div className="text-sm text-zinc-500 text-center py-8">
                    Nenhuma assinatura detectada. A IA analisará seus gastos com o tempo.
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {subscriptions.map((sub, idx) => {
                            const IconComponent = getIcon(sub.icon);
                            const textColor = iconColorMap[sub.iconColor] || "text-purple-500";
                            const bgColor = bgColorMap[sub.iconBg] || "bg-purple-500/20";
                            return (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
                                            <IconComponent className={`h-5 w-5 ${textColor}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-100">{sub.name}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase">{sub.category}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-white">
                                        {sub.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    {totalMonthly > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Total mensal</span>
                            <span className="text-sm font-black text-purple-400">
                                {totalMonthly.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                        </div>
                    )}
                    <button className="w-full mt-6 text-[10px] font-black py-3 rounded-lg border border-purple-500/20 hover:bg-purple-500/5 uppercase transition-all tracking-widest text-purple-400">
                        Otimizar Gastos Fixos
                    </button>
                </>
            )}
        </div>
    );
}
