import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { parseEnv } from '@neon/env';
import neonConfig from '../../../neon';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const { postgres } = parseEnv(neonConfig, ['DATABASE_URL']);

  const adapter = new PrismaNeon(
    {
      connectionString: postgres.databaseUrl,
      max: 10,
      connectionTimeoutMillis: 15_000,
      idleTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    },
    {
      onPoolError: (err) => {
        console.error('[Neon Pool Error]:', err);
      },
    }
  );

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

