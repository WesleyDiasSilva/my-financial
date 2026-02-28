"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { seedInitialCategories } from "@/actions/seed";

export function SeedButton() {
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        setLoading(true);
        try {
            await seedInitialCategories();
            toast.success("Categorias geradas com sucesso!");
        } catch (error: any) {
            toast.error(error.message || "Erro ao gerar categorias.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleSeed}
            disabled={loading}
            className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all font-bold text-xs uppercase tracking-widest hidden md:flex"
        >
            <Download className="h-4 w-4 mr-2" />
            {loading ? "Gerando..." : "Popular Categorias Iniciais"}
        </Button>
    );
}
