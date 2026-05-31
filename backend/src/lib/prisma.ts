//If a custom path exists, update your import statement to match the relative path, see shcema.prisma client output path
//import { PrismaClient } from '../generated/prisma'; 
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
//TODO: primero conectar y configurar la DB antes de volver a habilitar esto