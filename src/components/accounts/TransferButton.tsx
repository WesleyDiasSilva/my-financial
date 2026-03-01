"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { TransferModal } from "@/components/accounts/TransferModal";

interface Account {
    id: string;
    name: string;
    balance: number;
    type: string;
    color: string | null;
}

interface TransferButtonProps {
    currentAccountId: string;
    accounts: Account[];
}

export function TransferButton({ currentAccountId, accounts }: TransferButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl text-sm font-semibold hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
                <ArrowLeftRight className="w-4 h-4" />
                Transferir
            </button>
            <TransferModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                currentAccountId={currentAccountId}
                accounts={accounts}
            />
        </>
    );
}
