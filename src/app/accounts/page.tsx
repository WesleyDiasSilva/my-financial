import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccounts } from "@/actions/account";
import { AccountModal } from "@/components/modals/account-modal";
import { Wallet, TrendingUp, Landmark, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AccountActions } from "@/components/accounts/account-actions";

export default async function AccountsPage() {
    const accounts = await getAccounts();

    const totalBalance = accounts.reduce((acc: number, curr: any) => acc + Number(curr.balance) + Number(curr.investmentBalance), 0);
    const totalInvestments = accounts.reduce((acc: number, curr: any) => acc + Number(curr.investmentBalance), 0);
    const checkingBalance = accounts.reduce((acc: number, curr: any) => acc + Number(curr.balance), 0);

    return (
        <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto p-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Minhas Contas</h2>
                    <p className="text-zinc-500 mt-1 text-lg font-medium">Gerencie seu saldo em bancos e corretoras</p>
                </div>
                <AccountModal />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-zinc-950 border-zinc-800/50 shadow-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Saldo Total</CardTitle>
                        <Wallet className="h-5 w-5 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">
                            {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-950 border-zinc-800/50 shadow-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Contas Correntes</CardTitle>
                        <Landmark className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">
                            {checkingBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-950 border-zinc-800/50 shadow-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Investimentos</CardTitle>
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">
                            {totalInvestments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                {accounts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 border border-zinc-800 border-dashed rounded-lg bg-zinc-900/20">
                        <Wallet className="h-12 w-12 text-zinc-700 mb-4" />
                        <p className="text-zinc-500 font-medium text-lg">Nenhuma conta cadastrada.</p>
                        <p className="text-zinc-600">Adicione suas contas para começar a controlar seu saldo.</p>
                    </div>
                ) : (
                    accounts.map((account: any) => (
                        <Card key={account.id} className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-all group overflow-hidden">
                            {/* Top color accent bar */}
                            <div className="h-1 w-full" style={{ backgroundColor: account.color || '#6366f1' }} />
                            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: account.color || '#6366f1' }} />
                                        <CardTitle className="text-lg font-bold text-white text-base">{account.name}</CardTitle>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {account.type === 'CHECKING' ? 'Conta Corrente' :
                                            account.type === 'INVESTMENT' ? 'Investimento' : 'Poupança'}
                                    </p>
                                </div>
                                <AccountActions account={account} />
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-end pt-4">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Saldo Disponível</p>
                                        <div className={`text-2xl font-bold flex items-center gap-1 ${Number(account.balance) < 0 ? 'text-red-400' : 'text-zinc-100'}`}>
                                            {Number(account.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold mb-1">Cofre Investido</p>
                                        <div className="text-lg font-bold text-purple-300 flex items-center justify-end gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            {Number(account.investmentBalance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-zinc-900 flex justify-between items-center text-xs text-muted-foreground">
                                    <span>{account.type === 'CHECKING' ? 'Bancos e Cartões' : 'Corretoras'}</span>
                                    <div className={`p-1.5 rounded-full bg-zinc-900 group-hover:bg-zinc-800 transition-colors`}>
                                        {account.type === 'INVESTMENT' ? (
                                            <TrendingUp className="h-5 w-5 text-purple-400" />
                                        ) : (
                                            <Landmark className="h-5 w-5 text-blue-400" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
