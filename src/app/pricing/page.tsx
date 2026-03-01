"use client";

import { useState } from "react";
import Link from "next/link";
import { Wallet, CheckCircle2, XCircle, ChevronDown, Infinity, Instagram, Linkedin } from "lucide-react";

import { storeSubscriptionPlans } from "@/config/subscriptions";
const faqs = [
    {
        question: "Como funciona o período de teste?",
        answer: "Oferecemos 14 dias de teste gratuito em qualquer plano pago para que você experimente todos os recursos sem compromisso."
    },
    {
        question: "Posso trocar de plano a qualquer momento?",
        answer: "Sim! Você pode fazer o upgrade ou downgrade do seu plano diretamente nas configurações da sua conta. O valor será proporcional ao tempo restante."
    },
    {
        question: "Meus dados estão seguros?",
        answer: "Utilizamos criptografia de ponta a ponta e os mesmos protocolos de segurança de instituições financeiras para garantir que sua privacidade seja absoluta."
    },
];

export default function PricingPage() {
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="relative min-h-screen w-full flex flex-col overflow-x-hidden bg-[#101e22] text-white">
            {/* Background glows */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-[#234248] px-6 md:px-20 py-4" style={{ background: "rgba(35, 66, 72, 0.4)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(19, 200, 236, 0.1)" }}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-cyan-400">
                            <Infinity className="h-9 w-9" />
                        </div>
                        <h2 className="text-xl font-extrabold tracking-tight">MyLife</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-10">
                        <Link className="text-sm font-semibold hover:text-cyan-400 transition-colors" href="/">Recursos</Link>
                        <a className="text-cyan-400 text-sm font-semibold" href="#">Planos</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden sm:flex text-sm font-bold px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
                            Entrar
                        </Link>
                        <Link href="/register" className="bg-cyan-400 text-[#101f22] text-sm font-bold px-5 py-2.5 rounded-lg hover:brightness-110 shadow-[0_0_20px_rgba(19,200,236,0.2)] transition-all">
                            Começar Gratuitamente
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 flex flex-col items-center px-6 py-12 md:py-20 max-w-7xl mx-auto w-full">
                {/* Hero */}
                <div className="text-center mb-16 max-w-3xl">
                    <span className="inline-block py-1 px-4 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
                        Planos
                    </span>
                    <h1 className="text-white text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6">
                        Escolha seu Plano
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl font-medium leading-relaxed">
                        Selecione a melhor opção para transformar sua gestão pessoal e familiar.
                        Potencialize seu dia a dia com MyLife.
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex mb-12">
                    <div className="flex h-12 w-80 items-center justify-center rounded-full bg-cyan-500/10 p-1 border border-cyan-500/20">
                        <button
                            onClick={() => setBilling("monthly")}
                            className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-4 transition-all text-sm font-bold ${billing === "monthly" ? "bg-cyan-500 text-[#101e22] shadow-sm" : "text-zinc-400"}`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setBilling("yearly")}
                            className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-4 transition-all text-sm font-bold ${billing === "yearly" ? "bg-cyan-500 text-[#101e22] shadow-sm" : "text-zinc-400"}`}
                        >
                            Anual <span className="text-[10px] ml-1 opacity-80">(-20%)</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    {storeSubscriptionPlans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`relative h-full flex flex-col gap-8 rounded-2xl p-8 hover:translate-y-[-4px] transition-transform duration-300 backdrop-blur-xl ${plan.isPopular
                                ? "border-2 border-cyan-500 shadow-[0_0_30px_rgba(13,185,242,0.2)]"
                                : "border border-cyan-500/10"
                                }`}
                            style={{ background: "rgba(24, 45, 52, 0.6)" }}
                        >
                            {plan.isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-[#101e22] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                                    Mais Popular
                                </div>
                            )}
                            <div className="flex flex-col gap-2">
                                <h3 className="text-white text-xl font-bold">{plan.name}</h3>
                                <p className="text-zinc-400 text-sm">{plan.description}</p>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-white text-4xl font-black">
                                        {billing === "monthly" ? plan.priceMonthly : plan.priceYearly}
                                    </span>
                                    {plan.suffix && (
                                        <span className="text-zinc-400 text-sm font-bold">{plan.suffix}</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4 flex-1 mb-8">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        {feature.included ? (
                                            <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-zinc-600 shrink-0" />
                                        )}
                                        <span className={`text-sm ${feature.included ? 'text-zinc-200' : 'text-zinc-500 line-through'}`}>
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href="/register"
                                className={`w-full mt-auto py-3 rounded-xl text-sm font-bold transition-all text-center block ${plan.buttonStyle || "bg-white text-[#050a10] hover:bg-zinc-200"}`}
                            >
                                {plan.buttonLabel || "Assinar " + plan.name}
                            </Link>
                        </div>
                    ))}
                </div>

                {/* FAQ */}
                <div className="mt-24 w-full max-w-4xl">
                    <h2 className="text-white text-3xl font-black leading-tight tracking-tight mb-8 text-center">
                        Dúvidas Frequentes
                    </h2>
                    <div className="flex flex-col gap-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-cyan-500/5 rounded-xl border border-cyan-500/10 overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="flex justify-between items-center w-full p-6 cursor-pointer font-bold text-white text-left"
                                >
                                    {faq.question}
                                    <ChevronDown className={`h-5 w-5 text-zinc-400 transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                                </button>
                                {openFaq === index && (
                                    <div className="px-6 pb-6 text-zinc-400 text-sm leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#234248] bg-[#101f22] px-6 md:px-20 py-12 mt-20">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <Infinity className="h-6 w-6 text-cyan-400" />
                            <h2 className="text-xl font-extrabold tracking-tight">MyLife</h2>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            A plataforma definitiva para quem busca organização, clareza financeira e saúde em um só lugar.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Produto</h4>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li><Link className="hover:text-cyan-400 transition-colors" href="/">Recursos</Link></li>
                            <li><a className="hover:text-cyan-400 transition-colors" href="#">Planos</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Empresa</h4>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li><Link className="hover:text-cyan-400 transition-colors" href="/about">Sobre Nós</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Social</h4>
                        <div className="flex gap-4">
                            <a className="w-8 h-8 rounded-lg bg-[#234248] flex items-center justify-center hover:bg-cyan-500/20 hover:text-cyan-400 transition-all" href="https://www.google.com" target="_blank" rel="noopener noreferrer">
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a className="w-8 h-8 rounded-lg bg-[#234248] flex items-center justify-center hover:bg-cyan-500/20 hover:text-cyan-400 transition-all" href="https://www.google.com" target="_blank" rel="noopener noreferrer">
                                <Linkedin className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto border-t border-[#234248] mt-12 pt-8 text-center text-xs text-zinc-500">
                    © 2025 MyLife Platform. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
}
