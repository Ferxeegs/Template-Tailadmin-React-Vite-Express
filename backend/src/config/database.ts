import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Singleton pattern untuk PrismaClient
// Mencegah multiple instances saat development dengan hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Validasi DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

// Konfigurasi PrismaClient
// Prisma akan otomatis membaca DATABASE_URL dari environment variable
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;