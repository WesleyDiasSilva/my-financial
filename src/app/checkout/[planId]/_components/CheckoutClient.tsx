"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CreditCard, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { storeSubscriptionPlans } from "@/config/subscriptions";
import Cleave from "cleave.js/react";

interface CheckoutClientProps {
    planId: string;
}

export default function CheckoutClient({ planId }: CheckoutClientProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [cardName, setCardName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvc, setCardCvc] = useState("");

    const env = process.env.NEXT_PUBLIC_ENVIRONMENT || "dev";
    const isSimulation = env === "dev" || env === "hml";

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

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const res = await fetch("/api/stripe/mock-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId }),
            });

            const data = await res.json();
            if (res.ok) {
                router.push(data.redirectUrl);
                router.refresh();
            } else {
                throw new Error(data.message || "Erro no processamento do mock");
            }
        } catch (error) {
            console.error("Erro no checkout mock", error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a1114] text-slate-300 py-12 px-4 selection:bg-cyan-500/30">
            <div className="max-w-5xl mx-auto">
                <Link href="/billing" className="inline-flex items-center text-sm font-medium text-cyan-500 hover:text-cyan-400 mb-8 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para gerenciar assinaturas
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Coluna Esquerda: Resumo do Plano */}
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Finalizar Assinatura</h1>
                        <p className="text-slate-400 mb-8">Revise seu plano e preencha os dados do cartão para simular a assinatura.</p>

                        <div className="bg-[#0f191e]/50 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{plan.name}</h2>
                                    <p className="text-sm text-slate-400">{plan.description}</p>
                                </div>
                            </div>

                            <div className="mb-8">
                                <div className="text-4xl font-bold text-white mb-1">
                                    <span className="text-2xl text-cyan-500 font-normal mr-1">R$</span>
                                    {plan.priceMonthly.replace("R$ ", "")}
                                </div>
                                <div className="text-sm text-slate-400 text-left">Cobrado mensalmente</div>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center text-slate-300">
                                        <CheckCircle2 className={`h-5 w-5 mr-3 ${feature.included ? 'text-cyan-500' : 'text-slate-600'}`} />
                                        <span className={feature.included ? '' : 'text-slate-500 line-through'}>{feature.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Coluna Direita: Formulário de Pagamento */}
                    <div className="bg-[#121c22] border border-slate-800 rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <CreditCard className="h-6 w-6 text-cyan-500" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">Dados de Pagamento</h2>
                        </div>

                        {isSimulation && (
                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-200 mb-6 flex items-start gap-3">
                                <Lock className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
                                <p><strong>Ambiente de Simulação:</strong> Nenhuma cobrança real será efetuada. Preencha com qualquer dado fictício para simular a assinatura.</p>
                            </div>
                        )}

                        <form onSubmit={onSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-300">Nome no Cartão</Label>
                                <Input
                                    id="name"
                                    placeholder="NOME COMPLETO"
                                    required
                                    className="bg-[#0a1114] border-slate-800 text-white h-11 focus-visible:ring-cyan-500"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cardNumber" className="text-slate-300">Número do Cartão</Label>
                                <Cleave
                                    options={{ creditCard: true }}
                                    className="flex h-11 w-full rounded-md border border-slate-800 bg-[#0a1114] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                    placeholder="•••• •••• •••• ••••"
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    value={cardNumber}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expiry" className="text-slate-300">Validade</Label>
                                    <Cleave
                                        options={{ date: true, datePattern: ['m', 'y'] }}
                                        className="flex h-11 w-full rounded-md border border-slate-800 bg-[#0a1114] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                        placeholder="MM/AA"
                                        onChange={(e) => setCardExpiry(e.target.value)}
                                        value={cardExpiry}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvc" className="text-slate-300">CVC</Label>
                                    <Cleave
                                        options={{ blocks: [4], numericOnly: true }}
                                        className="flex h-11 w-full rounded-md border border-slate-800 bg-[#0a1114] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                                        placeholder="123"
                                        onChange={(e) => setCardCvc(e.target.value)}
                                        value={cardCvc}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 mt-6 bg-cyan-500 hover:bg-cyan-600 text-[#0a1114] font-bold text-base transition-all shadow-[0_0_20px_rgba(13,185,242,0.3)] hover:shadow-[0_0_25px_rgba(13,185,242,0.5)]"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processando Simulação...
                                    </>
                                ) : (
                                    `Assinar e Pagar ${plan.priceMonthly}`
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
