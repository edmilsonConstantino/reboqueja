import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function criarPrisma(): PrismaClient {
  try {
    return (
      globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      })
    );
  } catch (error) {
    console.warn("[AI Studio] Database client initialization failed — using mock fallback", error);
    const noOp = {
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
      create: async (d: any) => d?.data ?? {},
      update: async (d: any) => d?.data ?? {},
      delete: async () => ({}),
      deleteMany: async () => ({ count: 0 }),
      count: async () => 0,
    };
    return new Proxy({}, { get: () => noOp }) as unknown as PrismaClient;
  }
}

export const prisma = criarPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
