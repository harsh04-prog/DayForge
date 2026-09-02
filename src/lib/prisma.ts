import { PrismaClient } from '@prisma/client';

function getSanitizedDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Strip channel_binding=require as Node.js / Prisma TLS does not support it
  if (url.includes('channel_binding=')) {
    url = url.replace(/[?&]channel_binding=[^&]+/, '');
    if (!url.includes('?') && url.includes('&')) {
      url = url.replace('&', '?');
    }
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const cleanUrl = getSanitizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: cleanUrl ? { db: { url: cleanUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
