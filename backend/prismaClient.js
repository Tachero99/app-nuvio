import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

const pool =
  globalForPrisma.__nuvioPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__nuvioPool = pool;

const adapter =
  globalForPrisma.__nuvioAdapter ?? new PrismaPg(pool);

if (process.env.NODE_ENV !== "production") globalForPrisma.__nuvioAdapter = adapter;

const prisma =
  globalForPrisma.__nuvioPrisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.__nuvioPrisma = prisma;

export default prisma;
export { prisma };
