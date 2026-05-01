import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { transactions, payments, priceAlerts, walletAddresses } from "../drizzle/schema";
import axios from "axios";

// Crypto API - using CoinGecko free API
const CRYPTO_API_BASE = "https://api.coingecko.com/api/v3";

async function getCryptoPrices(symbols: string[]) {
  try {
    const ids = symbols.map(s => s.toLowerCase());
    const response = await axios.get(`${CRYPTO_API_BASE}/simple/price`, {
      params: {
        ids: ids.join(","),
        vs_currencies: "inr",
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch crypto prices:", error);
    return {};
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Crypto market data
  market: router({
    getPrices: publicProcedure
      .input(z.object({
        symbols: z.array(z.string()),
      }))
      .query(async ({ input }) => {
        const prices = await getCryptoPrices(input.symbols);
        return prices;
      }),

    getTopCoins: publicProcedure.query(async () => {
      try {
        const response = await axios.get(`${CRYPTO_API_BASE}/coins/markets`, {
          params: {
            vs_currency: "inr",
            order: "market_cap_desc",
            per_page: 10,
            page: 1,
            sparkline: false,
            locale: "en",
          },
        });
        return response.data.map((coin: any) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          marketCap: coin.market_cap,
          volume24h: coin.total_volume,
          change24h: coin.price_change_percentage_24h,
          image: coin.image,
        }));
      } catch (error) {
        console.error("Failed to fetch top coins:", error);
        return [];
      }
    }),
  }),

  // Portfolio management
  portfolio: router({
    getPortfolio: protectedProcedure.query(async ({ ctx }) => {
      const portfolio = await db.getOrCreatePortfolio(ctx.user.id);
      const userHoldings = await db.getUserHoldings(ctx.user.id);
      return { portfolio, holdings: userHoldings };
    }),

    getHoldings: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserHoldings(ctx.user.id);
    }),
  }),

  // Transactions
  transactions: router({
    getTransactions: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        return db.getUserTransactions(ctx.user.id, input.limit);
      }),

    createTransaction: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        type: z.enum(["buy", "sell"]),
        quantity: z.string(),
        price: z.string(),
        paymentId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const total = (parseFloat(input.quantity) * parseFloat(input.price)).toString();
        
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        await database.insert(transactions).values({
          userId: ctx.user.id,
          symbol: input.symbol,
          type: input.type as any,
          quantity: input.quantity,
          price: input.price,
          total,
          paymentId: input.paymentId,
          status: "completed",
        });

        // Create alert
        await db.createAlert(
          ctx.user.id,
          "trade",
          `${input.type.toUpperCase()} ${input.quantity} ${input.symbol}`,
          `Successfully ${input.type === "buy" ? "bought" : "sold"} ${input.quantity} ${input.symbol} at ₹${input.price}`
        );

        return { success: true };
      }),
  }),

  // Payments (Razorpay)
  payments: router({
    createOrder: protectedProcedure
      .input(z.object({
        amount: z.string(),
        currency: z.string().default("INR"),
      }))
      .mutation(async ({ ctx, input }) => {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
          // Fallback for development if keys are missing
          console.warn("[Razorpay] Missing API keys, using mock order");
          const orderId = `order_${Date.now()}`;
          return { orderId, amount: input.amount, currency: input.currency, key: "mock" };
        }

        try {
          const Razorpay = (await import("razorpay")).default;
          const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
          });

          const order = await razorpay.orders.create({
            amount: Math.round(parseFloat(input.amount) * 100), // Razorpay expects amount in paise
            currency: input.currency,
            receipt: `receipt_${Date.now()}`,
          });

          const database = await db.getDb();
          if (database) {
            await database.insert(payments).values({
              userId: ctx.user.id,
              razorpayOrderId: order.id,
              amount: input.amount,
              currency: input.currency,
              status: "created",
            });
          }

          return {
            orderId: order.id,
            amount: input.amount,
            currency: input.currency,
            key: keyId,
          };
        } catch (error) {
          console.error("[Razorpay] Order creation failed:", error);
          throw new Error("Failed to create payment order");
        }
      }),

    getPayments: protectedProcedure
      .input(z.object({
        limit: z.number().default(20),
      }))
      .query(async ({ ctx, input }) => {
        return db.getUserPayments(ctx.user.id, input.limit);
      }),
  }),

  // Watchlist
  watchlist: router({
    getWatchlist: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserWatchlist(ctx.user.id);
    }),

    addToWatchlist: protectedProcedure
      .input(z.object({ symbol: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.addToWatchlist(ctx.user.id, input.symbol);
        return { success: true };
      }),

    removeFromWatchlist: protectedProcedure
      .input(z.object({ symbol: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFromWatchlist(ctx.user.id, input.symbol);
        return { success: true };
      }),
  }),

  // Alerts
  alerts: router({
    getAlerts: protectedProcedure
      .input(z.object({
        limit: z.number().default(20),
      }))
      .query(async ({ ctx, input }) => {
        return db.getUserAlerts(ctx.user.id, input.limit);
      }),

    getPriceAlerts: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPriceAlerts(ctx.user.id);
    }),

    createPriceAlert: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        targetPrice: z.string(),
        alertType: z.enum(["above", "below"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        await database.insert(priceAlerts).values({
          userId: ctx.user.id,
          symbol: input.symbol,
          targetPrice: input.targetPrice,
          alertType: input.alertType as any,
        });
        return { success: true };
      }),
  }),

  // Wallet
  wallet: router({
    getAddresses: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserWalletAddresses(ctx.user.id);
    }),

    addAddress: protectedProcedure
      .input(z.object({
        symbol: z.string(),
        address: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new Error("Database not available");
        
        await database.insert(walletAddresses).values({
          userId: ctx.user.id,
          symbol: input.symbol,
          address: input.address,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
