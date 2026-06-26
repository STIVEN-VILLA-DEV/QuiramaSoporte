import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "❌ DATABASE_URL no configurada. " +
      "Agregala en las Environment Variables de Vercel."
    );
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

/**
 * Lazy Prisma client — throws at first USE, not at import time.
 * This way, importing prisma.ts doesn't crash the app if DATABASE_URL is missing.
 * Use `await prisma.$connect()` explicitly if you want eager init.
 */
function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Proxy tricks TypeScript into accepting prisma.method() calls
// while deferring the actual client creation.
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrisma();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/**
 * Serialize Prisma objects for RSC → Client Component transport.
 * Converts Decimals → numbers, Dates → ISO strings, etc.
 */
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
