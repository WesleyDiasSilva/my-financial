"use client"

import Link from 'next/link';
import { CreditCard, LayoutDashboard, Receipt, Target, LogOut, Wallet, FileText, Crown, Infinity, Users, ShieldCheck } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toggleAdminDemoMode } from '@/actions/toggle-demo';

export function Sidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isAdmin = (session?.user as any)?.isAdmin;
    const adminMode = isAdmin && searchParams.get("admin") === "true";

    const userNavItems = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/transactions", label: "Transações", icon: Receipt },
        { href: "/accounts", label: "Contas", icon: Wallet },
        { href: "/credit-cards", label: "Cartões de Crédito", icon: CreditCard },
        { href: "/goals", label: "Metas", icon: Target },
        { href: "/planning", label: "Categorias", icon: LayoutDashboard },
        { href: "/reports", label: "Relatórios", icon: FileText },
    ];

    const adminNavItems = [
        { href: "/dashboard?admin=true", label: "Dashboard", icon: LayoutDashboard },
        ...userNavItems.filter(item => item.href !== "/dashboard").map(item => ({
            ...item,
            href: `${item.href}?admin=true` // Repassa o estado de admin pra view
        })),
        { href: "/admin/users?admin=true", label: "Gestão", icon: Users },
    ];

    const navItems = adminMode ? adminNavItems : userNavItems;

    const toggleAdminMode = async (toAdmin: boolean) => {
        await toggleAdminDemoMode(toAdmin);
        if (toAdmin) {
            router.push("/dashboard?admin=true");
        } else {
            router.push("/dashboard");
        }
        router.refresh(); // Força o re-flush de cache e refetch do dashboard
    };

    return (
        <aside className="w-72 bg-zinc-950 flex flex-col h-screen border-r border-zinc-900 shadow-2xl z-50">
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <div className="text-cyan-400">
                        <Infinity className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-emerald-400 bg-clip-text text-transparent">
                            {isAdmin && adminMode ? "MyLife Admin" : "MyLife"}
                        </h1>
                        {isAdmin && adminMode && (
                            <p className="text-[9px] text-cyan-500/70 uppercase tracking-[0.2em] font-bold -mt-0.5">Business Intelligence</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Admin Toggle */}
            {isAdmin && (
                <div className="px-4 mb-4">
                    <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
                        <button
                            onClick={() => toggleAdminMode(true)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${adminMode
                                ? "bg-cyan-500 text-[#0a1114] shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                                : "text-zinc-500 hover:text-white"
                                }`}
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            ADMIN
                        </button>
                        <button
                            onClick={() => toggleAdminMode(false)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${!adminMode
                                ? "bg-emerald-500 text-[#0a1114] shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                : "text-zinc-500 hover:text-white"
                                }`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            USER
                        </button>
                    </div>
                </div>
            )}

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href.split("?")[0]));
                    const activeColor = isAdmin && adminMode ? "cyan" : "emerald";
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${isActive
                                ? `bg-${activeColor}-500/10 text-${activeColor}-500 border border-${activeColor}-500/20`
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                }`}
                            style={isActive ? {
                                backgroundColor: isAdmin && adminMode ? "rgba(6,182,212,0.1)" : "rgba(16,185,129,0.1)",
                                color: isAdmin && adminMode ? "#06b6d4" : "#10b981",
                                borderColor: isAdmin && adminMode ? "rgba(6,182,212,0.2)" : "rgba(16,185,129,0.2)",
                                borderWidth: "1px",
                                borderStyle: "solid",
                            } : {}}
                        >
                            <item.icon size={20} style={isActive ? { color: isAdmin && adminMode ? "#06b6d4" : "#10b981" } : {}} />
                            <span className={`font-medium ${isActive ? "font-bold text-white" : ""}`}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 mt-auto">
                {/* Only show billing in user mode */}
                {!(isAdmin && adminMode) && (
                    <Link
                        href="/billing"
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-95 mb-4 ${pathname?.startsWith("/billing")
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
                            : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10"
                            }`}
                    >
                        <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center">
                            <Crown size={18} className={pathname?.startsWith("/billing") ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "text-zinc-500"} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-sm ${pathname?.startsWith("/billing") ? "font-bold text-white" : "font-medium"}`}>
                                Meu Plano
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                Gerenciar
                            </span>
                        </div>
                    </Link>
                )}

                <div className="flex items-center gap-3 px-2 pt-4 border-t border-zinc-800">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAdmin && adminMode ? "bg-cyan-500/20 border border-cyan-500/30" : "bg-accent"}`}>
                        <span className={`text-sm font-bold ${isAdmin && adminMode ? "text-cyan-400" : "text-accent-foreground"}`}>
                            {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{session?.user?.name || 'Usuário'}</span>
                        <span className="text-xs text-muted-foreground">{session?.user?.email || ''}</span>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="ml-auto p-2 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all group"
                        title="Sair do sistema"
                    >
                        <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
