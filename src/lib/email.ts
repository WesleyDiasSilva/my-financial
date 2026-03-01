import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const { data, error } = await resend.emails.send({
        from: 'MyLife <onboarding@resend.dev>',
        to: email,
        subject: 'Redefinir sua senha - MyLife',
        html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #050a10; color: #e2e8f0; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
                <div style="height: 4px; background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%);"></div>
                <div style="padding: 40px 32px;">
                    <div style="text-align: center; margin-bottom: 32px;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
                            <span style="color: white;">My</span><span style="color: #00d2ff;">Life</span>
                        </h1>
                    </div>
                    <h2 style="color: white; text-align: center; font-size: 20px; margin-bottom: 16px;">Redefinir sua senha</h2>
                    <p style="color: #94a3b8; text-align: center; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
                        Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para continuar.
                    </p>
                    <div style="text-align: center; margin-bottom: 32px;">
                        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%); color: white; font-weight: 700; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">
                            REDEFINIR SENHA
                        </a>
                    </div>
                    <p style="color: #64748b; text-align: center; font-size: 12px; line-height: 1.6;">
                        Este link expira em <strong style="color: #94a3b8;">1 hora</strong>. Se você não solicitou a redefinição, pode ignorar este e-mail com segurança.
                    </p>
                </div>
                <div style="background: #0d1117; padding: 20px 32px; text-align: center; border-top: 1px solid #1e293b;">
                    <p style="color: #475569; font-size: 11px; margin: 0;">MyLife - Gestão Inteligente</p>
                </div>
            </div>
        `,
    });

    if (error) {
        console.error("[Resend] Erro ao enviar e-mail:", JSON.stringify(error));
        throw new Error(`Falha ao enviar e-mail: ${error.message}`);
    }

    console.log("[Resend] E-mail enviado com sucesso, ID:", data?.id);
    return data;
}
