"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Wallet, User, Mail, Phone, Lock, CreditCard, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Cleave from "cleave.js/react";
import { cpf as cpfValidator } from "cpf-cnpj-validator";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [cpfVal, setCpfVal] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name");
        const email = formData.get("email");
        const cpfRaw = cpfVal.replace(/\D/g, '');
        const phone = formData.get("phone");
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (!cpfValidator.isValid(cpfRaw)) {
            setError("CPF digitado é inválido.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("A senha precisa ter no mínimo 6 caracteres.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, cpf: cpfRaw, phone, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Erro ao cadastrar usuário");
            }

            setSuccess("Conta criada com sucesso! Entrando...");

            // Auto-login após registro
            const loginResult = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (loginResult?.error) {
                router.push("/login");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (!success) setLoading(false);
        }
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

            <main className="w-full max-w-lg z-10 mb-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl rounded-[2rem] relative overflow-hidden shadow-2xl">
                    <div className="h-1 w-full bg-gradient-to-r from-cyan-400 to-blue-600" />

                    <CardHeader className="space-y-1 pb-6 pt-8 text-center px-8">
                        <h2 className="text-2xl font-bold text-white">Comece sua jornada</h2>
                        <p className="text-zinc-400 mt-2 font-medium">
                            Crie sua conta e assuma o controle definitivo.
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-6 px-8">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-4 text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in zoom-in-95">
                                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-4 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-in zoom-in-95">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {success}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] ml-1">Nome Completo</Label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <Input name="name" placeholder="Como podemos te chamar?" required className="bg-zinc-900/50 border-zinc-800 text-white py-6 pl-12 rounded-xl focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all placeholder:text-zinc-600" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] ml-1">E-mail</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <Input type="email" name="email" placeholder="seu@email.com" required className="bg-zinc-900/50 border-zinc-800 text-white py-6 pl-12 rounded-xl focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all placeholder:text-zinc-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] ml-1">CPF</Label>
                                    <div className="relative group">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <Cleave
                                            name="cpf"
                                            placeholder="000.000.000-00"
                                            options={{ blocks: [3, 3, 3, 2], delimiters: ['.', '.', '-'], numericOnly: true }}
                                            value={cpfVal}
                                            onChange={(e) => setCpfVal(e.target.value)}
                                            required
                                            className="flex h-12 w-full rounded-xl border bg-zinc-900/50 border-zinc-800 px-3 pl-12 py-2 text-sm text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/30 focus-visible:border-cyan-400 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] ml-1">Telefone</Label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                                        <Input name="phone" placeholder="(11) 90000-0000" required className="bg-zinc-900/50 border-zinc-800 text-white py-6 pl-12 rounded-xl focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all placeholder:text-zinc-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] ml-1">Senha</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="Mínimo 6 caracteres"
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

                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-[10px] font-bold uppercase tracking-[2px] ml-1">Confirmar Senha</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="Repita a senha"
                                        required
                                        className="bg-zinc-900/50 border-zinc-800 text-white py-6 pl-12 pr-12 rounded-xl focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all placeholder:text-zinc-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 hover:opacity-90 text-white font-bold py-6 rounded-xl flex items-center justify-center gap-2 group uppercase tracking-[2px] text-xs shadow-lg shadow-cyan-500/20 active:scale-[0.98] transition-all mt-4"
                                disabled={loading || !!success}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Criando Conta...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        FINALIZAR CADASTRO
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-8 pb-8 mt-4 px-8">
                        <p className="text-sm text-zinc-500 font-medium text-center">
                            Já faz parte do MyLife?{" "}
                            <Link href="/login" className="text-cyan-400 font-bold hover:underline transition-colors">
                                Entrar na conta
                            </Link>
                        </p>
                    </CardFooter>
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
