"use server";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function requestPasswordReset(email: string) {
    try {
        // Verificar se o e-mail existe
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Retornar sucesso mesmo se e-mail não existe (segurança)
            return { success: true };
        }

        // Deletar tokens anteriores (evita conflito se formulário for enviado mais de uma vez)
        await (prisma as any).passwordResetToken.deleteMany({
            where: { email, used: false }
        });

        // Gerar novo token
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await (prisma as any).passwordResetToken.create({
            data: { token, email, expiresAt }
        });

        // Enviar e-mail
        console.log("[Password Reset] Enviando e-mail para:", email);
        await sendPasswordResetEmail(email, token);
        console.log("[Password Reset] E-mail enviado com sucesso!");

        return { success: true };
    } catch (error: any) {
        console.error("[Password Reset] Erro:", error?.message || error);
        return { success: false, error: "Erro ao enviar o e-mail de recuperação. Tente novamente." };
    }
}

export async function resetPassword(token: string, newPassword: string) {
    try {
        const resetToken = await (prisma as any).passwordResetToken.findUnique({
            where: { token }
        });

        if (!resetToken) {
            return { success: false, error: "Token inválido ou não encontrado." };
        }

        if (resetToken.used) {
            return { success: false, error: "Este link já foi utilizado. Solicite um novo." };
        }

        if (new Date() > resetToken.expiresAt) {
            return { success: false, error: "Este link expirou. Solicite um novo." };
        }

        if (newPassword.length < 6) {
            return { success: false, error: "A senha precisa ter no mínimo 6 caracteres." };
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Atualizar senha do usuário
        await prisma.user.update({
            where: { email: resetToken.email },
            data: { password: hashedPassword }
        });

        // Marcar token como usado
        await (prisma as any).passwordResetToken.update({
            where: { id: resetToken.id },
            data: { used: true }
        });

        return { success: true };
    } catch (error) {
        console.error("Erro ao redefinir senha:", error);
        return { success: false, error: "Erro interno ao processar sua solicitação." };
    }
}
