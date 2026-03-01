"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Wallet, Mail, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/actions/password-reset";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await requestPasswordReset(email);

        if (result.success) {
            setSent(true);
        } else {
            setError(result.error || "Erro ao enviar o e-mail.");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-[#050a10] relative px-4 py-12">
            <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(0, 210, 255, 0.12) 0%, transparent 70%)' }} />

            {/* Logo */}
            <div className="mt-auto mb-8 text-center z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,210,255,0.2)] mb-4">
                    <Wallet className="h-8 w-8 text-cyan-400" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    My<span className="text-cyan-400">Life</span>
                </h1>
            </div>

            <main className="w-full max-w-md z-10 mb-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl rounded-[2rem] relative overflow-hidden shadow-2xl">
                    <div className="h-1 w-full bg-gradient-to-r from-cyan-400 to-blue-600" />

                    <CardHeader className="pt-8 pb-2 px-8">
                        {!sent ? (
                            <div className="text-center space-y-3">
                                <h2 className="text-2xl font-bold text-white">Esqueci minha senha</h2>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Digite seu e-mail e enviaremos um link de recuperação para você redefinir sua senha.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center space-y-4 py-4">
                                <div className="relative inline-block">
                                    <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto">
                                        <MailCheck className="h-12 w-12 text-cyan-400 animate-pulse" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full border-4 border-[#050a10] flex items-center justify-center">
                                        <span className="text-white text-[10px] font-bold">✓</span>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-white">E-mail enviado!</h2>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Enviamos as instruções de recuperação para <span className="font-semibold text-white">{email}</span>. Verifique sua caixa de entrada e spam.
                                </p>
                            </div>
                        )}
                    </CardHeader>

                    <CardContent className="px-8 pb-8 space-y-6">
                        {!sent ? (
                            <>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <div className="p-4 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] ml-1">E-mail Cadastrado</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                                            <Input
                                                type="email"
                                                placeholder="seu@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="bg-zinc-900/50 border-zinc-800 text-white py-6 pl-12 rounded-xl focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all placeholder:text-zinc-600"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 hover:opacity-90 text-white font-bold py-6 rounded-xl flex items-center justify-center gap-2 group uppercase tracking-[2px] text-xs shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                Enviando...
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                ENVIAR LINK DE RECUPERAÇÃO
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        )}
                                    </Button>
                                </form>

                                <div className="text-center pt-4 border-t border-white/5">
                                    <Link href="/login" className="text-sm font-medium text-zinc-500 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Voltar para o login
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <Link href="/login">
                                    <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-6 rounded-xl uppercase tracking-[2px] text-xs transition-all">
                                        VOLTAR AO LOGIN
                                    </Button>
                                </Link>
                                <p className="text-xs text-zinc-500 text-center">
                                    Não recebeu o e-mail?{" "}
                                    <button onClick={() => setSent(false)} className="text-cyan-400 hover:underline font-semibold">
                                        Reenviar agora
                                    </button>
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>

            <footer className="mt-16 mb-8 flex flex-wrap justify-center gap-6 text-[10px] font-bold tracking-[0.1em] text-zinc-600 uppercase z-10 opacity-60">
                <div className="flex items-center gap-1.5">SEGURO</div>
                <div className="flex items-center gap-1.5">CRIPTOGRAFADO</div>
                <div className="flex items-center gap-1.5">PRIVADO</div>
            </footer>
        </div>
    );
}
