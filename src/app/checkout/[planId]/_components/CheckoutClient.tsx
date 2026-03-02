"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lock, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { storeSubscriptionPlans } from "@/config/subscriptions";

interface CheckoutClientProps {
    planId: string;
    billing: "monthly" | "yearly";
}

export default function CheckoutClient({ planId, billing }: CheckoutClientProps) {
    const [loading, setLoading] = useState(false);

    const plan = storeSubscriptionPlans.find((p) => p.id === planId);

    if (!plan) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a1114]">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Plano não encontrado</h1>
                    <Link href="/billing">
                        <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">Voltar para assinaturas</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const onSubmit = async () => {
        setLoading(true);

        try {
            const priceId = billing === "monthly" ? plan.stripePriceId : plan.stripePriceIdYearly;

            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
            });

            const data = await res.json();

            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.message || "Erro ao iniciar checkout");
            }
        } catch (error) {
            console.error("Erro no checkout", error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a1114] text-slate-300 py-12 px-4 selection:bg-cyan-500/30 flex items-center justify-center">
            <div className="max-w-2xl w-full mx-auto">
                <Link href="/billing" className="inline-flex items-center text-sm font-medium text-cyan-500 hover:text-cyan-400 mb-8 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para gerenciar assinaturas
                </Link>

                <div className="bg-[#0f191e]/50 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Finalizar Assinatura</h1>
                        <p className="text-slate-400">Você será redirecionado para o ambiente seguro do Stripe para concluir seu pagamento.</p>
                    </div>

                    <div className="bg-[#121c22] border border-slate-800 rounded-xl p-6 mb-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                                <p className="text-sm text-slate-400">{plan.description}</p>
                            </div>
                            <div className="bg-cyan-500/10 p-2 rounded-lg">
                                <Lock className="h-5 w-5 text-cyan-500" />
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="text-4xl font-bold text-white mb-1">
                                <span className="text-2xl text-cyan-500 font-normal mr-1">R$</span>
                                {(billing === "monthly" ? plan.priceMonthly : plan.priceYearly).replace("R$ ", "")}
                            </div>
                            <div className="text-sm text-slate-400">Plano {billing === "monthly" ? "Mensal" : "Anual"}</div>
                        </div>

                        <ul className="space-y-3 mb-2">
                            {plan.features.slice(0, 4).map((feature, i) => (
                                <li key={i} className="flex items-center text-slate-300 text-sm">
                                    <CheckCircle2 className={`h-4 w-4 mr-3 ${feature.included ? 'text-cyan-500' : 'text-slate-600'}`} />
                                    <span className={feature.included ? '' : 'text-slate-500 line-through'}>{feature.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Button
                        onClick={onSubmit}
                        className="w-full h-14 bg-cyan-500 hover:bg-cyan-600 text-[#0a1114] font-bold text-lg transition-all shadow-[0_0_20px_rgba(13,185,242,0.3)] hover:shadow-[0_0_25px_rgba(13,185,242,0.5)]"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                Redirecionando...
                            </>
                        ) : (
                            "Ir para o Pagamento"
                        )}
                    </Button>

                    <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1">
                        <Lock className="h-3 w-3" /> Pagamento processado de forma segura pelo Stripe
                    </p>
                </div>
            </div>
        </div>
    );
}
