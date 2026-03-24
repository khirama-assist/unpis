import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPrismaClient = any;

function createPrismaClient(): AnyPrismaClient {
  let adapter;
  if (process.env.TURSO_DATABASE_URL) {
    // 本番環境: Turso（クラウドDB）を使用
    adapter = new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  } else {
    // 開発環境: ローカルSQLiteファイルを使用
    const dbPath = path.join(process.cwd(), "dev.db");
    const url = `file:${dbPath}`;
    adapter = new PrismaLibSql({ url });
  }
  // Prisma 7 requires adapter to be passed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: AnyPrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
