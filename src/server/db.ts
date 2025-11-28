import { PrismaClient } from "@prisma/client";
import { env } from "~/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // ✅ Add connection configuration
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// ✅ Handle connection errors gracefully (don't crash the server)
db.$connect()
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
    // Don't crash, just log the error
  });

// ✅ Graceful shutdown on process exit
process.on("beforeExit", async () => {
  await db.$disconnect();
});
