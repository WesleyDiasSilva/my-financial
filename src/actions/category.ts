"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createCategory(data: { name: string; type: "INCOME" | "EXPENSE"; color: string; monthlyLimit?: number | null; isRequired?: boolean; isFixed?: boolean }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const category = await prisma.category.create({
        data: {
            ...data,
            userId: session.user.id,
        },
    });

    revalidatePath("/planning");
    revalidatePath("/transactions");
    return {
        ...category,
        monthlyLimit: category.monthlyLimit ? Number(category.monthlyLimit) : null
    };
}

export async function getCategories() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const categories = await prisma.category.findMany({
        where: { userId: session.user.id },
        orderBy: { name: "asc" },
    });
    return categories.map(c => ({
        ...c,
        monthlyLimit: c.monthlyLimit ? Number(c.monthlyLimit) : null
    }));
}

export async function deleteCategory(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) throw new Error("Não encontrado");

    if (id === `system-invoice-${session.user.id}`) {
        throw new Error("A categoria de Pagamento de Fatura do cartão é nativa do sistema e não pode ser excluída.");
    }

    try {
        await prisma.category.delete({
            where: { id },
        });
    } catch (error: any) {
        if (error.code === 'P2003') {
            throw new Error("Não é possível excluir esta categoria pois há transações vinculadas a ela.");
        }
        throw new Error("Ocorreu um erro ao excluir a categoria.");
    }

    revalidatePath("/planning");
    revalidatePath("/transactions");
}

export async function updateCategory(id: string, data: { name: string; type: "INCOME" | "EXPENSE"; color: string; monthlyLimit?: number | null; isRequired?: boolean; isFixed?: boolean }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Não autorizado");

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) throw new Error("Não encontrado");

    // Block logic and properties override for system category
    if (id === `system-invoice-${session.user.id}`) {
        data.type = "EXPENSE"; // Força ser despesa
        data.color = existing.color || "#ef4444"; // Bloqueia mudança de cor com fallback
        data.isRequired = existing.isRequired;
        data.isFixed = existing.isFixed;
    }

    const category = await prisma.category.update({
        where: { id },
        data,
    });

    revalidatePath("/planning");
    revalidatePath("/transactions");
    return {
        ...category,
        monthlyLimit: category.monthlyLimit ? Number(category.monthlyLimit) : null
    };
}
