import { PrismaClient } from "@prisma/client";

function isRetriableConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";

  return (
    message.includes("closed") ||
    message.includes("connection terminated") ||
    message.includes("connection reset") ||
    message.includes("econnreset") ||
    message.includes("server has closed") ||
    message.includes("kind: closed")
  );
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            return await query(args);
          } catch (error) {
            if (!isRetriableConnectionError(error)) throw error;

            await client.$disconnect().catch(() => undefined);
            await client.$connect();
            return query(args);
          }
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function getPrismaClient() {
  const cached = globalForPrisma.prisma;

  // Dev HMR can keep an old singleton after `prisma generate` adds new models.
  if (cached && !cached.appSettings) {
    void cached.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
  }

  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = new Proxy({} as ReturnType<typeof createPrismaClient>, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof typeof client];

    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }

    return value;
  },
});
