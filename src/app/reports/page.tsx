"use client";

import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ReportDocument } from "@/components/reports/report-document";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTransactions } from "@/actions/transaction";
import { getGoals } from "@/actions/goal";
import { useSession } from "next-auth/react";

export default function ReportsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const months = [
        { value: 1, label: "Janeiro" },
        { value: 2, label: "Fevereiro" },
        { value: 3, label: "Março" },
        { value: 4, label: "Abril" },
        { value: 5, label: "Maio" },
        { value: 6, label: "Junho" },
        { value: 7, label: "Julho" },
        { value: 8, label: "Agosto" },
        { value: 9, label: "Setembro" },
        { value: 10, label: "Outubro" },
        { value: 11, label: "Novembro" },
        { value: 12, label: "Dezembro" },
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        fetchData();
    }, [month, year]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const allTransactions = await getTransactions();
            const allGoals = await getGoals();

            // Filtrar transações por mês/ano
            const filteredTransactions = allTransactions.filter(t => {
                const date = new Date(t.date);
                return date.getMonth() + 1 === month && date.getFullYear() === year;
            });

            setTransactions(filteredTransactions);
            setGoals(allGoals);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    const summary = {
        income: transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + Number(curr.amount), 0),
        expense: transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + Number(curr.amount), 0),
        balance: 0
    };
    summary.balance = summary.income - summary.expense;

    const reportData = {
        userName: session?.user?.name || "Usuário",
        period: `${months.find(m => m.value === month)?.label} / ${year}`,
        summary,
        transactions,
        goals
    };

    return (
        <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto p-10">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">Relatórios</h2>
                    <p className="text-zinc-500 mt-1 text-lg font-medium">Extraia seus dados em formato PDF para análise externa.</p>
                </div>
                <div className="p-4 rounded-3xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800">
                    <FileText className="h-10 w-10 text-emerald-500" />
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <Card className="col-span-1 bg-zinc-950 border-zinc-800/50 shadow-2xl rounded-[2.5rem] p-4">
                    <CardHeader>
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <Filter className="h-5 w-5 text-emerald-500" /> Filtros do Relatório
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Mês de Referência</label>
                            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 h-12 rounded-xl font-bold">
                                    <SelectValue placeholder="Selecione o mês" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    {months.map((m) => (
                                        <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Ano</label>
                            <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 h-12 rounded-xl font-bold">
                                    <SelectValue placeholder="Selecione o ano" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                    {years.map((y) => (
                                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-4 border-t border-zinc-900">
                            <p className="text-xs text-zinc-500 italic">O relatório incluirá o resumo mensal, todas as transações do mês e o status atual das suas metas.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2 bg-zinc-950 border-zinc-800/50 shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
                    <div className="bg-zinc-900/50 p-8 rounded-full mb-6">
                        <Download className="h-16 w-16 text-zinc-700" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Pronto para Exportar?</h3>
                    <p className="text-zinc-500 max-w-sm mb-8">
                        Clique no botão abaixo para gerar o PDF consolidado do mês de <strong>{months.find(m => m.value === month)?.label}</strong>.
                    </p>

                    {!loading ? (
                        <PDFDownloadLink
                            document={<ReportDocument data={reportData} />}
                            fileName={`relatorio-financeiro-${month}-${year}.pdf`}
                        >
                            {({ blob, url, loading: downloadLoading, error }) => (
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-500 h-16 px-12 rounded-2xl font-black text-sm tracking-[0.2em] uppercase shadow-[0_20px_40px_rgba(16,185,129,0.15)] flex items-center gap-3"
                                    disabled={downloadLoading}
                                >
                                    {downloadLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" /> Gerando PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-5 w-5" /> Baixar Relatório PDF
                                        </>
                                    )}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    ) : (
                        <Button disabled className="bg-zinc-800 h-16 px-12 rounded-2xl font-black text-sm tracking-[0.2em] uppercase">
                            <Loader2 className="h-5 w-5 animate-spin mr-3" /> Carregando Dados...
                        </Button>
                    )}
                </Card>
            </div>
        </div>
    );
}
