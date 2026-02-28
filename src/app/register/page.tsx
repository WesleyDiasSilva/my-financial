"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, User, Mail, Phone, Lock, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";
import Cleave from "cleave.js/react";
import { cpf as cpfValidator } from "cpf-cnpj-validator";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [cpfVal, setCpfVal] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name");
        const email = formData.get("email");
        const cpfRaw = cpfVal.replace(/\D/g, '');
        const phone = formData.get("phone");
        const password = formData.get("password");

        if (!cpfValidator.isValid(cpfRaw)) {
            setError("CPF digitado é inválido.");
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

            setSuccess("Conta criada com sucesso! Redirecionando...");
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            if (!success) setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden p-4 py-12">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse decoration-1000" />

            <div className="w-full max-w-lg relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8 gap-3">
                    <div className="h-14 w-14 bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5 rounded-2xl rotate-3 shadow-2xl shadow-emerald-500/20 active:rotate-0 transition-transform duration-500">
                        <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                            <Wallet className="h-7 w-7 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-blue-500 to-emerald-400 bg-clip-text text-transparent tracking-tighter">
                        MyFinancial
                    </h1>
                </div>

                <Card className="border-zinc-800/50 bg-zinc-900/40 backdrop-blur-2xl shadow-2xl overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-blue-600 to-emerald-500 bg-[length:200%_auto] animate-gradient" />

                    <CardHeader className="space-y-1 pb-8 pt-8">
                        <CardTitle className="text-2xl font-bold tracking-tight text-white text-center">Comece sua jornada</CardTitle>
                        <CardDescription className="text-zinc-400 text-center font-medium">
                            Cria sua conta e assuma o controle definitivo.
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
                            {success && (
                                <div className="p-4 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-3 animate-in zoom-in-95">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {success}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-zinc-500 text-[10px] font-black uppercase tracking-[2px] ml-1">Nome Completo</Label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input id="name" name="name" placeholder="Como podemos te chamar?" required className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 h-11 pl-10 text-white rounded-xl transition-all" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-500 text-[10px] font-black uppercase tracking-[2px] ml-1">E-mail Corporativo ou Pessoal</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input id="email" type="email" name="email" placeholder="seu@email.com" required className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 h-11 pl-10 text-white rounded-xl transition-all" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cpf" className="text-zinc-500 text-[10px] font-black uppercase tracking-[2px] ml-1">CPF</Label>
                                    <div className="relative group">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                                        <Cleave
                                            id="cpf"
                                            name="cpf"
                                            placeholder="000.000.000-00"
                                            options={{ blocks: [3, 3, 3, 2], delimiters: ['.', '.', '-'], numericOnly: true }}
                                            value={cpfVal}
                                            onChange={(e) => setCpfVal(e.target.value)}
                                            required
                                            className="flex h-11 w-full rounded-xl border bg-zinc-950/50 border-zinc-800 px-3 pl-10 py-2 text-sm text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-zinc-500 text-[10px] font-black uppercase tracking-[2px] ml-1">Telefone</Label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                                        <Input id="phone" name="phone" placeholder="(11) 90000-0000" required className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 h-11 pl-10 text-white rounded-xl transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-500 text-[10px] font-black uppercase tracking-[2px] ml-1">Defina uma Senha Forte</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input id="password" type="password" name="password" placeholder="••••••••" required className="bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 h-11 pl-10 text-white rounded-xl transition-all" />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-emerald-600 to-blue-500 hover:opacity-90 text-white h-12 font-black uppercase tracking-[2px] text-xs shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all rounded-xl mt-4"
                                disabled={loading || !!success}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Criando Conta...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        Finalizar Cadastro
                                        <ArrowRight className="h-4 w-4" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 border-t border-zinc-800/50 pt-8 pb-8 bg-zinc-950/20">
                        <p className="text-sm text-zinc-500 font-medium">
                            Já faz parte do MyFinancial?{" "}
                            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                                Entrar na conta
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
