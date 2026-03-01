"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Wallet, Lock, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { resetPassword } from "@/actions/password-reset";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Token de recuperação não encontrado. Solicite um novo link.");
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("A senha precisa ter no mínimo 6 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        setLoading(true);
        const result = await resetPassword(token!, password);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => router.push("/login"), 3000);
        } else {
            setError(result.error || "Erro ao redefinir a senha.");
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
                        {!success ? (
                            <div className="text-center space-y-3">
                                <h2 className="text-2xl font-bold text-white">Redefinir senha</h2>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Escolha uma nova senha segura para sua conta.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center space-y-4 py-4">
                                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <ShieldCheck className="h-12 w-12 text-emerald-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Senha redefinida!</h2>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes...
                                </p>
                            </div>
                        )}
                    </CardHeader>

                    <CardContent className="px-8 pb-8 space-y-6">
                        {!success ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="p-4 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3">
                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] ml-1">Nova Senha</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <Input
                                            type="password"
                                            placeholder="Mínimo 6 caracteres"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            disabled={!token}
                                            className="bg-zinc-900/50 border-zinc-800 text-white py-6 pl-12 rounded-xl focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all placeholder:text-zinc-600"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] ml-1">Confirmar Senha</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <Input
                                            type="password"
                                            placeholder="Repita a nova senha"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            disabled={!token}
                                            className="bg-zinc-900/50 border-zinc-800 text-white py-6 pl-12 rounded-xl focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all placeholder:text-zinc-600"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 hover:opacity-90 text-white font-bold py-6 rounded-xl flex items-center justify-center gap-2 group uppercase tracking-[2px] text-xs shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all"
                                    disabled={loading || !token}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Redefinindo...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            REDEFINIR SENHA
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <Link href="/login">
                                <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-6 rounded-xl uppercase tracking-[2px] text-xs transition-all">
                                    IR PARA O LOGIN
                                </Button>
                            </Link>
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#050a10]">
                <div className="h-8 w-8 border-2 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
