"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
            router.push("/");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden p-4">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse decoration-1000" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="h-16 w-16 bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 rounded-2xl rotate-3 shadow-2xl shadow-emerald-500/20 active:rotate-0 transition-transform duration-500">
                        <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                            <Wallet className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-blue-500 to-emerald-400 bg-clip-text text-transparent tracking-tighter">
                            MyFinancial
                        </h1>
                    </div>
                </div>

                <Card className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-2xl shadow-2xl overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600 bg-[length:200%_auto] animate-gradient" />

                    <CardHeader className="space-y-1 pb-8 pt-8">
                        <CardTitle className="text-2xl font-bold tracking-tight text-white text-center">Acesse sua conta</CardTitle>
                        <CardDescription className="text-zinc-400 text-center font-medium">
                            Seu controle financeiro começa aqui.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-4 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in zoom-in-95">
                                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-500 text-[10px] font-black uppercase tracking-[2px] ml-1">E-mail</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ex: nome@financeiro.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-zinc-950/50 border-zinc-800 focus:border-blue-500/50 h-12 pl-10 text-white transition-all rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-zinc-500 text-[10px] font-black uppercase tracking-[2px] ml-1">Senha</Label>
                                    <Link href="#" className="text-[10px] font-black text-zinc-600 hover:text-zinc-400 uppercase tracking-wider">Esqueceu a senha?</Link>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-zinc-950/50 border-zinc-800 focus:border-blue-500/50 h-12 pl-10 text-white transition-all rounded-xl"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 hover:opacity-90 text-white h-12 font-black uppercase tracking-[2px] text-xs shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all rounded-xl"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Entrando...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        Entrar no Sistema
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 border-t border-zinc-800/50 pt-8 pb-8 bg-zinc-950/20">
                        <p className="text-sm text-zinc-500 font-medium">
                            Não possui uma conta?{" "}
                            <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                                Comece agora gratuitamente
                            </Link>
                        </p>
                    </CardFooter>
                </Card>

                {/* Integration Badges */}
                <div className="mt-8 flex justify-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <CheckCircle2 className="h-3 w-3" /> Seguro
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <CheckCircle2 className="h-3 w-3" /> Criptografado
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        <CheckCircle2 className="h-3 w-3" /> Privado
                    </div>
                </div>
            </div>
        </div>
    );
}
