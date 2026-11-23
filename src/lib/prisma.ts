import "server-only";
import { PrismaClient } from "@prisma/client";
import { getMockPrismaClient } from "@/lib/mock-prisma";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;
  if (!/^postgres(ql)?:\/\//i.test(url)) return false;
  // Detect template / placeholder Neon or example connection strings
  if (
    url.includes("ep-xxxx") ||
    url.includes("utilizador:senha") ||
    url.includes("usuario:senha") ||
    url.includes("placeholder")
  ) {
    return false;
  }
  return true;
}

let prismaInstance: PrismaClient;

if (!isDatabaseConfigured()) {
  prismaInstance = getMockPrismaClient();
} else {
  try {
    prismaInstance =
      globalForPrisma.prisma ??
      new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["warn", "error"]
            : ["error"],
      });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaInstance;
    }
  } catch {
    prismaInstance = getMockPrismaClient();
  }
}

export const prisma = prismaInstance;
