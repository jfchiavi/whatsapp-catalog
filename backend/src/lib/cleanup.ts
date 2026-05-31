import { prisma } from '@/lib/prisma';
//Limpieza automática de refresh tokens vencidos
// Podés ejecutar esto:
// con un cron
// al levantar la app
// o en un job serverless
export const cleanupExpiredTokens = async () => {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
};
