import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prismaClient = new PrismaClient({
  adapter,
});
