import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, cpf, phone, password } = body;

        if (!name || !email || !cpf || !phone || !password) {
            return NextResponse.json(
                { message: "Preencha todos os campos obrigatórios." },
                { status: 400 }
            );
        }

        // Check if user exists by email or cpf
        const userExists = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { cpf }],
            },
        });

        if (userExists) {
            return NextResponse.json(
                { message: "Um usuário com este Email ou CPF já está cadastrado." },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                cpf,
                phone,
                password: hashedPassword,
            },
        });

        return NextResponse.json(
            { message: "Usuário cadastrado com sucesso!", user: { id: user.id } },
            { status: 201 }
        );
    } catch (error) {
        console.error("REGISTER_ERROR", error);
        return NextResponse.json(
            { message: "Erro interno no servidor." },
            { status: 500 }
        );
    }
}
