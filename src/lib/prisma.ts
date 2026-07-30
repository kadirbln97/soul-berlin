import { PrismaClient } from "@prisma/client";

// Verhindert im Next.js-Dev-Modus (Hot Reload), dass bei jeder Änderung
// eine neue Prisma-Instanz + neue DB-Verbindung aufgebaut wird.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
