"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Wallet, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        if (result?.error) {
            setError("E-mail ou senha incorretos.");
            setLoading(false);
        } else {
            router.push("/dashboard");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-[#050a10] relative px-4 py-12">
            {/* Radial Glow */}
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

            {/* Card */}
            <main className="w-full max-w-md z-10 mb-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl rounded-[2rem] relative overflow-hidden shadow-2xl">
                    <div className="h-1 w-full bg-gradient-to-r from-cyan-400 to-blue-600" />

                    <CardHeader className="space-y-1 pb-6 pt-8 text-center">
                        <h2 className="text-2xl font-bold text-white">Acesse sua conta</h2>
                        <p className="text-zinc-400 mt-2">Seu controle financeiro começa aqui.</p>
                    </CardHeader>

                    <CardContent className="space-y-6 px-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-4 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in zoom-in-95">
                                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] ml-1">E-mail</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="exemplo@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-zinc-900/50 border-zinc-800 text-white py-6 pl-12 rounded-xl focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all placeholder:text-zinc-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] ml-1">Senha</Label>
                                    <Link href="/forgot-password" className="text-[10px] font-semibold text-cyan-400 hover:underline uppercase tracking-tight">
                                        Esqueceu a senha?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-zinc-900/50 border-zinc-800 text-white py-6 pl-12 pr-12 rounded-xl focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all placeholder:text-zinc-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
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
                                        Entrando...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        ENTRAR NO SISTEMA
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-8 pb-8 mt-4 px-8">
                        <p className="text-sm text-zinc-500 font-medium text-center">
                            Não tem uma conta?{" "}
                            <Link href="/register" className="text-cyan-400 font-bold hover:underline transition-colors">
                                Comece agora gratuitamente
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </main>

            {/* Footer Badges */}
            <footer className="mt-16 mb-8 flex flex-wrap justify-center gap-6 text-[10px] font-bold tracking-[0.1em] text-zinc-600 uppercase z-10 opacity-60">
                <div className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> SEGURO
                </div>
                <div className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> CRIPTOGRAFADO
                </div>
                <div className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> PRIVADO
                </div>
            </footer>
        </div>
    );
}
