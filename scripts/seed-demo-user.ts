import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@mylife.com';

async function main() {
    console.log('🔄 Iniciando Seeding do Usuário de Demonstração...');

    // 1. Apagar dados antigos do Demo (se existir)
    const existingDemo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (existingDemo) {
        console.log('🗑️ Apagando dados antigos do Demo...');
        await prisma.user.delete({ where: { id: existingDemo.id } });
    }

    // 2. Criar o Usuário Demo
    const hashedPassword = await bcrypt.hash('demo123456', 10);
    const demoUser = await prisma.user.create({
        data: {
            name: 'Usuário Demonstração',
            email: DEMO_EMAIL,
            password: hashedPassword,
            cpf: '000.000.000-00',
            phone: '11999999999',
            isAdmin: false,
            stripePriceId: 'price_demo_pro_plan',
            stripeSubscriptionId: 'sub_demo_123',
        }
    });
    console.log('✅ Usuário Demo criado!');

    // 3. Criar Contas
    console.log('🏦 Criando Contas...');
    const checkingAccount = await prisma.account.create({
        data: { userId: demoUser.id, name: 'Nubank', type: 'CHECKING', balance: 4500.50, color: '#8b5cf6', sortOrder: 0 }
    });
    const savingsAccount = await prisma.account.create({
        data: { userId: demoUser.id, name: 'Itaú Guardado', type: 'SAVINGS', balance: 12000.00, color: '#f97316', sortOrder: 1 }
    });
    const brokerAccount = await prisma.account.create({
        data: { userId: demoUser.id, name: 'XP Investimentos', type: 'INVESTMENT', balance: 0, investmentBalance: 35000.00, color: '#10b981', sortOrder: 2 }
    });

    // 4. Criar Metas
    console.log('🎯 Criando Metas...');
    const goalEmergency = await prisma.goal.create({
        data: { userId: demoUser.id, name: 'Reserva de Emergência', targetAmount: 50000, currentAmount: 35000, color: '#3b82f6' }
    });
    const goalTravel = await prisma.goal.create({
        data: { userId: demoUser.id, name: 'Viagem Europa', targetAmount: 25000, currentAmount: 5000, color: '#ec4899', deadline: new Date('2026-12-01') }
    });

    // 5. Criar Categorias
    console.log('🏷️ Criando Categorias...');
    const catSalary = await prisma.category.create({
        data: { userId: demoUser.id, name: 'Salário', type: 'INCOME', color: '#10b981', isFixed: true }
    });
    const catFood = await prisma.category.create({
        data: { userId: demoUser.id, name: 'Alimentação', type: 'EXPENSE', color: '#ef4444', isRequired: true, monthlyLimit: 1500 }
    });
    const catTransport = await prisma.category.create({
        data: { userId: demoUser.id, name: 'Transporte', type: 'EXPENSE', color: '#f59e0b', isRequired: true, monthlyLimit: 500 }
    });
    const catLeisure = await prisma.category.create({
        data: { userId: demoUser.id, name: 'Lazer & Streaming', type: 'EXPENSE', color: '#8b5cf6', isRequired: false, isFixed: false, monthlyLimit: 800 }
    });
    const catHealth = await prisma.category.create({
        data: { userId: demoUser.id, name: 'Saúde', type: 'EXPENSE', color: '#06b6d4', isRequired: true, isFixed: true, monthlyLimit: 400 }
    });

    // 6. Criar Cartão de Crédito
    console.log('💳 Criando Cartão...');
    const creditCard = await prisma.creditCard.create({
        data: { userId: demoUser.id, accountId: checkingAccount.id, name: 'Nubank Ultravioleta', limit: 15000, closingDay: 25, dueDay: 5, color: '#8b5cf6' }
    });

    // 7. Criar Transações (Mês Atual e Anterior para ter gráfico)
    console.log('💸 Gerando Transações de Histórico...');
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

    const transactionsData = [
        // Mês Passado
        { userId: demoUser.id, accountId: checkingAccount.id, categoryId: catSalary.id, type: 'INCOME', amount: 8500, description: 'Salário ref. Mês Anterior', date: lastMonth, isPaid: true },
        { userId: demoUser.id, accountId: checkingAccount.id, categoryId: catFood.id, type: 'EXPENSE', amount: 450.20, description: 'Mercado Carrefour', date: lastMonth, isPaid: true },
        { userId: demoUser.id, accountId: checkingAccount.id, categoryId: catHealth.id, type: 'EXPENSE', amount: 400, description: 'Plano de Saúde', date: lastMonth, isPaid: true },
        // Mês Atual
        { userId: demoUser.id, accountId: checkingAccount.id, categoryId: catSalary.id, type: 'INCOME', amount: 8500, description: 'Salário ref. Mês Atual', date: new Date(now.getFullYear(), now.getMonth(), 5), isPaid: true },
        { userId: demoUser.id, accountId: checkingAccount.id, categoryId: catFood.id, type: 'EXPENSE', amount: 120.50, description: 'Ifood', date: new Date(now.getFullYear(), now.getMonth(), 10), isPaid: true },
        { userId: demoUser.id, accountId: checkingAccount.id, categoryId: catFood.id, type: 'EXPENSE', amount: 680.15, description: 'Mercado Assaí', date: new Date(now.getFullYear(), now.getMonth(), 12), isPaid: true },
        { userId: demoUser.id, accountId: checkingAccount.id, categoryId: catTransport.id, type: 'EXPENSE', amount: 150.00, description: 'Posto Ipiranga', date: new Date(now.getFullYear(), now.getMonth(), 14), isPaid: true },
        { userId: demoUser.id, accountId: checkingAccount.id, categoryId: catHealth.id, type: 'EXPENSE', amount: 400, description: 'Plano de Saúde', date: new Date(now.getFullYear(), now.getMonth(), 20), isPaid: false },
    ];

    // Transações no Cartão de Crédito 
    // Mês Atual (Fatura atual)
    const cardTransactions = [
        { userId: demoUser.id, creditCardId: creditCard.id, categoryId: catLeisure.id, type: 'EXPENSE', amount: 55.90, description: 'Netflix', date: new Date(now.getFullYear(), now.getMonth(), 10), isPaid: true },
        { userId: demoUser.id, creditCardId: creditCard.id, categoryId: catLeisure.id, type: 'EXPENSE', amount: 28.90, description: 'Spotify', date: new Date(now.getFullYear(), now.getMonth(), 12), isPaid: true },
        { userId: demoUser.id, creditCardId: creditCard.id, categoryId: catFood.id, type: 'EXPENSE', amount: 180.00, description: 'Restaurante Fim de Semana', date: new Date(now.getFullYear(), now.getMonth(), 15), isPaid: true }
    ];

    await prisma.transaction.createMany({ data: [...transactionsData, ...cardTransactions] as any });

    console.log('🚀 Seeding finalizado com sucesso! Demo pronta para uso.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
