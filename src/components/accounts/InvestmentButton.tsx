"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { InvestmentModal } from "@/components/accounts/InvestmentModal";

interface InvestmentButtonProps {
    accountId: string;
    accountName: string;
    balance: number;
    investmentBalance: number;
    goals?: { id: string; name: string }[];
}

export function InvestmentButton({ accountId, accountName, balance, investmentBalance, goals }: InvestmentButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-semibold hover:bg-purple-500/20 hover:border-purple-500/50 transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            >
                <TrendingUp className="w-4 h-4" />
                Gerir Investimentos
            </button>
            <InvestmentModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                accountId={accountId}
                accountName={accountName}
                balance={balance}
                investmentBalance={investmentBalance}
                goals={goals}
            />
        </>
    );
}
