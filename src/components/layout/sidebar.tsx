"use client"

import Link from 'next/link';
import { CreditCard, LayoutDashboard, Receipt, Target, LogOut, Wallet, FileText } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

export function Sidebar() {
    const { data: session } = useSession();
    return (
        <aside className="w-72 bg-zinc-950 flex flex-col h-screen border-r border-zinc-900 shadow-2xl z-50">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-emerald-400 bg-clip-text text-transparent">
                    MyFinancial
                </h1>
            </div>
            <nav className="flex-1 px-4 space-y-2 mt-4">
                <Link href="/" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200">
                    <LayoutDashboard size={20} />
                    <span className="font-medium">Dashboard</span>
                </Link>
                <Link href="/transactions" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200">
                    <Receipt size={20} />
                    <span className="font-medium">Transações</span>
                </Link>
                <Link href="/accounts" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200">
                    <Wallet size={20} />
                    <span className="font-medium">Contas</span>
                </Link>
                <Link href="/credit-cards" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200">
                    <CreditCard size={20} />
                    <span className="font-medium">Cartões de Crédito</span>
                </Link>
                <Link href="/goals" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200">
                    <Target size={20} />
                    <span className="font-medium">Metas</span>
                </Link>
                <Link href="/planning" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200">
                    <LayoutDashboard size={20} />
                    <span className="font-medium">Planejamento</span>
                </Link>
                <Link href="/reports" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200">
                    <FileText size={20} />
                    <span className="font-medium">Relatórios</span>
                </Link>
            </nav>
            <div className="p-4 border-t border-border mt-auto">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-sm font-bold text-accent-foreground">W</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{session?.user?.name || 'Wesley'}</span>
                        <span className="text-xs text-muted-foreground">{session?.user?.email || 'Admin'}</span>
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
