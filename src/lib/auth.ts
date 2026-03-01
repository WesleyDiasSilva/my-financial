import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { cookies } from "next/headers";
import { DEMO_USER_EMAIL } from "./auth-util";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Senha", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Credenciais inválidas");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password) {
                    throw new Error("Usuário não encontrado!");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Senha incorreta");
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    cpf: user.cpf,
                    isAdmin: user.isAdmin,
                };
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.cpf = (user as any).cpf;
                token.isAdmin = (user as any).isAdmin;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                let currentId = token.id as string;
                const isAdmin = token.isAdmin as boolean;

                if (isAdmin) {
                    try {
                        const cookieStore = await cookies();
                        if (cookieStore.get("admin_demo_mode")?.value === "true") {
                            const demoUser = await prisma.user.findUnique({
                                where: { email: DEMO_USER_EMAIL },
                                select: { id: true }
                            });
                            if (demoUser) {
                                currentId = demoUser.id;
                            }
                        }
                    } catch (e) {
                        // Pass silently if cookies() is called outside HTTP request
                    }
                }

                session.user.id = currentId;
                (session.user as any).cpf = token.cpf as string;
                (session.user as any).isAdmin = isAdmin;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
