"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function seedInitialCategories() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const userId = session.user.id;

    const seedData = [
        { name: "Casa", limit: 2000, color: "#60a5fa" },
        { name: "Transporte", limit: 800, color: "#f472b6" },
        { name: "Alimentação", limit: 1000, color: "#34d399" },
        { name: "Refeição", limit: 400, color: "#fbbf24" },
        { name: "Educação", limit: 500, color: "#a78bfa" },
        { name: "Planejador financeiro", limit: 350, color: "#9ca3af" },
        { name: "Cuidados Pessoais", limit: 50, color: "#f87171" },
        { name: "Assinaturas/Streaming", limit: 100, color: "#2dd4bf" },
        { name: "Taxas bancárias", limit: 30, color: "#94a3b8" },
        { name: "Lazer", limit: 250, color: "#fb923c" },
        { name: "Manuela", limit: 1000, color: "#e879f9" },
        { name: "Saúde", limit: 450, color: "#38bdf8" },
        { name: "Financiamento", limit: 822, color: "#8b5cf6" },
        { name: "Empréstimos", limit: 585, color: "#ef4444" }
    ];

    for (const data of seedData) {
        // Verificar se a categoria já existe para esse usuário para não duplicar
        const existing = await prisma.category.findFirst({
            where: {
                userId,
                name: data.name,
                type: "EXPENSE"
            }
        });

        if (!existing) {
            await prisma.category.create({
                data: {
                    name: data.name,
                    monthlyLimit: data.limit,
                    color: data.color,
                    type: "EXPENSE",
                    userId,
                    isRequired: false,
                    isFixed: false
                }
            });
        }
    }

    revalidatePath("/planning");
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/credit-cards");
}
