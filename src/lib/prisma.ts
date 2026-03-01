import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma3: PrismaClient };

export const prisma = globalForPrisma.prisma3 || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma3 = prisma;
