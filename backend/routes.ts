import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { storage } from "./storage";
import { analyzeFashionImage, generateSizeRecommendation } from "./openai";
import { generateVirtualTryOn } from "./tryon";
import crypto, { randomUUID } from "crypto";
import { getSubscriptionPlans } from "./subscription-plans";
import { db, ensureSchemaMigrations } from "./db";

type UserRole = "customer" | "producer" | "admin" | "agent";
import {
  subscriptions,
  users,
  products,
  orders,
  userWallets,
  walletPayments,
  paymentSettings,
} from "./shared/schema.dialect";
import { and, eq, desc, sql, inArray } from "drizzle-orm";
import {
  createSubscription,
  renewSubscription,
  updateSubscriptionStatus,
} from "./subscriptions";
import {
  getProducerSubscriptionStatus,
  getProducerStats,
} from "./producer-routes";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});
// Centralized JWT secret
const jwtSecret =
  process.env.JWT_SECRET ||
  "o3j3k3m1YwT8c4h1j6JtU9v2bX5rQ7e0sN8aZ3lK1tM9wD2pF6gH4rJ7nV1xB0s";
import {
  insertUserSchema,
  insertProductSchema,
  insertCategorySchema,
  insertCartItemSchema,
  insertFavoriteSchema,
  insertTryOnSessionSchema,
} from "./shared/schema.dialect";
import {
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  getProducerOrders,
  updateOrderValidationStatus,
  getOrdersByProducerId,
} from "./orders";
import {
  getAgentStats,
  getAgentProducers,
  getAvailableProducers,
  assignAgentToProducer,
  getProducerDetails,
  getAgentCommissions,
  processSubscriptionPayment,
} from "./agent-routes";
import {
  verifyProducer as adminVerifyProducer,
  verifyAgent as adminVerifyAgent,
  getProducerCompany as adminGetProducerCompany,
} from "./admin-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure minimal runtime migrations (safe, idempotent)
  try {
    await ensureSchemaMigrations();
  } catch (e) {
    console.warn(
      "ensureSchemaMigrations failed or is unavailable:",
      (e as any)?.message || e
    );
  }

  // Health and availability endpoints for cPanel/Monitors
  // Root path returns a stable Content-Type without charset to pass cPanel diff check
  app.get("/", (_req, res) => {
    res.status(200);
    res.setHeader("Content-Type", "text/html"); // no charset
    res.end("OK");
  });

  // Dedicated health endpoint with a simple, stable response
  app.get("/health", (_req, res) => {
    res.status(200);
    res.setHeader("Content-Type", "text/plain");
    res.end("ok");
  });

  // Static Esicia/Kpay configuration (for debugging without env)
  const ESICIA_STATIC = {
    BASE_URL: "https://pay.esicia.com/",
    BANK_ID: "130",
    RETAILER_ID: "01", // REPLACE with your real merchant retailer id
    REDIRECT_URL: "https://nyambika.com/profile",
    CALLBACK_BASE: "http://localhost:3003",
    USERNAME: "nyambika",
    PASSWORD: "3Pcg3l",
    AUTH_KEY: "6v0d5a5rr3ccjv7m3dufu773ts",
    TIMEOUT_MS: 20000,
  } as const;

  // Auth middleware with JWT

  const requireAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      // Backfill role for legacy tokens that may lack role claim
      if (!req.userRole) {
        try {
          const user = await storage.getUserById(req.userId);
          if (!user || !user.role) {
            return res.status(401).json({ message: "Authentication required" });
          }
          req.userRole = user.role;
        } catch (_e) {
          return res.status(401).json({ message: "Authentication required" });
        }
      }
      // Populate req.user for handlers that expect it (e.g., agent-routes)
      req.user = { id: req.userId, role: req.userRole } as any;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };

  // Utility: ensure a wallet exists for given user and return it
  const ensureUserWallet = async (userId: string) => {
    let [wallet] = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, userId))
      .limit(1);
    if (!wallet) {
      const [created] = await db
        .insert(userWallets)
        .values({ userId, balance: "0", status: "active" })
        .returning();
      wallet = created as any;
    }
    return wallet as any;
  };

  // Orders: validation status update
  app.put(
    "/api/orders/:id/validation-status",
    requireAuth,
    async (req, res) => {
      try {
        await updateOrderValidationStatus(req as any, res as any);
      } catch (error) {
        console.error("Error in PUT /api/orders/:id/validation-status:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // ===== Wallet Endpoints =====
  // Get current user's wallet (creates one if missing)
  app.get("/api/wallet", requireAuth, async (req: any, res) => {
    try {
      // Ensure wallet exists
      let [wallet] = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, req.userId))
        .limit(1);

      if (!wallet) {
        const [created] = await db
          .insert(userWallets)
          .values({ userId: req.userId, balance: "0", status: "active" })
          .returning();
        wallet = created as any;
      }

      res.json({
        id: wallet.id,
        balance: wallet.balance,
        status: wallet.status,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      });

      // Manual status check for push/STK payments
      app.post(
        "/api/payments/opay/checkstatus",
        requireAuth,
        async (req: any, res) => {
          try {
            const { refid } = req.body || {};
            if (!refid)
              return res.status(400).json({ message: "refid is required" });

            const [payment] = await db
              .select()
              .from(walletPayments)
              .where(eq(walletPayments.externalReference, refid))
              .limit(1);
            if (!payment)
              return res.status(404).json({ message: "Payment not found" });

            const endpoint = ESICIA_STATIC.BASE_URL;
            const timeoutMs = ESICIA_STATIC.TIMEOUT_MS;
            const payload = {
              action: "checkstatus",
              refid,
              authkey: ESICIA_STATIC.AUTH_KEY,
            } as any;

            const resp = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json, text/plain, */*",
                "User-Agent": "NyambikaAI/1.0",
                Authorization:
                  "Basic " +
                  Buffer.from(
                    `${ESICIA_STATIC.USERNAME}:${ESICIA_STATIC.PASSWORD}`
                  ).toString("base64"),
              },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(timeoutMs),
            });

            const json = (await resp.json()) as any;

            // Map status by statusid; fallback to reply/status text
            let finalStatus: "completed" | "failed" | "pending" = "pending";
            const sid = String(json?.statusid || "");
            if (sid === "01") finalStatus = "completed";
            else if (sid === "02") finalStatus = "failed";
            else if (sid === "03") finalStatus = "pending";
            else {
              const norm = String(
                json?.reply || json?.status || ""
              ).toLowerCase();
              if (["ok", "success", "successful", "completed"].includes(norm))
                finalStatus = "completed";
              else if (["failed", "error", "cancelled"].includes(norm))
                finalStatus = "failed";
            }

            // Update DB if changed
            if (finalStatus !== (payment.status as any)) {
              await db
                .update(walletPayments)
                .set({ status: finalStatus })
                .where(eq(walletPayments.id, payment.id));

              if (finalStatus === "completed") {
                const [wallet] = await db
                  .select()
                  .from(userWallets)
                  .where(eq(userWallets.id, payment.walletId))
                  .limit(1);
                if (wallet) {
                  const newBalance = String(
                    (Number(wallet.balance) || 0) + Number(payment.amount)
                  );
                  await db
                    .update(userWallets)
                    .set({ balance: newBalance, updatedAt: new Date() as any })
                    .where(eq(userWallets.id, wallet.id));
                }
              }
            }

            return res.json({ ok: true, status: finalStatus, gateway: json });
          } catch (error) {
            console.error(
              "Error in POST /api/payments/opay/checkstatus:",
              error
            );
            res.status(500).json({ message: "Internal server error" });
          }
        }
      );

      // NOTE: response ends above; following routes continue

      // Public endpoint to fetch product boost fee from payment_settings
      app.get("/api/payment-settings/product-boost", async (_req, res) => {
        try {
          let [setting] = await db
            .select()
            .from(paymentSettings)
            .where(eq(paymentSettings.id, 2))
            .limit(1);
          if (!setting) {
            const rows = await db
              .select()
              .from(paymentSettings)
              .where(eq(paymentSettings.name, "product_boost"))
              .limit(1);
            setting = rows[0] as any;
          }
          if (!setting)
            return res
              .status(404)
              .json({ message: "product_boost not configured" });
          return res.json(setting);
        } catch (e) {
          console.error("Error fetching product boost payment setting:", e);
          return res.status(500).json({ message: "Failed to load boost fee" });
        }
      });

      // Boost a product: charge boost fee from producer wallet and move product to top
      app.post(
        "/api/products/:id/boost",
        requireAuth,
        requireRole(["producer", "admin"]),
        async (req: any, res) => {
          try {
            const productId = req.params.id as string;
            // Fetch product
            const [product] = await db
              .select()
              .from(products)
              .where(eq(products.id, productId))
              .limit(1);
            if (!product) {
              return res.status(404).json({ message: "Product not found" });
            }
            // Authorization: producer can only boost own product unless admin
            if (req.userRole !== "admin" && product.producerId !== req.userId) {
              return res
                .status(403)
                .json({ message: "You can only boost your own product" });
            }

            // Read boost fee (by id=2 per requirement), fallback by name 'product_boost'
            let [boostSetting] = await db
              .select()
              .from(paymentSettings)
              .where(eq(paymentSettings.id, 2))
              .limit(1);
            if (!boostSetting) {
              const rows = await db
                .select()
                .from(paymentSettings)
                .where(eq(paymentSettings.name, "product_boost"))
                .limit(1);
              boostSetting = rows[0] as any;
            }
            if (!boostSetting) {
              return res
                .status(500)
                .json({ message: "Boost pricing not configured" });
            }
            const amount = Number(boostSetting.amountInRwf);
            if (!amount || amount <= 0) {
              return res.status(500).json({ message: "Invalid boost amount" });
            }

            // Ensure wallet exists
            let [wallet] = await db
              .select()
              .from(userWallets)
              .where(eq(userWallets.userId, req.userId))
              .limit(1);
            if (!wallet) {
              const [created] = await db
                .insert(userWallets)
                .values({ userId: req.userId, balance: "0", status: "active" })
                .returning();
              wallet = created as any;
            }

            const currentBalance = Number(wallet.balance) || 0;
            if (currentBalance < amount) {
              return res.status(402).json({
                message: "Insufficient wallet balance to boost product",
                required: amount,
                balance: currentBalance,
              });
            }

            // Record wallet payment (debit)
            const [payment] = await db
              .insert(walletPayments)
              .values({
                walletId: wallet.id,
                userId: req.userId,
                type: "debit",
                amount: String(amount.toFixed(2)),
                method: "mobile_money",
                provider: "mtn",
                status: "completed",
                description: `Product boost fee for product ${productId}`,
                externalReference: `BOOST-${Date.now()}`,
              })
              .returning();

            // Update wallet balance
            const newBalance = String((currentBalance - amount).toFixed(2));
            const [updatedWallet] = await db
              .update(userWallets)
              .set({ balance: newBalance, updatedAt: new Date() as any })
              .where(eq(userWallets.id, wallet.id))
              .returning();

            // Set product to top by assigning smallest display_order - 1 (NULLs treated as large)
            const [{ min_order } = { min_order: null }] = (await db
              .select({ min_order: sql<number>`MIN(${products.displayOrder})` })
              .from(products)) as any;
            const nextOrder =
              typeof min_order === "number" && !isNaN(min_order)
                ? min_order - 1
                : 0;

            const [updatedProduct] = await db
              .update(products)
              .set({ displayOrder: nextOrder as any })
              .where(eq(products.id, productId))
              .returning();

            res.json({
              product: updatedProduct,
              wallet: updatedWallet,
              payment,
              boostAmount: amount,
            });
          } catch (error) {
            console.error("Error boosting product:", error);
            res.status(500).json({ message: "Internal server error" });
          }
        }
      );
    } catch (error) {
      console.error("Error in GET /api/wallet:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Initiate a demo Mobile Money top-up (mock)
  app.post("/api/wallet/topup", requireAuth, async (req: any, res) => {
    try {
      const { amount, provider = "mtn", phone } = req.body || {};
      const parsedAmount = Number(amount);
      if (!parsedAmount || parsedAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      // Ensure wallet exists
      let [wallet] = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, req.userId))
        .limit(1);
      if (!wallet) {
        const [created] = await db
          .insert(userWallets)
          .values({ userId: req.userId, balance: "0", status: "active" })
          .returning();
        wallet = created as any;
      }

      // Create a pending wallet payment record
      const [payment] = await db
        .insert(walletPayments)
        .values({
          walletId: wallet.id,
          userId: req.userId,
          type: "topup",
          amount: String(parsedAmount.toFixed(2)),
          method: "mobile_money",
          provider,
          phone: phone || null,
          status: "pending",
          description: "Demo Mobile Money top-up",
          externalReference: `DEMO-${Date.now()}`,
        })
        .returning();

      // In demo mode, immediately mark as completed and update balance
      await db
        .update(walletPayments)
        .set({ status: "completed" })
        .where(eq(walletPayments.id, payment.id));

      const newBalance = String((Number(wallet.balance) || 0) + parsedAmount);
      const [updatedWallet] = await db
        .update(userWallets)
        .set({ balance: newBalance })
        .where(eq(userWallets.id, wallet.id))
        .returning();

      res.status(201).json({
        payment: { ...payment, status: "completed" },
        wallet: updatedWallet,
      });
    } catch (error) {
      console.error("Error in POST /api/wallet/topup:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Wallet webhook (mock) — accepts paymentId and marks it completed
  app.post("/api/wallet/webhook", async (req: any, res) => {
    try {
      const { paymentId, status = "completed" } = req.body || {};
      if (!paymentId) {
        return res.status(400).json({ message: "paymentId is required" });
      }

      const [payment] = await db
        .select()
        .from(walletPayments)
        .where(eq(walletPayments.id, paymentId))
        .limit(1);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Update payment status
      await db
        .update(walletPayments)
        .set({ status })
        .where(eq(walletPayments.id, paymentId));

      if (status === "completed") {
        // Credit wallet
        const [wallet] = await db
          .select()
          .from(userWallets)
          .where(eq(userWallets.id, payment.walletId))
          .limit(1);
        if (wallet) {
          const newBalance = String(
            (Number(wallet.balance) || 0) + Number(payment.amount)
          );
          await db
            .update(userWallets)
            .set({ balance: newBalance })
            .where(eq(userWallets.id, wallet.id));
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error in POST /api/wallet/webhook:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // List wallet payments for current user
  app.get("/api/wallet/payments", requireAuth, async (req: any, res) => {
    try {
      const list = await db
        .select()
        .from(walletPayments)
        .where(eq(walletPayments.userId, req.userId))
        .orderBy(desc(walletPayments.createdAt))
        .limit(100);
      res.json(list);
    } catch (error) {
      console.error("Error in GET /api/wallet/payments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== OPAY (Kpay/Esicia) Integration =====
  // Initiate OPAY top-up (Esicia)
  // ✅ Initiate payment
  app.post(
    "/api/payments/opay/initiate",
    requireAuth,
    async (req: any, res) => {
      try {
        const {
          amount,
          phone,
          email,
          details = "wallet_topup",
          cname,
          cnumber,
          pmethod = "momo",
          retailerid,
          bankid,
          currency = "RWF",
        } = req.body || {};

        const parsedAmount = Number(amount);
        if (!parsedAmount || parsedAmount <= 0) {
          return res.status(400).json({ message: "Invalid amount" });
        }
        if (!phone || typeof phone !== "string") {
          return res.status(400).json({ message: "Phone is required" });
        }

        // Get user details
        const userProfile = await storage
          .getUserById(req.userId)
          .catch(() => null as any);
        const resolvedEmail = String(
          email || userProfile?.email || "support@nyambika.com"
        );
        const resolvedCname = String(
          cname || userProfile?.fullName || userProfile?.username || "Customer"
        );
        const resolvedCnumber = String(
          cnumber || userProfile?.phone || userProfile?.id || req.userId
        );

        // Ensure wallet exists
        const wallet = await ensureUserWallet(req.userId);

        const externalReference = `OPAY-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

        const [payment] = await db
          .insert(walletPayments)
          .values({
            walletId: wallet.id,
            userId: req.userId,
            type: "topup",
            amount: String(parsedAmount.toFixed(2)),
            method: "mobile_money",
            provider: "opay",
            phone,
            status: "pending",
            description: "OPAY wallet top-up",
            externalReference,
          })
          .returning();

        const isMock =
          String(process.env.OPAY_MOCK || "").toLowerCase() === "true";
        const esiciaBase = ESICIA_STATIC.BASE_URL;
        const esiciaRetailerId = retailerid || ESICIA_STATIC.RETAILER_ID;
        const esiciaBankId = bankid || ESICIA_STATIC.BANK_ID;
        const redirectUrl = ESICIA_STATIC.REDIRECT_URL;
        const callbackBase = ESICIA_STATIC.CALLBACK_BASE;
        const returl = new URL(
          "/api/payments/opay/callback",
          callbackBase
        ).toString();

        const hasAuth = Boolean(
          process.env.ESICIA_USERNAME && process.env.ESICIA_PASSWORD
        );
        const debug =
          String(process.env.PAY_DEBUG || "").toLowerCase() === "true";

        if (debug) {
          console.log("[Esicia] Config", {
            isMock,
            hasAuth,
            esiciaBase,
            esiciaRetailerId,
            esiciaBankId,
          });
        }

        if (isMock) {
          if (debug)
            console.log("[Esicia] Using MOCK mode: auto-completing payment");
          await db
            .update(walletPayments)
            .set({ status: "completed" })
            .where(eq(walletPayments.id, payment.id));

          const newBalance = String(
            (Number(wallet.balance) || 0) + parsedAmount
          );
          const [updatedWallet] = await db
            .update(userWallets)
            .set({ balance: newBalance, updatedAt: new Date() as any })
            .where(eq(userWallets.id, wallet.id))
            .returning();

          return res.status(201).json({
            payment: { ...payment, status: "completed" },
            wallet: updatedWallet,
            mode: "mock",
          });
        }

        if (!hasAuth) {
          return res
            .status(500)
            .json({ message: "Payment gateway credentials missing" });
        }

        // Normalize fields
        const msisdn = String(phone).replace(/[^0-9]/g, "");
        const safeDetails = String(details || "wallet_topup");
        const safeAmount = Math.max(1, Math.round(parsedAmount));
        const safeCnumber =
          String(resolvedCnumber).replace(/[^0-9]/g, "") || "000000000";

        const params = new URLSearchParams();
        params.set("action", "pay");
        params.set("msisdn", msisdn);
        params.set("details", safeDetails);
        params.set("refid", externalReference);
        params.set("amount", String(safeAmount));
        params.set("currency", String(currency || "RWF"));
        params.set("email", resolvedEmail);
        params.set("cname", resolvedCname);
        params.set("cnumber", safeCnumber);
        params.set("pmethod", pmethod);
        params.set("method", pmethod);
        if (esiciaRetailerId) params.set("retailerid", esiciaRetailerId);
        params.set("returl", returl);
        params.set("redirecturl", redirectUrl);
        params.set("bankid", String(esiciaBankId));
        if (process.env.OPAY_AUTH_KEY)
          params.set("authkey", String(process.env.OPAY_AUTH_KEY));

        const endpoint = esiciaBase;

        // Ensure msisdn follows local format 07xxxxxxxx for JSON body (per Esicia samples)
        const msisdnDigits = msisdn.replace(/\D/g, "");
        const msisdnLocal = msisdnDigits.startsWith("2507")
          ? "0" + msisdnDigits.slice(3)
          : msisdnDigits.startsWith("07")
          ? msisdnDigits
          : msisdnDigits.length === 9 && msisdnDigits.startsWith("7")
          ? "0" + msisdnDigits
          : msisdn;

        // Send payment request
        const timeoutMs = ESICIA_STATIC.TIMEOUT_MS;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
            "User-Agent": "NyambikaAI/1.0",
            Authorization:
              "Basic " +
              Buffer.from(
                `${ESICIA_STATIC.USERNAME}:${ESICIA_STATIC.PASSWORD}`
              ).toString("base64"),
          },
          body: JSON.stringify({
            action: "pay",
            msisdn: msisdnLocal,
            details: safeDetails,
            refid: externalReference,
            amount: safeAmount,
            currency: String(currency || "RWF"),
            email: resolvedEmail,
            cname: resolvedCname,
            cnumber: safeCnumber,
            pmethod,
            retailerid: esiciaRetailerId,
            returl,
            redirecturl: redirectUrl,
            bankid: String(esiciaBankId),
            authkey: ESICIA_STATIC.AUTH_KEY,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });

        const json = (await response.json()) as any;
        if (debug) console.log("[Esicia] Initiate response", json);

        const mapRetcode = (code: string) => {
          switch (code) {
            case "0":
              return "No error. Transaction being processed";
            case "01":
              return "Successful payment";
            case "02":
              return "Payment failed";
            case "03":
              return "Pending transaction";
            case "401":
              return "Missing authentication header";
            case "500":
              return "Non HTTPS request";
            case "600":
              return "Invalid username / password combination";
            case "601":
              return "Invalid remote user";
            case "602":
              return "Location / IP not whitelisted";
            case "603":
              return "Missing required parameters";
            case "604":
              return "Unknown retailer";
            case "605":
              return "Retailer not enabled";
            case "606":
              return "Error processing";
            case "607":
              return "Failed mobile money transaction";
            case "608":
              return "Used ref id (not unique)";
            case "609":
              return "Unknown payment method";
            case "610":
              return "Unknown or not enabled financial institution";
            case "611":
              return "Transaction not found";
            default:
              return "Unknown gateway status";
          }
        };

        const retcode = String(json?.retcode ?? "");
        const success = Number(json?.success) === 1;
        const url = typeof json?.url === "string" ? json.url.trim() : "";

        if (retcode !== "0") {
          // Hard failure per gateway retcode
          await db
            .update(walletPayments)
            .set({ status: "failed" })
            .where(eq(walletPayments.id, payment.id));
          return res.status(400).json({
            message: mapRetcode(retcode),
            gateway: json,
          });
        }

        if (success && url) {
          return res.status(200).json({
            ok: true,
            payment,
            redirectUrl: url,
          });
        }

        // retcode 0, success 1, but no checkout URL: treat as USSD push/STK flow
        // Keep wallet payment as pending and let client poll or wait for callback
        return res.status(200).json({
          ok: true,
          payment,
          mode: "push",
          message: "Payment request sent. Please approve on your phone.",
          refid: payment.externalReference,
          gateway: debug ? json : undefined,
        });
      } catch (error) {
        console.error("Error in POST /api/payments/opay/initiate:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // ✅ Payment callback route (separated)
  app.post("/api/payments/opay/callback", async (req: any, res) => {
    try {
      const { reference, refid, reply, status, statusid } = req.body || {};
      const ref = reference || refid;

      if (!ref)
        return res.status(400).json({ message: "Missing reference/refid" });

      const [payment] = await db
        .select()
        .from(walletPayments)
        .where(eq(walletPayments.externalReference, ref))
        .limit(1);

      if (!payment)
        return res.status(404).json({ message: "Payment not found" });
      if ((payment.status || "").toLowerCase() !== "pending") {
        return res.json({ ok: true, alreadyProcessed: true });
      }

      // Prefer statusid mapping; fallback to textual reply/status
      let finalStatus: "completed" | "failed" | "pending" = "pending";
      const sid = String(statusid || "");
      if (sid === "01") finalStatus = "completed";
      else if (sid === "02") finalStatus = "failed";
      else if (sid === "03") finalStatus = "pending";
      else {
        const norm = String(reply || status || "").toLowerCase();
        if (["ok", "success", "successful", "completed"].includes(norm))
          finalStatus = "completed";
        else if (["failed", "error", "cancelled"].includes(norm))
          finalStatus = "failed";
      }

      await db
        .update(walletPayments)
        .set({ status: finalStatus })
        .where(eq(walletPayments.id, payment.id));

      if (finalStatus === "completed") {
        const [wallet] = await db
          .select()
          .from(userWallets)
          .where(eq(userWallets.id, payment.walletId))
          .limit(1);

        if (wallet) {
          const newBalance = String(
            (Number(wallet.balance) || 0) + Number(payment.amount)
          );
          await db
            .update(userWallets)
            .set({ balance: newBalance, updatedAt: new Date() as any })
            .where(eq(userWallets.id, wallet.id));
        }
      }

      return res.json({ ok: true });
    } catch (error) {
      console.error("Error in POST /api/payments/opay/callback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const requireRole = (roles: string[]) => {
    const normalized = roles.map((r) => r.toLowerCase());
    return (req: any, res: any, next: any) => {
      const role = (req.userRole || "").toString().toLowerCase();
      // Defensive: if role is missing, treat as unauthenticated
      if (!role) {
        return res.status(401).json({ message: "Authentication required" });
      }
      // Admin bypass (superuser)
      if (role === "admin") {
        return next();
      }
      if (!normalized.includes(role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    };
  };

  // Admin verify producer
  app.post(
    "/api/admin/producers/:producerId/verify",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        await adminVerifyProducer(req as any, res as any);
      } catch (error) {
        console.error(
          "Error in /api/admin/producers/:producerId/verify:",
          error
        );
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin verify agent
  app.post(
    "/api/admin/agents/:agentId/verify",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        await adminVerifyAgent(req as any, res as any);
      } catch (error) {
        console.error("Error in /api/admin/agents/:agentId/verify:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin: get producer company details
  app.get(
    "/api/admin/producers/:producerId/company",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        await adminGetProducerCompany(req as any, res as any);
      } catch (error) {
        console.error(
          "Error in /api/admin/producers/:producerId/company:",
          error
        );
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Producer stats (producer/admin)
  app.get(
    "/api/producer/stats",
    requireAuth,
    requireRole(["producer", "admin"]),
    async (req: any, res) => {
      try {
        // getProducerStats expects req.user
        req.user = { id: req.userId, role: req.userRole } as any;
        await getProducerStats(req as any, res as any);
      } catch (error) {
        console.error("Error in /api/producer/stats:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // ===== Admin endpoints (protected) =====
  // Admin stats: aggregate platform-wide numbers
  app.get(
    "/api/admin/stats",
    requireAuth,
    requireRole(["admin"]),
    async (_req, res) => {
      try {
        const [
          [{ totalUsers } = { totalUsers: 0 }],
          [{ totalProducers } = { totalProducers: 0 }],
          [{ totalAgents } = { totalAgents: 0 }],
        ] = await Promise.all([
          db.select({ totalUsers: sql<number>`COUNT(*)` }).from(users),
          db
            .select({ totalProducers: sql<number>`COUNT(*)` })
            .from(users)
            .where(eq(users.role, "producer")),
          db
            .select({ totalAgents: sql<number>`COUNT(*)` })
            .from(users)
            .where(eq(users.role, "agent")),
        ]);

        const [
          [{ totalOrders } = { totalOrders: 0 }],
          [{ totalRevenue } = { totalRevenue: "0" }],
        ] = await Promise.all([
          db.select({ totalOrders: sql<number>`COUNT(*)` }).from(orders),
          db
            .select({
              totalRevenue: sql<string>`COALESCE(SUM(${orders.total}), '0')`,
            })
            .from(orders),
        ]);

        res.json({
          totalUsers,
          totalProducers,
          totalAgents,
          totalOrders,
          totalRevenue,
        });
      } catch (error) {
        console.error("Error in /api/admin/stats:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin producers: list all producers
  app.get(
    "/api/admin/producers",
    requireAuth,
    requireRole(["admin"]),
    async (_req, res) => {
      try {
        const list = await db
          .select()
          .from(users)
          .where(eq(users.role, "producer"))
          .orderBy(users.fullName);
        // strip passwords if present
        const sanitized = list.map((u: any) => {
          const { password, ...rest } = u as any;
          return rest;
        });
        res.json(sanitized);
      } catch (error) {
        console.error("Error in /api/admin/producers:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin agents: list all agents
  app.get(
    "/api/admin/agents",
    requireAuth,
    requireRole(["admin"]),
    async (_req, res) => {
      try {
        const list = await db
          .select()
          .from(users)
          .where(eq(users.role, "agent"))
          .orderBy(users.fullName);
        const sanitized = list.map((u: any) => {
          const { password, ...rest } = u as any;
          return rest;
        });
        res.json(sanitized);
      } catch (error) {
        console.error("Error in /api/admin/agents:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin customers: list all customers
  app.get(
    "/api/admin/customers",
    requireAuth,
    requireRole(["admin"]),
    async (_req, res) => {
      try {
        const list = await db
          .select()
          .from(users)
          .where(eq(users.role, "customer"))
          .orderBy(users.fullName);
        const sanitized = list.map((u: any) => {
          const { password, ...rest } = u as any;
          return rest;
        });
        res.json(sanitized);
      } catch (error) {
        console.error("Error in /api/admin/customers:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin admins: list all admin users
  app.get(
    "/api/admin/admins",
    requireAuth,
    requireRole(["admin"]),
    async (_req, res) => {
      try {
        const list = await db
          .select()
          .from(users)
          .where(eq(users.role, "admin"))
          .orderBy(users.fullName);
        const sanitized = list.map((u: any) => {
          const { password, ...rest } = u as any;
          return rest;
        });
        res.json(sanitized);
      } catch (error) {
        console.error("Error in /api/admin/admins:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin create user: create a user with specified role
  app.post(
    "/api/admin/users",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        const { email, password, name, role, phone } = req.body || {};

        if (!email || !password || !name || !role) {
          return res.status(400).json({
            message: "Missing required fields: email, password, name, role",
          });
        }

        const normalizedRole = String(role).toLowerCase();
        const allowedRoles = ["customer", "producer", "agent", "admin"];
        if (!allowedRoles.includes(normalizedRole)) {
          return res.status(400).json({ message: "Invalid role" });
        }

        // Check for existing user
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user record
        const userData = {
          username: email,
          email,
          password: hashedPassword,
          fullName: name,
          role: normalizedRole,
          phone: phone || null,
        } as any;

        const created = await storage.createUser(userData);

        // Return sanitized user
        const { password: _pw, ...safe } = created as any;
        res.status(201).json(safe);
      } catch (error) {
        console.error("Error in POST /api/admin/users:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin orders: list recent orders with minimal fields
  app.get(
    "/api/admin/orders",
    requireAuth,
    requireRole(["admin"]),
    async (_req, res) => {
      try {
        const recent = await db
          .select()
          .from(orders)
          .orderBy(desc(orders.createdAt))
          .limit(50);
        res.json(recent);
      } catch (error) {
        console.error("Error in /api/admin/orders:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Admin pending approvals: products awaiting approval
  app.get(
    "/api/admin/pending-approvals",
    requireAuth,
    requireRole(["admin"]),
    async (_req, res) => {
      try {
        const pending = await db
          .select({
            id: products.id,
            title: products.name,
            image: products.imageUrl,
            producerId: products.producerId,
            isApproved: products.isApproved,
            submittedDate: products.createdAt,
          })
          .from(products)
          .where(eq(products.isApproved, false))
          .orderBy(desc(products.createdAt))
          .limit(50);

        // Enrich with producer basic info
        const producerIds = Array.from(
          new Set(pending.map((p: any) => p.producerId).filter(Boolean))
        ) as string[];
        let producersMap: Record<string, any> = {};
        if (producerIds.length > 0) {
          const producersList = await db
            .select({
              id: users.id,
              fullName: users.fullName,
              username: users.username,
              email: users.email,
            })
            .from(users)
            .where(
              and(eq(users.role, "producer"), inArray(users.id, producerIds))
            );
          producersMap = producersList.reduce(
            (acc: Record<string, any>, u: any) => {
              acc[u.id] = u;
              return acc;
            },
            {} as Record<string, any>
          );
        }

        const result = pending.map((p: any) => ({
          id: p.id,
          title: p.title,
          image: p.image,
          type: "product",
          priority: "medium",
          producer:
            producersMap[p.producerId || ""]?.fullName ||
            producersMap[p.producerId || ""]?.username ||
            "Unknown",
          businessName: undefined,
          submittedDate: p.submittedDate,
        }));

        res.json(result);
      } catch (error) {
        console.error("Error in /api/admin/pending-approvals:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Subscription plans (public)
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      await getSubscriptionPlans(req as any, res as any);
    } catch (error) {
      console.error("Error in /api/subscription-plans:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Subscription plans: get by id (public)
  app.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const { getSubscriptionPlanById } = await import("./subscription-plans");
      await getSubscriptionPlanById(req as any, res as any);
    } catch (error) {
      console.error("Error in /api/subscription-plans/:id:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Subscription plans: create (admin)
  app.post(
    "/api/subscription-plans",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        const { createSubscriptionPlan } = await import("./subscription-plans");
        await createSubscriptionPlan(req as any, res as any);
      } catch (error) {
        console.error("Error creating subscription plan:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Subscription plans: update (admin)
  app.put(
    "/api/subscription-plans/:id",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        const { updateSubscriptionPlan } = await import("./subscription-plans");
        await updateSubscriptionPlan(req as any, res as any);
      } catch (error) {
        console.error("Error updating subscription plan:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Create/activate subscription for current user (producer or via agent assistance)
  app.post("/api/subscriptions", requireAuth, async (req: any, res) => {
    try {
      const {
        planId,
        billingCycle,
        paymentMethod,
        amount,
        paymentReference,
        producerId,
      } = req.body || {};
      if (!planId || !billingCycle || !paymentMethod || !amount) {
        return res.status(400).json({
          message:
            "Missing required fields: planId, billingCycle, paymentMethod, amount",
        });
      }

      // Normalize payload for createSubscription handler
      req.body = {
        userId: producerId || req.userId,
        planId,
        billingCycle, // 'monthly' | 'annual'
        status: "active",
        amount: String(amount),
        paymentMethod,
        paymentReference: paymentReference || null,
        ...(producerId
          ? { agentId: req.userRole === "agent" ? req.userId : undefined }
          : {}),
      };

      await createSubscription(req as any, res as any);
    } catch (error) {
      console.error("Error in /api/subscriptions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Renew an existing subscription (producer or agent-assisted)
  app.put(
    "/api/subscriptions/:id/renew",
    requireAuth,
    requireRole(["producer", "agent"]),
    async (req: any, res) => {
      try {
        // If an agent is performing the renewal, attach agentId when not provided
        if (req.userRole === "agent" && !req.body?.agentId) {
          req.body = { ...(req.body || {}), agentId: req.userId };
        }
        await renewSubscription(req as any, res as any);
      } catch (error) {
        console.error("Error in /api/subscriptions/:id/renew:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Generic subscription update (e.g., cancel) — used when changing plans
  app.put(
    "/api/subscriptions/:id",
    requireAuth,
    requireRole(["producer", "agent", "admin"]),
    async (req, res) => {
      try {
        await updateSubscriptionStatus(req as any, res as any);
      } catch (error) {
        console.error("Error in PUT /api/subscriptions/:id:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Producer subscription status (requires auth)
  app.get(
    "/api/producer/subscription-status",
    requireAuth,
    async (req: any, res) => {
      try {
        // getProducerSubscriptionStatus expects req.user
        req.user = { id: req.userId, role: req.userRole } as any;
        await getProducerSubscriptionStatus(req as any, res as any);
      } catch (error) {
        console.error("Error in /api/producer/subscription-status:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, role, phone } = req.body;

      // Validate input
      if (!email || !password || !name || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!["customer", "producer", "agent"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userData = {
        username: email, // Use email as username for now
        email,
        password: hashedPassword,
        fullName: name,
        role,
        phone: phone || null,
      };

      const user = await storage.createUser(userData);

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
        expiresIn: "7d",
      });

      // Return user without password and map fullName to name
      const { password: _, fullName, ...userWithoutPassword } = user;
      // Attempt to fetch company for producers to enrich businessName
      let businessName: string | null = null;
      try {
        if ((user.role || "").toLowerCase() === "producer") {
          const company = await storage.getCompanyByProducerId(user.id);
          businessName = company?.name || null;
        }
      } catch (e) {
        // non-fatal; keep businessName null on error
      }
      const mappedUser = {
        ...userWithoutPassword,
        name: fullName || user.email.split("@")[0],
        businessName,
        business_name: businessName,
      };

      res.status(201).json({
        user: mappedUser,
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt:", { body: req.body });

      const { email, password } = req.body;

      if (!email || !password) {
        console.log("Missing email or password");
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Find user by email
      console.log("Looking for user with email:", email);
      const user = await storage.getUserByEmail(email);
      console.log("User found:", user ? "Yes" : "No");

      if (!user) {
        console.log("User not found");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user has password field
      if (!user.password) {
        console.error("User found but no password field:", user);
        return res
          .status(500)
          .json({ message: "User account configuration error" });
      }

      // Check password
      console.log("Comparing passwords...");
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log("Password valid:", isValidPassword);

      if (!isValidPassword) {
        console.log("Invalid password");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Warn if JWT_SECRET is not configured; continue with fallback to avoid hard 500s in dev
      if (!process.env.JWT_SECRET) {
        console.warn(
          "JWT_SECRET not set; using fallback-secret. Configure JWT_SECRET in backend/.env for production."
        );
      }

      // Generate JWT token
      console.log("Generating JWT token...");
      const token = jwt.sign(
        { userId: user.id, role: user.role || "customer" },
        jwtSecret,
        { expiresIn: "7d" }
      );

      // Return user without password and map fullName to name
      const { password: _, fullName, ...userWithoutPassword } = user;
      // Attempt to fetch company for producers to enrich businessName
      let businessName: string | null = null;
      let businessId: string | null = null;
      try {
        if ((user.role || "").toLowerCase() === "producer") {
          const company = await storage.getCompanyByProducerId(user.id);
          businessName = company?.name || null;
          businessId = company?.id || null;
        }
      } catch (e) {
        // non-fatal; keep businessName null on error
      }
      const mappedUser = {
        ...userWithoutPassword,
        name:
          fullName ||
          user.fullName ||
          user.username ||
          user.email.split("@")[0],
        businessName,
        business_name: businessName,
        business_id: businessId,
      };

      console.log("Login successful for user:", mappedUser.id);

      res.json({
        user: mappedUser,
        token,
      });
    } catch (error) {
      const err = error as Error;
      console.error("Login error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      res.status(500).json({
        message: "Internal server error",
        ...(process.env.NODE_ENV === "development" && { error: err.message }),
      });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, fullName, ...userWithoutPassword } = user;
      // Attempt to fetch company for producers to enrich businessName
      let businessName: string | null = null;
      let businessId: string | null = null;
      try {
        if ((user.role || "").toLowerCase() === "producer") {
          const company = await storage.getCompanyByProducerId(user.id);
          businessName = company?.name || null;
          businessId = company?.id || null;
        }
      } catch (e) {
        // non-fatal; keep businessName null on error
      }
      const mappedUser = {
        ...userWithoutPassword,
        name: fullName || user.email.split("@")[0],
        businessName,
        business_name: businessName,
        business_id: businessId,
      };
      res.json(mappedUser);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Change password (supports both PUT and POST for flexibility)
  const changePasswordHandler = async (req: any, res: any) => {
    try {
      const { currentPassword, newPassword } = req.body || {};

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "currentPassword and newPassword are required" });
      }

      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "New password must be at least 6 characters" });
      }

      const user = await storage.getUserById(req.userId);
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      const isSame = await bcrypt.compare(newPassword, user.password);
      if (isSame) {
        return res.status(400).json({
          message: "New password must be different from current password",
        });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashed } as any);

      return res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      console.error("Error in change-password:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  app.put("/api/auth/change-password", requireAuth, changePasswordHandler);
  app.post("/api/auth/change-password", requireAuth, changePasswordHandler);

  // Google OAuth 2.0
  app.get("/api/auth/oauth/google", async (req, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        `${req.protocol}://${req.get("host")}/api/auth/oauth/google/callback`;
      const state = req.query.state?.toString() || "";
      if (!clientId) {
        return res.status(500).json({
          message: "Google OAuth not configured: missing GOOGLE_CLIENT_ID",
        });
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        include_granted_scopes: "true",
      });
      if (state) params.set("state", state);

      const authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      res.redirect(authorizeUrl);
    } catch (error) {
      console.error("Google OAuth init error:", error);
      res.status(500).json({ message: "Failed to initiate Google OAuth" });
    }
  });

  app.get("/api/auth/oauth/google/callback", async (req, res) => {
    try {
      const code = req.query.code as string | undefined;
      if (!code) {
        return res.status(400).send("Missing authorization code");
      }

      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        `${req.protocol}://${req.get("host")}/api/auth/oauth/google/callback`;
      if (!clientId || !clientSecret) {
        return res.status(500).send("Google OAuth not configured");
      }

      // Exchange code for tokens
      const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      } as any);

      if (!tokenResp.ok) {
        const txt = await tokenResp.text();
        console.error("Google token exchange failed:", txt);
        return res.status(502).send("Failed to exchange code");
      }
      const tokenJson: any = await tokenResp.json();
      const accessToken = tokenJson.access_token as string;

      // Fetch user info
      const userInfoResp = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        } as any
      );
      if (!userInfoResp.ok) {
        const txt = await userInfoResp.text();
        console.error("Failed to fetch Google user info:", txt);
        return res.status(502).send("Failed to fetch user info");
      }
      const profile: any = await userInfoResp.json();

      const email: string = profile.email;
      const name: string =
        profile.name || (email ? email.split("@")[0] : "Google User");

      // Try to get existing user by email
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // Do NOT auto-create a default customer. Force role selection on frontend.
        const pendingToken = jwt.sign(
          {
            kind: "oauth_pending",
            provider: "google",
            email,
            name,
          },
          jwtSecret,
          { expiresIn: "15m" }
        );

        const frontendBase =
          process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
        const registerUrl = `${frontendBase}/register?oauth=google&email=${encodeURIComponent(
          email
        )}&name=${encodeURIComponent(name)}&oauthToken=${encodeURIComponent(
          pendingToken
        )}`;

        const html = `<!doctype html>
<html><head><meta charset="utf-8"><script>
  window.location.replace(${JSON.stringify(registerUrl)});
  </script></head><body></body></html>`;

        res.setHeader("Content-Type", "text/html");
        return res.send(html);
      }

      // Get user's display name (fallback to email username if not set)
      const displayName = user.fullName || user.email.split("@")[0];

      // Generate JWT with user data
      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role || "customer",
          email: user.email,
          name: displayName,
        },
        jwtSecret,
        { expiresIn: "7d" }
      );

      // Set HTTP-only cookie for session management
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
        domain:
          process.env.NODE_ENV === "production" ? ".nyambikaai.com" : undefined,
      });

      // Prepare user data to be passed to the frontend (only include necessary fields)
      const frontendUserData = {
        id: user.id,
        email: user.email,
        fullName: displayName,
        role: user.role || "customer",
        isVerified: user.isVerified || false,
      };

      // Redirect to frontend with token in hash for client-side auth
      const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";
      const redirectUrl = new URL(`${frontendBase}/auth/oauth-complete`);

      // Add token to URL hash
      redirectUrl.hash = `#token=${encodeURIComponent(token)}`;

      // Add user data as URL parameters
      redirectUrl.searchParams.set(
        "user",
        encodeURIComponent(JSON.stringify(frontendUserData))
      );

      // Return HTML that will handle the redirect
      const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
      // Store user data in session storage before redirecting
      const userData = ${JSON.stringify(frontendUserData)};
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect to the frontend
      window.location.href = ${JSON.stringify(redirectUrl.toString())};
    </script>
  </head>
  <body>
    <p>Redirecting to NyambikaAI...</p>
    <script>
      // Fallback in case the redirect doesn't work
      setTimeout(function() {
        window.location.href = ${JSON.stringify(redirectUrl.toString())};
      }, 1000);
    </script>
  </body>
</html>`;

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Finalize OAuth registration by choosing a role
  app.post("/api/auth/register-oauth", async (req, res) => {
    try {
      const { oauthToken, role, phone } = req.body || {};
      if (!oauthToken || !role) {
        return res
          .status(400)
          .json({ message: "oauthToken and role are required" });
      }

      const allowedRoles = ["customer", "producer", "agent"];
      if (!allowedRoles.includes(String(role))) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Verify pending token
      let payload: any;
      try {
        payload = jwt.verify(String(oauthToken), jwtSecret);
      } catch (e) {
        return res
          .status(401)
          .json({ message: "Invalid or expired OAuth session" });
      }

      if (!payload || payload.kind !== "oauth_pending" || !payload.email) {
        return res.status(400).json({ message: "Invalid OAuth payload" });
      }

      const email = String(payload.email).toLowerCase();
      const name = String(payload.name || "");

      // If already exists (e.g., race condition), log them in instead
      let existing = await storage.getUserByEmail(email);
      if (existing) {
        const token = jwt.sign(
          { userId: existing.id, role: existing.role || "customer" },
          jwtSecret,
          { expiresIn: "7d" }
        );
        const { password: _pw, fullName, ...userWithoutPassword } = existing;
        const mappedUser = {
          ...userWithoutPassword,
          name: fullName || existing.email.split("@")[0],
        } as any;
        return res.json({ user: mappedUser, token });
      }

      // Create user with generated password; role chosen explicitly
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashed = await bcrypt.hash(randomPassword, 10);
      const created = await storage.createUser({
        id: randomUUID(),
        username: email,
        email,
        password: hashed,
        role,
        fullName: payload.name || email.split("@")[0],
        phone: phone || null,
      });

      // Return sanitized user
      const { password: _pw, ...safe } = created as any;
      const mappedUser = {
        ...safe,
        id: safe.id.toString(),
        role: safe.role as UserRole,
        name: safe.fullName || safe.email.split("@")[0],
      };

      // Generate JWT token
      const token = jwt.sign(
        { userId: mappedUser.id, role: mappedUser.role },
        jwtSecret,
        { expiresIn: "7d" }
      );

      // Set HTTP-only cookie for automatic login
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      // For OAuth flow, redirect with token in URL hash
      const redirectUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/auth/oauth-complete#token=${encodeURIComponent(token)}`;

      // Set a cookie for server-side auth if needed
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      // Redirect to frontend with token in hash
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error("register-oauth error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Facebook OAuth 2.0
  app.get("/api/auth/oauth/facebook", async (req, res) => {
    try {
      const clientId = process.env.FACEBOOK_APP_ID;
      const redirectUri =
        process.env.FACEBOOK_REDIRECT_URI ||
        `${req.protocol}://${req.get("host")}/api/auth/oauth/facebook/callback`;
      const state = req.query.state?.toString() || "";
      if (!clientId) {
        return res.status(500).json({
          message: "Facebook OAuth not configured: missing FACEBOOK_APP_ID",
        });
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "email,public_profile",
      });
      if (state) params.set("state", state);

      const authorizeUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
      res.redirect(authorizeUrl);
    } catch (error) {
      console.error("Facebook OAuth init error:", error);
      res.status(500).json({ message: "Failed to initiate Facebook OAuth" });
    }
  });

  app.get("/api/auth/oauth/facebook/callback", async (req, res) => {
    try {
      const code = req.query.code as string | undefined;
      if (!code) {
        return res.status(400).send("Missing authorization code");
      }

      const clientId = process.env.FACEBOOK_APP_ID!;
      const clientSecret = process.env.FACEBOOK_APP_SECRET!;
      const redirectUri =
        process.env.FACEBOOK_REDIRECT_URI ||
        `${req.protocol}://${req.get("host")}/api/auth/oauth/facebook/callback`;
      if (!clientId || !clientSecret) {
        return res.status(500).send("Facebook OAuth not configured");
      }

      // Exchange code for access token
      const tokenResp = await fetch(
        "https://graph.facebook.com/v18.0/oauth/access_token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
          }),
        } as any
      );

      if (!tokenResp.ok) {
        const txt = await tokenResp.text();
        console.error("Facebook token exchange failed:", txt);
        return res.status(502).send("Failed to exchange code");
      }
      const tokenJson: any = await tokenResp.json();
      const accessToken = tokenJson.access_token as string;

      // Fetch user info
      const userInfoResp = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`,
        {
          headers: { "Content-Type": "application/json" },
        } as any
      );
      if (!userInfoResp.ok) {
        const txt = await userInfoResp.text();
        console.error("Failed to fetch Facebook user info:", txt);
        return res.status(502).send("Failed to fetch user info");
      }
      const profile: any = await userInfoResp.json();

      const email: string = profile.email;
      const name: string =
        profile.name || (email ? email.split("@")[0] : "Facebook User");

      if (!email) {
        return res.status(400).send("Email permission required");
      }

      // Upsert user
      let user = await storage.getUserByEmail(email);
      if (!user) {
        const randomPassword = crypto.randomBytes(16).toString("hex");
        const hashed = await bcrypt.hash(randomPassword, 10);
        user = await storage.createUser({
          username: email,
          email,
          password: hashed,
          fullName: name,
          role: "customer",
        } as any);
      }

      // Issue JWT
      const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, {
        expiresIn: "7d",
      });

      // Determine frontend base URL - if FRONTEND_URL is set, use it; otherwise use current request origin
      const frontendBase =
        process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;

      // Return HTML that sets localStorage and redirects
      const html = `<!doctype html>
<html><head><meta charset="utf-8"><script>
try {
  localStorage.setItem('auth_token', ${JSON.stringify(token)});
  window.location.replace(${JSON.stringify(frontendBase)});
} catch (e) {
  document.write('Login successful. Please return to the app.');
}
</script></head><body></body></html>`;
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      console.error("Facebook OAuth callback error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Update product (admin or owning producer)
  app.put("/api/products/:id", requireAuth, async (req: any, res) => {
    try {
      const existing = await storage.getProduct(req.params.id);
      if (!existing)
        return res.status(404).json({ message: "Product not found" });

      // Authorization: admin can update any, producer only their own
      const isAdmin = req.userRole === "admin";
      const isOwner =
        req.userRole === "producer" && existing.producerId === req.userId;
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Validate updates
      const parsed = insertProductSchema.partial().parse(req.body);

      // Sanitize producer-only updates: cannot change producerId or isApproved
      const updates: any = { ...parsed };
      if (!isAdmin) {
        delete updates.producerId;
        delete updates.isApproved;
      }

      const product = await storage.updateProduct(req.params.id, updates);
      if (!product)
        return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete product (admin or owning producer)
  app.delete("/api/products/:id", requireAuth, async (req: any, res) => {
    try {
      const existing = await storage.getProduct(req.params.id);
      if (!existing)
        return res.status(404).json({ message: "Product not found" });

      const isAdmin = req.userRole === "admin";
      const isOwner =
        req.userRole === "producer" && existing.producerId === req.userId;
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/auth/profile", requireAuth, async (req: any, res) => {
    try {
      const {
        fullName,
        fullNameRw,
        phone,
        location,
        businessName,
        profileImage,
        email,
      } = req.body || {};

      // Build updates
      const updateData: any = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (fullNameRw !== undefined) updateData.fullNameRw = fullNameRw;
      if (phone !== undefined) updateData.phone = phone;
      if (location !== undefined) updateData.location = location;
      if (businessName !== undefined) updateData.businessName = businessName;
      if (profileImage !== undefined) updateData.profileImage = profileImage;

      // Email change (optional) with basic validation and uniqueness check
      if (email !== undefined) {
        const trimmed = String(email).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          return res.status(400).json({ message: "Invalid email format" });
        }
        const existing = await storage.getUserByEmail(trimmed);
        if (existing && existing.id !== req.userId) {
          return res.status(400).json({ message: "Email already in use" });
        }
        updateData.email = trimmed;
        // Keep username aligned with email for this app
        updateData.username = trimmed;
      }

      const user = await storage.updateUser(req.userId, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password and map fullName to name
      const {
        password: _,
        fullName: userFullName,
        ...userWithoutPassword
      } = user;
      const mappedUser = {
        ...userWithoutPassword,
        name: userFullName || user.email.split("@")[0],
      };

      res.json(mappedUser);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Change password
  app.post("/api/auth/change-password", requireAuth, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "currentPassword and newPassword are required" });
      }

      // Basic password policy
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return res
          .status(400)
          .json({ message: "New password must be at least 8 characters long" });
      }

      const user = await storage.getUserById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.password) {
        return res
          .status(400)
          .json({ message: "Password change not available for this account" });
      }

      const matches = await bcrypt.compare(currentPassword, user.password);
      if (!matches) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          message: "New password must be different from current password",
        });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      const updated = await storage.updateUser(req.userId, {
        password: hashed,
      } as any);
      if (!updated) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      return res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Demo users seeding route (for development)
  app.post("/api/seed-demo-users", async (_req, res) => {
    try {
      const demoUsers = [
        {
          username: "customer@demo.com",
          email: "customer@demo.com",
          password: await bcrypt.hash("password", 10),
          fullName: "Demo Customer",
          role: "customer",
          phone: "+250781234567",
        },
        {
          username: "producer@demo.com",
          email: "producer@demo.com",
          password: await bcrypt.hash("password", 10),
          fullName: "Demo Producer",
          role: "producer",
          phone: "+250781234568",
          businessName: "Fashion House Rwanda",
        },
        {
          username: "admin@demo.com",
          email: "admin@demo.com",
          password: await bcrypt.hash("password", 10),
          fullName: "Demo Admin",
          role: "admin",
          phone: "+250781234569",
        },
      ];

      const createdUsers = [];
      for (const userData of demoUsers) {
        try {
          const existingUser = await storage.getUserByEmail(userData.email);
          if (!existingUser) {
            const user = await storage.createUser(userData);
            const { password: _, ...userWithoutPassword } = user;
            createdUsers.push(userWithoutPassword);
          }
        } catch (error) {
          console.log(`User ${userData.email} might already exist`);
        }
      }

      res.json({
        message: "Demo users seeded successfully",
        users: createdUsers,
      });
    } catch (error) {
      console.error("Error seeding demo users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(
    "/api/categories",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        const validatedData = insertCategorySchema.parse(req.body);
        const category = await storage.createCategory(validatedData);
        res.status(201).json(category);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation error", errors: error.errors });
        }
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.put(
    "/api/categories/:id",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        const validatedData = insertCategorySchema.partial().parse(req.body);
        const category = await storage.updateCategory(
          req.params.id,
          validatedData
        );
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
        res.json(category);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation error", errors: error.errors });
        }
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.delete(
    "/api/categories/:id",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        await storage.deleteCategory(req.params.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Products routes
  app.post(
    "/api/products",
    requireAuth,
    requireRole(["producer", "admin"]),
    async (req: any, res) => {
      try {
        const {
          name,
          nameRw,
          description,
          price,
          categoryId,
          imageUrl,
          sizes,
          colors,
          stockQuantity,
          additionalImages,
        } = req.body;

        if (
          !name ||
          !nameRw ||
          !description ||
          !price ||
          !categoryId ||
          !imageUrl
        ) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        const productData = {
          name,
          nameRw,
          description,
          price: price.toString(),
          categoryId,
          producerId: req.userId,
          imageUrl,
          additionalImages: additionalImages || [],
          sizes: sizes || [],
          colors: colors || [],
          stockQuantity: stockQuantity || 0,
          inStock: (stockQuantity || 0) > 0,
          isApproved: req.userRole === "admin", // Auto-approve for admins
        };

        const product = await storage.createProduct(productData);
        res.status(201).json(product);
      } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, search, limit, offset, producerId } = req.query;
      const options = {
        categoryId: categoryId as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        producerId: producerId as string,
      };

      const products = await storage.getProducts(options);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Producers routes
  app.get("/api/producers", async (req, res) => {
    try {
      const { limit } = req.query as any;
      const producers = await storage.getProducers(
        limit ? parseInt(limit as string) : undefined
      );
      // Merge company metadata (name, logoUrl) for each producer
      const withCompany = await Promise.all(
        producers.map(async (u: any) => {
          const { password, ...rest } = u;
          try {
            const company = await storage.getCompanyByProducerId(u.id);
            return {
              ...rest,
              companyName: company?.name || null,
              companyLogoUrl: company?.logoUrl || null,
            };
          } catch {
            return { ...rest, companyName: null, companyLogoUrl: null };
          }
        })
      );
      res.json(withCompany);
    } catch (error) {
      console.error("Error fetching producers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/producers/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user || user.role !== "producer")
        return res.status(404).json({ message: "Producer not found" });
      const { password, ...safe } = user as any;
      res.json(safe);
    } catch (error) {
      console.error("Error fetching producer:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/producers/:id/products", async (req, res) => {
    try {
      const products = await storage.getProducts({ producerId: req.params.id });
      res.json(products);
    } catch (error) {
      console.error("Error fetching producer products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Companies routes (Producer business details)
  app.get(
    "/api/companies/me",
    requireAuth,
    requireRole(["producer"]),
    async (req: any, res) => {
      try {
        const company = await storage.getCompanyByProducerId(req.userId);
        if (!company) {
          return res.status(404).json({ message: "Company not found" });
        }
        res.json(company);
      } catch (error) {
        console.error("Error fetching company:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.post(
    "/api/companies",
    requireAuth,
    requireRole(["producer"]),
    async (req: any, res) => {
      try {
        // Prevent creating multiple companies per producer
        const existing = await storage.getCompanyByProducerId(req.userId);
        if (existing) {
          return res
            .status(409)
            .json({ message: "Company already exists. Use update instead." });
        }

        const companyBodySchema = z.object({
          tin: z.string().optional().nullable(),
          name: z.string().min(1),
          email: z.string().email(),
          phone: z.string().min(3),
          location: z.string().min(1),
          logoUrl: z.string().url().optional().nullable(),
          websiteUrl: z.string().url().optional().nullable(),
        });

        const body = companyBodySchema.parse(req.body);
        const company = await storage.createCompany({
          producerId: req.userId,
          ...body,
        } as any);
        res.status(201).json(company);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation error", errors: error.errors });
        }
        console.error("Error creating company:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.put(
    "/api/companies",
    requireAuth,
    requireRole(["producer"]),
    async (req: any, res) => {
      try {
        const companyBodyUpdateSchema = z.object({
          tin: z.string().optional().nullable(),
          name: z.string().min(1).optional(),
          email: z.string().email().optional(),
          phone: z.string().min(3).optional(),
          location: z.string().min(1).optional(),
          logoUrl: z.string().url().optional().nullable(),
          websiteUrl: z.string().url().optional().nullable(),
        });

        const updates = companyBodyUpdateSchema.parse(req.body);
        const updated = await storage.updateCompany(req.userId, updates as any);
        if (!updated) {
          return res.status(404).json({ message: "Company not found" });
        }
        res.json(updated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Validation error", errors: error.errors });
        }
        console.error("Error updating company:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get company by ID for store page (must be before generic /api/companies route)
  app.get("/api/companies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const company = await storage.getCompanyById(id);

      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Get products by company ID for store page
  app.get("/api/companies/:id/products", async (req, res) => {
    try {
      const { id } = req.params;

      // First verify company exists
      const company = await storage.getCompanyById(id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Enforce active subscription for the producer that owns this company
      try {
        const rows = await db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.userId, company.producerId),
              eq(subscriptions.status, "active")
            )
          )
          .limit(1);
        const sub = rows[0];
        const now = new Date();
        const hasActive = sub && new Date(sub.endDate) > now;
        if (!hasActive) {
          return res.status(403).json({
            message:
              "Producer subscription inactive. Store temporarily unavailable.",
          });
        }
      } catch (e) {
        console.error("Subscription check failed:", e);
        return res
          .status(500)
          .json({ message: "Failed to verify subscription for this store" });
      }

      // Get products with category information for this company
      const companyProducts = await storage.getProductsByCompanyId(id);

      res.json(companyProducts);
    } catch (error) {
      console.error("Error fetching company products:", error);
      res.status(500).json({ message: "Failed to fetch company products" });
    }
  });

  // List companies (public)
  app.get("/api/companies", async (req, res) => {
    try {
      const { producerId } = req.query as any;
      if (producerId) {
        const company = await storage.getCompanyByProducerId(
          String(producerId)
        );
        return res.json(company ? [company] : []);
      }
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Cart routes
  app.get("/api/cart", requireAuth, async (req: any, res) => {
    try {
      const cartItems = await storage.getCartItems(req.userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/cart", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.userId,
      });
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/cart/:id", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertCartItemSchema.partial().parse(req.body);
      const cartItem = await storage.updateCartItem(
        req.params.id,
        validatedData
      );
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/cart/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/cart", requireAuth, async (req: any, res) => {
    try {
      await storage.clearCart(req.userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment routes (Stripe)
  app.post("/api/create-payment-intent", requireAuth, async (req: any, res) => {
    try {
      const { amount, currency = "rwf" } = req.body;

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        payment_method_types: ["card"],
        metadata: {
          userId: req.userId,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({
        message: "Error creating payment intent",
        error: error.message,
      });
    }
  });

  // Orders routes (migrated to dedicated handlers in ./orders)
  // Legacy inline route removed to avoid conflicting validation/handlers.

  // Producer orders (producer/admin)
  app.get(
    "/api/producer/orders",
    requireAuth,
    requireRole(["producer", "admin"]),
    async (req: any, res) => {
      try {
        await getProducerOrders(req as any, res as any);
      } catch (error) {
        console.error("Error in /api/producer/orders:", error);
        res.status(500).json({ message: "Failed to fetch producer orders" });
      }
    }
  );

  // Legacy inline GET /api/orders/:id removed; use getOrderById from ./orders below.

  // Legacy inline POST /api/orders removed; use createOrder from ./orders below.

  app.put(
    "/api/orders/:id/status",
    requireAuth,
    requireRole(["producer", "admin"]),
    async (req, res) => {
      try {
        const { status } = req.body;
        if (!status) {
          return res.status(400).json({ message: "Status is required" });
        }

        const order = await storage.updateOrderStatus(req.params.id, status);
        if (!order) {
          return res.status(404).json({ message: "Order not found" });
        }
        res.json(order);
      } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Failed to update order status" });
      }
    }
  );

  // Favorites routes
  app.get("/api/favorites", requireAuth, async (req: any, res) => {
    try {
      const favorites = await storage.getFavorites(req.userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/favorites", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertFavoriteSchema.parse({
        ...req.body,
        userId: req.userId,
      });
      const favorite = await storage.addToFavorites(validatedData);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error adding to favorites:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(
    "/api/favorites/:productId",
    requireAuth,
    async (req: any, res) => {
      try {
        await storage.removeFromFavorites(req.userId, req.params.productId);
        res.status(204).send();
      } catch (error) {
        console.error("Error removing from favorites:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  app.get(
    "/api/favorites/:productId/check",
    requireAuth,
    async (req: any, res) => {
      try {
        const isFavorite = await storage.isFavorite(
          req.userId,
          req.params.productId
        );
        res.json({ isFavorite });
      } catch (error) {
        console.error("Error checking favorite status:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Try-on sessions routes
  app.get("/api/try-on-sessions", requireAuth, async (req: any, res) => {
    try {
      // Set a timeout for the database query
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Database query timeout")), 8000);
      });

      const sessionsPromise = storage.getTryOnSessions(req.userId);

      const sessions = await Promise.race([sessionsPromise, timeoutPromise]);
      res.json(sessions || []);
    } catch (error) {
      console.error("Error fetching try-on sessions:", error);
      // Return empty array instead of error to prevent frontend crashes
      res.json([]);
    }
  });

  app.get("/api/try-on-sessions/:id", requireAuth, async (req, res) => {
    try {
      const session = await storage.getTryOnSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Try-on session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching try-on session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/try-on-sessions", requireAuth, async (req: any, res) => {
    try {
      // If productId provided but doesn't exist, drop it to avoid FK violation
      let body = { ...req.body } as any;
      if (body.productId) {
        const product = await storage.getProduct(body.productId);
        if (!product) {
          delete body.productId;
        }
      }

      const validatedData = insertTryOnSessionSchema.parse({
        ...body,
        userId: req.userId,
      });
      const session = await storage.createTryOnSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating try-on session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/try-on-sessions/:id", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertTryOnSessionSchema.partial().parse(req.body);
      const session = await storage.updateTryOnSession(
        req.params.id,
        validatedData
      );
      if (!session) {
        return res.status(404).json({ message: "Try-on session not found" });
      }
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating try-on session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI Try-on processing endpoint
  app.post(
    "/api/try-on-sessions/:id/process",
    requireAuth,
    async (req: any, res) => {
      try {
        const session = await storage.getTryOnSession(req.params.id);
        if (!session) {
          return res.status(404).json({ message: "Try-on session not found" });
        }

        const product = await storage.getProduct(session.productId!);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        // Update status to processing
        await storage.updateTryOnSession(req.params.id, {
          status: "processing",
        });

        // Get customer measurements if available
        const user = await storage.getUser(session.userId!);
        const measurements = user?.measurements
          ? JSON.parse(user.measurements)
          : undefined;

        // Process with AI (allow overriding product image via request body)
        const overrideImageUrl = req.body?.productImageUrl as
          | string
          | undefined;
        const productImageToUse =
          overrideImageUrl &&
          typeof overrideImageUrl === "string" &&
          overrideImageUrl.length > 0
            ? overrideImageUrl
            : product.imageUrl;

        const result = await generateVirtualTryOn(
          session.customerImageUrl,
          productImageToUse,
          product.name,
          measurements,
          { engine: (req.body?.engine as any) || undefined }
        );

        if (result.success) {
          await storage.updateTryOnSession(req.params.id, {
            status: "completed",
            tryOnImageUrl: result.tryOnImageUrl,
            fitRecommendation: JSON.stringify(result.recommendations),
          });
          res.json({
            message: "Try-on completed successfully",
            tryOnImageUrl: result.tryOnImageUrl,
            recommendations: result.recommendations,
          });
        } else {
          await storage.updateTryOnSession(req.params.id, { status: "failed" });
          res
            .status(500)
            .json({ message: result.error || "Try-on processing failed" });
        }
      } catch (error) {
        console.error("Error processing try-on session:", error);
        await storage.updateTryOnSession(req.params.id, { status: "failed" });
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // AI Fashion analysis endpoint
  app.post("/api/ai/analyze-fashion", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ message: "Image data is required" });
      }

      const analysis = await analyzeFashionImage(imageBase64);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing fashion image:", error);
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  // AI Size recommendation endpoint
  app.post(
    "/api/ai/size-recommendation",
    requireAuth,
    async (req: any, res) => {
      try {
        const { measurements, productType, productSizes } = req.body;
        if (!measurements || !productType || !productSizes) {
          return res.status(400).json({
            message:
              "Measurements, product type, and available sizes are required",
          });
        }

        const recommendation = await generateSizeRecommendation(
          measurements,
          productType,
          productSizes
        );
        res.json(recommendation);
      } catch (error) {
        console.error("Error generating size recommendation:", error);
        res
          .status(500)
          .json({ message: "Failed to generate size recommendation" });
      }
    }
  );

  // Search endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const { q, category, limit } = req.query;

      if (!q) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const options = {
        search: q as string,
        categoryId: category as string,
        limit: limit ? parseInt(limit as string) : 20,
      };

      const products = await storage.getProducts(options);
      res.json({ query: q, results: products });
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Order routes
  // Producer-specific orders (only producer/admin)
  app.get(
    "/api/producer/orders",
    requireAuth,
    requireRole(["producer", "admin"]),
    getProducerOrders
  );
  app.get(
    "/api/orders/producer/:producerId",
    requireAuth,
    requireRole(["producer", "admin"]),
    getOrdersByProducerId
  );
  app.get("/api/orders", requireAuth, getUserOrders);
  app.get("/api/orders/:id", requireAuth, getOrderById);
  app.post("/api/orders", requireAuth, createOrder);
  app.put("/api/orders/:id", requireAuth, updateOrder);
  app.delete("/api/orders/:id", requireAuth, cancelOrder);

  // Agent Routes
  app.get(
    "/api/agent/stats",
    requireAuth,
    requireRole(["agent"]),
    getAgentStats
  );
  app.get(
    "/api/agent/producers",
    requireAuth,
    requireRole(["agent"]),
    getAgentProducers
  );
  app.get(
    "/api/agent/available-producers",
    requireAuth,
    requireRole(["agent"]),
    getAvailableProducers
  );
  app.post(
    "/api/agent/assign-producer",
    requireAuth,
    requireRole(["agent"]),
    assignAgentToProducer
  );
  app.get(
    "/api/agent/producer/:producerId",
    requireAuth,
    requireRole(["agent"]),
    getProducerDetails
  );
  app.get(
    "/api/agent/commissions",
    requireAuth,
    requireRole(["agent"]),
    getAgentCommissions
  );
  app.post(
    "/api/agent/process-payment",
    requireAuth,
    requireRole(["agent"]),
    processSubscriptionPayment
  );

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Nyambika AI Fashion Platform API",
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
