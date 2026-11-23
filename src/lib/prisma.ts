import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não está definido. Configure a connection string Postgres " +
      "(no Vercel: pooled URL do Neon/Supabase) nas variáveis de ambiente."
  );
}

/**
 * Cliente Prisma único por processo. Em desenvolvimento o global evita
 * recriar ligações a cada hot reload.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
