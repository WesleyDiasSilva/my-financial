"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, History, Settings, HelpCircle, ShieldCheck, CheckCircle2, Crown, LayoutDashboard, Loader2 } from "lucide-react";
import { storeSubscriptionPlans } from "@/config/subscriptions";

interface Props {
    subscription: {
        stripeCustomerId: string | null;
        stripeSubscriptionId: string | null;
        stripePriceId: string | null;
        stripeCurrentPeriodEnd: number;
        isPro: boolean;
        planId: string | null;
    };
}

export default function BillingClient({ subscription }: Props) {
    const [activeTab, setActiveTab] = useState("subscription");

    return (
        <div className="flex flex-col h-full bg-[#050a10] text-zinc-100 p-8 pt-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <Crown className="h-8 w-8 text-cyan-400" />
                    Assinatura e Cobrança
                </h1>
            </div>

            <div className="flex gap-4 border-b border-zinc-800 mb-8">
                <button
                    onClick={() => setActiveTab("subscription")}
                    className={`pb-4 px-2 font-semibold transition-colors relative ${activeTab === "subscription" ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Minha Assinatura
                    {activeTab === "subscription" && (
                        <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("plans")}
                    className={`pb-4 px-2 font-semibold transition-colors relative ${activeTab === "plans" ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Planos
                    {activeTab === "plans" && (
                        <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    )}
                </button>
            </div>

            <div className="flex-1 w-full mx-auto">
                {activeTab === "subscription" ? (
                    <SubscriptionOverview subscription={subscription} />
                ) : (
                    <PlansAndHistory subscription={subscription} />
                )}
            </div>
        </div>
    );
}

function SubscriptionOverview({ subscription }: Props) {
    const [isLoading, setIsLoading] = useState(false);

    const activePlan = storeSubscriptionPlans.find(p =>
        p.stripePriceId === subscription.planId ||
        p.stripePriceIdYearly === subscription.planId
    );

    const onManageSubscription = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/stripe/portal", { method: "POST" });
            const data = await res.json();
            window.location.href = data.url;
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!subscription.isPro) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Você não possui um plano ativo</h3>
                    <p className="text-zinc-400 text-sm mb-6">Assine agora para liberar todos os recursos da plataforma.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-zinc-400 text-sm mb-6">
                Gerencie seu plano e métodos de pagamento com segurança criptografada de ponta a ponta.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[40px] group-hover:bg-cyan-500/10 transition-colors -mr-16 -mt-16" />
                    <div className="flex items-start justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                <Crown className="h-5 w-5 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">Plano {activePlan?.name || "Desconhecido"}</h3>
                                <p className="text-xs text-zinc-500">{activePlan?.description || "Ativo"}</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-500/20">
                            Ativo
                        </span>
                    </div>

                    <div className="space-y-4 mb-6 relative z-10">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">Valor da assinatura</span>
                            <span className="font-bold text-white">{activePlan?.priceMonthly || "---"} <span className="text-zinc-500 font-normal">/mês</span></span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-zinc-400">Expiração</span>
                            <span className="font-medium text-white">
                                {new Date(subscription.stripeCurrentPeriodEnd).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    </div>

                    <button onClick={onManageSubscription} disabled={isLoading} className="w-full py-3 rounded-xl border border-zinc-700 text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Gerenciar Assinatura"}
                    </button>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-zinc-400" />
                            Métodos e Faturas
                        </h3>
                    </div>

                    <p className="text-sm text-zinc-400 mb-6">
                        O Stripe gerencia seus métodos de pagamento de forma segura. Você pode adicionar ou alterar seu cartão diretamente pelo portal de faturamento na área acima.
                    </p>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/90 text-xs mt-auto">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        Seus dados estão seguros e criptografados (PCI-DSS).
                    </div>
                </div>
            </div>

            <section className="mt-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <History className="h-5 w-5 text-zinc-400" />
                        Histórico de Faturas
                    </h2>
                    <button onClick={onManageSubscription} disabled={isLoading} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium disabled:opacity-50 transition-colors">
                        Acessar Portal do Stripe
                    </button>
                </div>
                <p className="text-sm text-zinc-400">
                    Para visualizar suas faturas anteriores ou recibos de pagamento, acesse o Portal de Faturamento do Stripe.
                </p>
            </section>
        </div>
    );
}

function PlansAndHistory({ subscription }: Props) {
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
    const router = useRouter();

    const onSubscribe = async (planId: string) => {
        setLoadingPriceId(planId);
        router.push(`/checkout/${planId}?billing=${billing}`);
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section>
                <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                    <h2 className="text-xl font-bold text-white">Mudar de Plano</h2>
                    <div className="flex h-12 w-80 items-center justify-center rounded-full bg-cyan-500/10 p-1 border border-cyan-500/20">
                        <button
                            onClick={() => setBilling("monthly")}
                            className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-4 transition-all text-sm font-bold ${billing === "monthly" ? "bg-cyan-500 text-[#050a10] shadow-sm" : "text-zinc-400"}`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setBilling("yearly")}
                            className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-4 transition-all text-sm font-bold ${billing === "yearly" ? "bg-cyan-500 text-[#050a10] shadow-sm" : "text-zinc-400"}`}
                        >
                            Anual <span className="text-[10px] ml-1 opacity-80">(-20%)</span>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {storeSubscriptionPlans.map((plan) => {
                        const isCurrent = (subscription.isPro && subscription.planId === plan.stripePriceId) || (subscription.isPro && subscription.planId === plan.stripePriceIdYearly) || (!subscription.isPro && plan.id === "essential");
                        return (
                            <div
                                key={plan.id}
                                className={`rounded-2xl p-6 border transition-all h-full flex flex-col ${isCurrent
                                    ? "bg-cyan-950/20 border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.1)] relative"
                                    : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                                    }`}
                            >
                                {isCurrent && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-500 text-[#050a10] text-[10px] font-bold uppercase tracking-widest rounded-full z-10">
                                        Seu Plano Atual
                                    </div>
                                )}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-white mb-2 italic">{plan.name}</h3>
                                    <p className="text-zinc-500 text-xs min-h-[32px]">{plan.description}</p>
                                </div>
                                <div className="mb-6">
                                    <span className="text-3xl font-black text-white">
                                        {billing === "monthly" ? plan.priceMonthly : plan.priceYearly}
                                    </span>
                                    {plan.priceMonthly !== "Gratuito" && (
                                        <span className="text-zinc-500 text-sm"> / {billing === "monthly" ? "mês" : "ano"}</span>
                                    )}
                                </div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className={`flex items-center gap-2 text-sm ${feature.included ? 'text-zinc-300' : 'text-zinc-600 line-through'}`}>
                                            {feature.included ? (
                                                <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                                            ) : (
                                                <div className="h-4 w-4 shrink-0" />
                                            )}
                                            {feature.text}
                                        </li>
                                    ))}
                                </ul>
                                {!isCurrent && (plan.id !== "essential" || !subscription.isPro) && (
                                    <button
                                        disabled={loadingPriceId === plan.id}
                                        onClick={() => onSubscribe(plan.id)}
                                        className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${plan.buttonStyle || "bg-white text-[#050a10] hover:bg-zinc-200"
                                            } flex items-center justify-center`}
                                    >
                                        {loadingPriceId === plan.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-current" />
                                        ) : (
                                            subscription.isPro ? "Mudar de plano" : (plan.buttonLabel || "Assinar " + plan.name)
                                        )}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
