"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function MonthFilter({ currentMonth, currentYear }: { currentMonth: number; currentYear: number }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const handleValueChange = (val: string) => {
        const [month, year] = val.split('-');
        const params = new URLSearchParams(searchParams.toString());
        params.set('month', month);
        params.set('year', year);
        router.push(`${pathname}?${params.toString()}`);
    }

    const value = `${currentMonth}-${currentYear}`;

    return (
        <Select value={value} onValueChange={handleValueChange}>
            <SelectTrigger className="w-[180px] bg-zinc-950 border-zinc-800">
                <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800">
                {Array.from({ length: 12 }).map((_, i) => {
                    const date = new Date();
                    date.setMonth(new Date().getMonth() - i);
                    const m = date.getMonth();
                    const y = date.getFullYear();
                    return (
                        <SelectItem key={`${m}-${y}`} value={`${m}-${y}`}>
                            {months[m]} {y}
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}
