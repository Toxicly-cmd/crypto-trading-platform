import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, portfolios, holdings, transactions, payments, alerts, priceAlerts, watchlists, walletAddresses } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  const isDev = process.env.NODE_ENV === "development";
  const dbUrl = process.env.DATABASE_URL;

  if (!_db && dbUrl && dbUrl !== "mock") {
    try {
      _db = drizzle(dbUrl);
    } catch (error) {
      console.warn("[Database] Failed to initialize drizzle:", error);
      _db = null;
    }
  }
  
  if (!_db && process.env.NODE_ENV === "development") {
    // Return a mock object to avoid crashes in dev mode
    return {
      select: () => ({
        from: (table: any) => {
          const tableName = table?.name || (table as any)[Symbol.for('drizzle:Name')] || '';
          console.log(`[MockDB] Matching table: "${tableName}"`);
          return {
            where: () => ({
              limit: () => {
                if (table === portfolios) {
                  return Promise.resolve([{ id: 1, userId: 1, totalInvested: "100000", totalValue: "125000", totalProfitLoss: "25000" }]);
                }
                if (table === users) {
                  return Promise.resolve([{ id: 1, openId: "mock-user-id", name: "Toxic User", email: "toxic@example.com", role: "user" }]);
                }
                if (table === holdings) {
                  return Promise.resolve([
                    { id: 1, userId: 1, symbol: "BTC", quantity: "0.5", averageBuyPrice: "4500000", currentPrice: "5200000", totalValue: "2600000", profitLoss: "350000" },
                    { id: 2, userId: 1, symbol: "ETH", quantity: "5.0", averageBuyPrice: "250000", currentPrice: "280000", totalValue: "1400000", profitLoss: "150000" }
                  ]);
                }
                return Promise.resolve([]);
              },
              orderBy: () => ({
                limit: () => Promise.resolve([])
              })
            })
          };
        }
      }),
      insert: () => ({ values: () => ({ onDuplicateKeyUpdate: () => Promise.resolve() }), onDuplicateKeyUpdate: () => Promise.resolve() }),
      delete: () => ({ where: () => Promise.resolve() }),
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    } as any;
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Portfolio queries
export async function getOrCreatePortfolio(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(portfolios).where(eq(portfolios.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }

  await db.insert(portfolios).values({
    userId,
    totalInvested: "0",
    totalValue: "0",
    totalProfitLoss: "0",
  });

  const result = await db.select().from(portfolios).where(eq(portfolios.userId, userId)).limit(1);
  return result[0];
}

// Holdings queries
export async function getUserHoldings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(holdings).where(eq(holdings.userId, userId));
}

export async function getHoldingBySymbol(userId: number, symbol: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(holdings).where(
    and(eq(holdings.userId, userId), eq(holdings.symbol, symbol))
  ).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Transaction queries
export async function getUserTransactions(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

// Payment queries
export async function getPaymentByRazorpayOrderId(orderId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(payments)
    .where(eq(payments.razorpayOrderId, orderId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserPayments(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

// Alert queries
export async function createAlert(userId: number, type: string, title: string, message?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(alerts).values({
    userId,
    type: type as any,
    title,
    message,
  });
}

export async function getUserAlerts(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt))
    .limit(limit);
}

// Watchlist queries
export async function getUserWatchlist(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(watchlists).where(eq(watchlists.userId, userId));
}

export async function addToWatchlist(userId: number, symbol: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(watchlists).values({ userId, symbol });
}

export async function removeFromWatchlist(userId: number, symbol: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(watchlists).where(
    and(eq(watchlists.userId, userId), eq(watchlists.symbol, symbol))
  );
}

// Price alert queries
export async function getUserPriceAlerts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(priceAlerts).where(eq(priceAlerts.userId, userId));
}

export async function getActivePriceAlerts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(priceAlerts).where(eq(priceAlerts.isActive, true));
}

// Wallet address queries
export async function getUserWalletAddresses(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(walletAddresses).where(eq(walletAddresses.userId, userId));
}

export async function getWalletAddressBySymbol(userId: number, symbol: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(walletAddresses).where(
    and(eq(walletAddresses.userId, userId), eq(walletAddresses.symbol, symbol))
  ).limit(1);

  return result.length > 0 ? result[0] : undefined;
}
