"use client";

import { useEffect, useState } from "react";
import { Search, Users, Crown, Zap, User as UserIcon } from "lucide-react";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    plan: string;
    status: "active" | "expired" | "free";
    createdAt: string;
}

export function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetch("/api/admin/users")
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const planIcon = (plan: string) => {
        switch (plan) {
            case "Premium": return <Crown className="w-3.5 h-3.5 text-purple-400" />;
            case "Basic": return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
            default: return <UserIcon className="w-3.5 h-3.5 text-zinc-500" />;
        }
    };

    const planColor = (plan: string) => {
        switch (plan) {
            case "Premium": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
            case "Basic": return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
            default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case "active": return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ativo</span>;
            case "expired": return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Expirado</span>;
            default: return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700"><span className="w-1.5 h-1.5 rounded-full bg-zinc-500" /> Free</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white">
                        Gestão de <span className="italic text-cyan-400">Usuários</span>
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {users.length} usuários cadastrados na plataforma
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Pesquisar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-white">{users.filter(u => u.status === "active").length}</p>
                    <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mt-1">Ativos</p>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-white">{users.filter(u => u.plan === "Free" || u.status === "free").length}</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-1">Free</p>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-black text-white">{users.filter(u => u.status === "expired").length}</p>
                    <p className="text-[10px] text-red-400 uppercase tracking-widest font-bold mt-1">Expirados</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-800/50">
                            <th className="text-left text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-6 py-4">Nome</th>
                            <th className="text-left text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-6 py-4">Email</th>
                            <th className="text-left text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-6 py-4">Plano</th>
                            <th className="text-left text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((user) => (
                            <tr key={user.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center">
                                            <span className="text-xs font-bold text-cyan-400">{user.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <span className="text-sm font-medium text-white">{user.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-400">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${planColor(user.plan)}`}>
                                        {planIcon(user.plan)}
                                        {user.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{statusBadge(user.status)}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-zinc-500 text-sm">
                                    Nenhum usuário encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
