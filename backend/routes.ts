import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { storage } from "./storage";
import {
  analyzeFashionImage,
  generateSizeRecommendation,
  suggestProductTitles,
} from "./openai";
import { generateVirtualTryOn } from "./tryon";
import { processImage } from "./utils/imageProcessor";
import crypto, { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { sendSuccess, sendError } from "./utils/response";
import { sendPasswordResetEmail } from "./utils/email";
import { getSubscriptionPlans } from "./subscription-plans";
import { db, ensureSchemaMigrations } from "./db";

type UserRole = "customer" | "producer" | "admin" | "agent";
import {
  subscriptions,
  users,
  products,
  orders,
  subscriptionPlans,
  subscriptionPayments,
  userWallets,
  walletPayments,
  paymentSettings,
  emailSubscriptions,
} from "./shared/schema.dialect";
import { and, eq, desc, sql, inArray } from "drizzle-orm";
import { agentCommissions, users as usersTable } from "./shared/schema.dialect";
import {
  createSubscription,
  renewSubscription,
  updateSubscriptionStatus,
} from "./subscriptions";
import {
  getProducerSubscriptionStatus,
  getProducerStats,
} from "./producer-routes";
import { ESICIA_CONFIG } from "./payments/config";

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
  getAvailableProducers,
  getAgentProducers,
  getProducerDetails,
  processSubscriptionPayment,
  refundSubscriptionPayment,
  assignAgentToProducer,
  getAgentCommissions,
} from "./agent-routes";
import {
  verifyProducer as adminVerifyProducer,
  verifyAgent as adminVerifyAgent,
  getProducerCompany as adminGetProducerCompany,
  activateProducerSubscription as adminActivateProducerSubscription,
  getProducerSubscriptionAdmin as adminGetProducerSubscription,
} from "./admin-routes";
import tryOnRoutes from "./routes/try-on";

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

  // Generate a unique 6-char uppercase referral code
  async function generateUniqueReferralCode(): Promise<string> {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const gen = () =>
      Array.from(
        { length: 6 },
        () => alphabet[Math.floor(Math.random() * alphabet.length)]
      ).join("");
    for (let i = 0; i < 10; i++) {
      const code = gen();
      const [exists] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.referralCode, code))
        .limit(1);
      if (!exists) return code;
    }
    // Fallback with timestamp suffix
    return `AG${Date.now().toString().slice(-6)}`;
  }

  // Health and availability endpoints for cPanel/Monitors
  // Root path returns a stable Content-Type without charset to pass cPanel diff check
  app.get("/", (_req, res) => {
    res.status(200);
    res.setHeader("Content-Type", "text/html"); // no charset
    res.end("OK");
  });

  // Public: fetch terms by role (defaults to customer). This can later be sourced from DB or CMS.
  app.get("/api/terms", async (req: any, res) => {
    try {
      const role = String(req.query.role || "customer").toLowerCase();
      const lang = String(req.query.lang || "en").toLowerCase();
      const base = {
        version: "1.0",
        updatedAt: "2025-01-01",
        site: "Nyambika",
      };

      const tr = (en: string, rw: string, fr: string) =>
        lang === "rw" ? rw : lang === "fr" ? fr : en;

      // Agent-specific terms
      if (role === "agent") {
        return sendSuccess(res, {
          ...base,
          role: "agent",
          title: tr(
            "Agent Terms & Conditions",
            "Amasezerano y'Umukozi (Agent)",
            "Conditions de l'Agent"
          ),
          sections: [
            {
              id: "scope",
              heading: tr(
                "Scope of Work",
                "Inshingano z'Akazi",
                "Champ d'application"
              ),
              content: tr(
                "Agents manage producer subscriptions, assist with onboarding, and process Mobile Money payments on behalf of producers.",
                "Abakozi bita ku kwiyandikisha kw'abakora (producers), bagafasha mu kwinjiza ku rubuga no gutunganya ubwishyu bwa Mobile Money ku bw'abakora.",
                "Les agents gèrent les abonnements des producteurs, aident à l'intégration et traitent les paiements Mobile Money pour le compte des producteurs."
              ),
            },
            {
              id: "commission",
              heading: tr("Commission", "Komisiyo", "Commission"),
              content: tr(
                "Agents earn 40% commission on subscription payments processed. Payouts are reflected in your agent dashboard.",
                "Abakozi babona komisiyo ya 40% ku mafaranga y'ubunyamuryango batunganyije. Kwishyurwa kugaragara ku kibaho cy'umukozi.",
                "Les agents gagnent 40% de commission sur les abonnements traités. Les paiements sont visibles sur votre tableau de bord agent."
              ),
            },
            {
              id: "compliance",
              heading: tr(
                "Compliance & Conduct",
                "Kurikiza Amategeko n'Imyitwarire",
                "Conformité et Conduite"
              ),
              content: tr(
                "Agents must follow local regulations and Nyambika policies. Fraudulent activity or misuse will result in termination.",
                "Abakozi bagomba gukurikiza amategeko y'igihugu na politiki za Nyambika. Uburiganya cyangwa ikoreshwa ribi bihanwa no guhagarikwa.",
                "Les agents doivent respecter les réglementations locales et les politiques de Nyambika. Toute fraude ou abus entraînera une résiliation."
              ),
            },
            {
              id: "privacy",
              heading: tr("Privacy", "Ibanga", "Confidentialité"),
              content: tr(
                "Customer and producer data must be handled confidentially and used only for official purposes.",
                "Amakuru y'abakiriya n'abakora agomba gucungwa mu ibanga kandi agakoreshwa gusa ku mpamvu zemewe n'amategeko.",
                "Les données des clients et des producteurs doivent être traitées de manière confidentielle et utilisées uniquement à des fins officielles."
              ),
            },
            {
              id: "payments",
              heading: tr(
                "Payments & Settlements",
                "Kwishyura no Kwishyura Byuzuye",
                "Paiements et Règlements"
              ),
              content: tr(
                "All payments processed must be accurately recorded with references. Disputes are investigated per platform policy.",
                "Ubwishyu bwose butunganyijwe bugomba kwandikwa neza n'inyandiko z'icyitegererezo. Impaka zisuzumwa hakurikijwe politiki ya platiforme.",
                "Tous les paiements traités doivent être correctement enregistrés avec des références. Les litiges sont examinés conformément à la politique de la plateforme."
              ),
            },
          ],
        });
      }

      // Producer-specific terms
      if (role === "producer") {
        return sendSuccess(res, {
          ...base,
          role: "producer",
          title: tr(
            "Producer Terms & Conditions",
            "Amasezerano y'Umucuruzi (Producer)",
            "Conditions du Producteur"
          ),
          sections: [
            {
              id: "eligibility",
              heading: tr(
                "Eligibility & Verification",
                "Uburenganzira & Kwemezwa",
                "Éligibilité et Vérification"
              ),
              content: tr(
                "Producers must provide accurate business information and pass verification. An active subscription is required to sell on Nyambika.",
                "Abakora bagomba gutanga amakuru nyayo y'ubucuruzi no kunyura mu kwemezwa. Uburyo bwo kwiyandikisha bukora burakenewe kugira ngo ugurishe kuri Nyambika.",
                "Les producteurs doivent fournir des informations exactes et réussir la vérification. Un abonnement actif est requis pour vendre sur Nyambika."
              ),
            },
            {
              id: "products",
              heading: tr(
                "Product Listings & Quality",
                "Ibyerekeye Ibicuruzwa & Ubwiza",
                "Fiches Produits et Qualité"
              ),
              content: tr(
                "All product details (title, images, price, sizes, colors) must be accurate. Counterfeit or prohibited items are not allowed.",
                "Amakuru yose y'igicuruzwa (umutwe, amashusho, igiciro, ingano, amabara) agomba kuba nyayo. Ibicuruzwa by'ubuhendabana cyangwa bitemewe ntibyemewe.",
                "Tous les détails (titre, images, prix, tailles, couleurs) doivent être exacts. Les contrefaçons ou articles interdits sont prohibés."
              ),
            },
            {
              id: "orders",
              heading: tr(
                "Order Fulfillment",
                "Kuzuza Amabwiriza y'Ibicuruzwa",
                "Exécution des Commandes"
              ),
              content: tr(
                "Orders must be acknowledged promptly and fulfilled within the communicated timeframe. Keep customers informed about delays.",
                "Amabwiriza agomba kwemerezwa vuba kandi akuzuzwa mu gihe cyatangajwe. Menyesha abakiriya igihe habayeho gutinda.",
                "Les commandes doivent être confirmées rapidement et honorées dans les délais communiqués. Informez les clients des retards."
              ),
            },
            {
              id: "returns",
              heading: tr(
                "Returns, Refunds & Disputes",
                "Garuka, Gusubizwa & Impaka",
                "Retours, Remboursements et Litiges"
              ),
              content: tr(
                "Follow our returns and dispute policy. Resolve customer complaints professionally. Nyambika may mediate when needed.",
                "Kurikiza politiki yacu yo gusubiza no gukemura impaka. Kemura ibibazo by'abakiriya mu buryo bw'umwuga. Nyambika ishobora gufasha mu buhuza aho bikenewe.",
                "Suivez notre politique de retours et litiges. Résolvez les réclamations des clients de manière professionnelle. Nyambika peut intervenir si nécessaire."
              ),
            },
            {
              id: "pricing",
              heading: tr(
                "Pricing & Fees",
                "Ibiciro & Amafaranga",
                "Tarifs et Frais"
              ),
              content: tr(
                "Subscription fees apply per selected plan. Additional optional services (e.g., product boost) may incur fees.",
                "Amafaranga y'ubunyamuryango akurikizwa ku igenamigambi wahisemo. Serivisi z'inyongera z'ubushake (nko guteza imbere igicuruzwa) zishobora kugira ikiguzi.",
                "Des frais d'abonnement s'appliquent selon l'offre choisie. Des services optionnels supplémentaires (ex: boost produit) peuvent être facturés."
              ),
            },
            {
              id: "payments",
              heading: tr("Payouts", "Kwishyurwa", "Versements"),
              content: tr(
                "Payouts are settled to your configured wallet or payment method according to platform schedules and policy.",
                "Kwishyurwa gukorerwa kuri wallet washyizeho cyangwa uburyo bwo kwishyurwa hakurikijwe gahunda na politiki ya platiforme.",
                "Les versements sont effectués vers votre portefeuille configuré ou moyen de paiement selon les calendriers et politiques de la plateforme."
              ),
            },
            {
              id: "conduct",
              heading: tr(
                "Conduct & Compliance",
                "Imyitwarire & Kubahiriza Amategeko",
                "Conduite et Conformité"
              ),
              content: tr(
                "Maintain professional communication. Comply with local laws and platform rules. Misuse may lead to suspension.",
                "Gumana itumanaho ry'umwuga. Kubahiriza amategeko y'igihugu n'amategeko ya platiforme. Ikoreshwa ribi rishobora gutera guhagarikwa.",
                "Maintenez une communication professionnelle. Respectez les lois locales et les règles de la plateforme. Un abus peut entraîner une suspension."
              ),
            },
            {
              id: "privacy",
              heading: tr(
                "Privacy & Data",
                "Ibanga & Amakuru",
                "Confidentialité et Données"
              ),
              content: tr(
                "Handle customer data responsibly and only for order processing and support purposes.",
                "Cunga amakuru y'abakiriya neza kandi uyakoreshe gusa mu gutunganya amabwiriza no gutanga ubufasha.",
                "Traitez les données des clients de manière responsable et uniquement pour traiter les commandes et l'assistance."
              ),
            },
          ],
        });
      }

      // Default/basic terms for other roles (minimal placeholder)
      return sendSuccess(res, {
        ...base,
        role,
        title: tr(
          "General Terms & Conditions",
          "Amasezerano Rusange",
          "Conditions Générales"
        ),
        sections: [
          {
            id: "use",
            heading: tr(
              "Acceptable Use",
              "Ukoresha Bikwiye",
              "Utilisation Acceptable"
            ),
            content: tr(
              "Use the platform responsibly and in accordance with our policies and local laws.",
              "Koresha platiforme mu buryo bukwiriye ubyubahiriza politiki zacu n'amategeko y'igihugu.",
              "Utilisez la plateforme de manière responsable, conformément à nos politiques et aux lois locales."
            ),
          },
        ],
      });
    } catch (e) {
      console.error("Error in GET /api/terms:", e);
      return sendError(res, 500, "Failed to load terms", e);
    }
  });

  // Dedicated health endpoint with a simple, stable response
  app.get("/health", (_req, res) => {
    sendSuccess(res, { status: "ok" }, "API is healthy");
  });

  // Newsletter subscription (public)
  app.post("/api/newsletter/subscribe", async (req: any, res) => {
    try {
      const { email, source } = req.body || {};
      const emailStr =
        typeof email === "string" ? email.trim().toLowerCase() : "";
      const sourceStr = typeof source === "string" ? source.trim() : null;
      const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
      if (!emailStr || !emailRegex.test(emailStr)) {
        return sendError(res, 400, "Valid email is required");
      }

      // Idempotent: check if already exists
      const existing = await db
        .select()
        .from(emailSubscriptions)
        .where(eq(emailSubscriptions.email, emailStr))
        .limit(1);
      if (existing && existing[0]) {
        return sendSuccess(res, { already: true }, "Already subscribed");
      }

      const vals: any = {
        email: emailStr,
        source: sourceStr,
      };
      await db.insert(emailSubscriptions).values(vals).returning();
      return sendSuccess(res, { already: false }, "Subscribed successfully");
    } catch (error) {
      console.error("Error in POST /api/newsletter/subscribe:", error);
      return sendError(res, 500, "Failed to subscribe", error);
    }
  });

  // Register try-on routes
  app.use("/api/try-on", tryOnRoutes);
  app.use("/api/try-on-sessions", tryOnRoutes);

  // Esicia/Kpay configuration imported from centralized module
  const ESICIA_STATIC = ESICIA_CONFIG;

  // Auth middleware with JWT
  const requireAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Authentication required");
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
            return sendError(res, 401, "Authentication required");
          }
          req.userRole = user.role;
        } catch {
          return sendError(res, 401, "Authentication required");
        }
      }
      // Populate req.user for handlers that expect it (e.g., agent-routes)
      req.user = { id: req.userId, role: req.userRole } as any;
      next();
    } catch {
      return sendError(res, 401, "Invalid token");
    }
  };

  // Generic: current user accepts terms (agent or producer)
  app.post("/api/terms/accept", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.userId);
      if (!user) return sendError(res, 404, "User not found");

      const now = new Date();
      const updated = await storage.updateUser(user.id, {
        // @ts-ignore columns exist in schema
        termsAccepted: true as any,
        // @ts-ignore
        termsAcceptedAt: now as any,
      } as any);

      const {
        password: _pw,
        fullName,
        ...userWithoutPassword
      } = (updated || user) as any;
      return sendSuccess(res, {
        user: {
          ...userWithoutPassword,
          name: fullName || user.email.split("@")[0],
          termsAccepted: true,
          termsAcceptedAt: now,
        },
      }, "Terms accepted successfully");

    } catch (e) {
      console.error("Error in POST /api/terms/accept:", e);
      return sendError(res, 500, "Failed to accept terms", e);
    }
  });

  // Agent-specific terms accept endpoint
  app.post("/api/agent/terms/accept", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.userId);
      if (!user) return sendError(res, 404, "User not found");

      // Verify user is an agent
      if (user.role !== "agent") {
        return sendError(res, 403, "Access denied. Agent role required.");
      }

      const now = new Date();
      const updated = await storage.updateUser(user.id, {
        // @ts-ignore columns exist in schema
        termsAccepted: true as any,
        // @ts-ignore
        termsAcceptedAt: now as any,
      } as any);

      const {
        password: _pw,
        fullName,
        ...userWithoutPassword
      } = (updated || user) as any;
      return sendSuccess(res, {
        user: {
          ...userWithoutPassword,
          name: fullName || user.email.split("@")[0],
          termsAccepted: true,
          termsAcceptedAt: now,
        },
      }, "Terms accepted successfully");

    } catch (e) {
      console.error("Error in POST /api/agent/terms/accept:", e);
      return sendError(res, 500, "Failed to accept agent terms", e);
    }
  });

  // ===== AI: Suggest product titles from image =====
  app.post("/api/ai/suggest-titles", requireAuth, async (req: any, res) => {
    try {
      const { imageUrl, categoryHint } = req.body || {};
      if (!imageUrl || typeof imageUrl !== "string") {
        return sendError(res, 400, "imageUrl is required");
      }
      const result = await suggestProductTitles(imageUrl, {
        categoryHint:
          typeof categoryHint === "string" && categoryHint.trim().length > 0
            ? categoryHint
            : undefined,
      });
      return sendSuccess(res, result);
    } catch (error) {
      console.error("Error in POST /api/ai/suggest-titles:", error);
      return sendError(res, 500, "Failed to suggest titles", error);
    }
  });

  // ===== Generic OPAY (Esicia) payment for non-wallet uses =====
  // This endpoint initiates a payment without touching the user wallet tables.
  app.post("/api/payments/opay/pay", requireAuth, async (req: any, res) => {
    try {
      const {
        amount,
        phone,
        email,
        details = "generic_payment",
        cname,
        cnumber,
        pmethod = "momo",
        retailerid,
        bankid,
        currency = "RWF",
        // Optional subscription metadata for auto-activation via callback
        subscriptionPlanId,
        billingCycle, // "monthly" | "annual"
        // Agent flow: allow paying for a specific producer
        targetProducerUserId,
      } = req.body || {};

      const parsedAmount = Number(amount);
      if (!parsedAmount || parsedAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      if (!phone || typeof phone !== "string") {
        return sendError(res, 400, "Phone number is required");
      }

      // Resolve user context for email/name
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

      const externalReference = `PAY-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      // If this is a subscription payment, create a pending subscription now and link it to the reference
      // It will be activated by the OPAY callback when payment is completed.
      if (subscriptionPlanId && typeof subscriptionPlanId === "string") {
        try {
          const forUserId = targetProducerUserId || req.userId;
          // Minimal pending row; endDate will be corrected on activation
          const now = new Date();
          const tempEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day placeholder
          const vals: any = {
            id: randomUUID(),
            userId: forUserId,
            planId: subscriptionPlanId,
            agentId: targetProducerUserId ? req.userId : null,
            status: "pending",
            billingCycle: String(billingCycle || "monthly"),
            startDate: now as any,
            endDate: tempEnd as any,
            amount: String(Math.max(1, Math.round(parsedAmount))),
            paymentMethod: "mobile_money",
            paymentReference: externalReference,
            autoRenew: false,
          };
          await db.insert(subscriptions).values(vals).returning();
        } catch (e) {
          console.warn(
            "Failed to create pending subscription intent:",
            (e as any)?.message || e
          );
        }
      }

      if (isMock) {
        if (debug) console.log("[Esicia] MOCK generic payment: auto-success");
        return sendSuccess(res, {
          ok: true,
          mode: "mock",
          refid: externalReference,
          redirectUrl: null,
          message: "Mock payment completed",
        });
      }

      if (!hasAuth) {
        return sendError(res, 500, "Payment gateway credentials missing");
      }

      // Normalize inputs
      const msisdnDigits = String(phone).replace(/\D/g, "");
      const msisdnLocal = msisdnDigits.startsWith("2507")
        ? "0" + msisdnDigits.slice(3)
        : msisdnDigits.startsWith("07")
        ? msisdnDigits
        : msisdnDigits.length === 9 && msisdnDigits.startsWith("7")
        ? "0" + msisdnDigits
        : String(phone);
      const safeDetails = String(details || "generic_payment");
      const safeAmount = Math.max(1, Math.round(parsedAmount));
      const safeCnumber =
        String(resolvedCnumber).replace(/\D/g, "") || "000000000";

      const payload = {
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
      } as any;

      const response = await fetch(esiciaBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain, */*",
          "User-Agent": "Nyambika/1.0",
          Authorization:
            "Basic " +
            Buffer.from(
              `${ESICIA_STATIC.USERNAME}:${ESICIA_STATIC.PASSWORD}`
            ).toString("base64"),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(ESICIA_STATIC.TIMEOUT_MS),
      });

      const json = (await response.json()) as any;
      if (debug) console.log("[Esicia] Generic pay response", json);

      const retcode = String(json?.retcode ?? "");
      const url = typeof json?.url === "string" ? json.url.trim() : "";
      if (retcode !== "0") {
        sendSuccess(res, { gateway: json }, "Status checked successfully");
      }
      return sendSuccess(res, {
        ok: true,
        refid: externalReference,
        redirectUrl: url || null,
        gateway: json,
      });
    } catch (error) {
      console.error("Error in POST /api/payments/opay/pay:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Public status check by refid (no DB lookup)
  app.post(
    "/api/payments/opay/checkstatus-public",
    requireAuth,
    async (req: any, res) => {
      try {
        const { refid } = req.body || {};
        if (!refid)
          return sendError(res, 400, "refid is required");
        const endpoint = ESICIA_STATIC.BASE_URL;
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
            "User-Agent": "Nyambika/1.0",
            Authorization:
              "Basic " +
              Buffer.from(
                `${ESICIA_STATIC.USERNAME}:${ESICIA_STATIC.PASSWORD}`
              ).toString("base64"),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(ESICIA_STATIC.TIMEOUT_MS),
        });
        const json = (await resp.json()) as any;
        return sendSuccess(res, { gateway: json }, "Status checked successfully");
      } catch (error) {
        console.error(
          "Error in POST /api/payments/opay/checkstatus-public:",
          error
        );
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Generic wallet debit charge (for non-topup payments)
  app.post(
    "/api/payments/wallet/charge",
    requireAuth,
    async (req: any, res) => {
      try {
        const {
          amount,
          description = "Wallet charge",
          metadata,
        } = req.body || {};
        const parsedAmount = Number(amount);
        if (!parsedAmount || parsedAmount <= 0) {
          return sendError(res, 400, "Invalid amount");
        }
        const wallet = await ensureUserWallet(req.userId);
        const currentBalance = Number(wallet.balance) || 0;
        if (currentBalance < parsedAmount) {
          return sendError(res, 402, "Insufficient wallet balance", {
            required: parsedAmount,
            balance: currentBalance,
          });
        }
        // Record debit
        let payment: any;
        const vals = {
          id: randomUUID(),
          walletId: wallet.id,
          userId: req.userId,
          type: "debit" as const,
          amount: String(parsedAmount.toFixed(2)),
          method: "wallet" as const,
          provider: null as any,
          phone: null as any,
          status: "completed" as const,
          description,
          externalReference: `WALLET-CHARGE-${Date.now()}`,
          metadata: metadata ? JSON.stringify(metadata) : null,
        } as any;
        const [created] = await db
          .insert(walletPayments)
          .values(vals)
          .returning();
        payment = created as any;
        // Update balance
        const newBalance = String((currentBalance - parsedAmount).toFixed(2));
        await db
          .update(userWallets)
          .set({ balance: newBalance, updatedAt: new Date() as any })
          .where(eq(userWallets.id, wallet.id))
          .returning();
        return sendSuccess(res, {
          ok: true,
          payment,
          wallet: { ...wallet, balance: newBalance },
        });
      } catch (error) {
        console.error("Error in POST /api/payments/wallet/charge:", error);
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Utility: ensure a wallet exists for given user and return it
  const ensureUserWallet = async (userId: string) => {
    let [wallet] = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, userId))
      .limit(1);
    if (!wallet) {
      const vals = {
        id: randomUUID(),
        userId,
        balance: "0",
        status: "active",
      } as any;
      const [created] = await db.insert(userWallets).values(vals).returning();
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
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // ===== Orders Endpoints =====
  // Create a new order (auto-confirmed, no payment step per current flow)
  app.post("/api/orders", requireAuth, async (req, res) => {
    try {
      await createOrder(req as any, res as any);
    } catch (error) {
      console.error("Error in POST /api/orders:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Get current user's orders
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      await getUserOrders(req as any, res as any);
    } catch (error) {
      console.error("Error in GET /api/orders:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Get order by id (role-sensitive; customers see own orders, producers see items they own, admins see all)
  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      await getOrderById(req as any, res as any);
    } catch (error) {
      console.error("Error in GET /api/orders/:id:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Update order (status, trackingNumber, notes) with role checks
  app.put("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      await updateOrder(req as any, res as any);
    } catch (error) {
      console.error("Error in PUT /api/orders/:id:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Cancel order (customer-only, pending/confirmed)
  app.delete("/api/orders/:id", requireAuth, async (req, res) => {
    try {
      await cancelOrder(req as any, res as any);
    } catch (error) {
      console.error("Error in DELETE /api/orders/:id:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Producer: get orders that include items owned by the producer (current user)
  app.get("/api/producer/orders", requireAuth, async (req, res) => {
    try {
      await getProducerOrders(req as any, res as any);
    } catch (error) {
      console.error("Error in GET /api/producer/orders:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Producer: get orders by explicit producerId (admin or the producer themselves)
  app.get("/api/orders/producer/:producerId", requireAuth, async (req, res) => {
    try {
      await getOrdersByProducerId(req as any, res as any);
    } catch (error) {
      console.error("Error in GET /api/orders/producer/:producerId:", error);
      sendError(res, 500, "Internal server error");
    }
  });

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
        const vals = {
          id: randomUUID(),
          userId: req.userId,
          balance: "0",
          status: "active",
        } as any;
        const [created] = await db
          .insert(userWallets)
          .values(vals)
          .returning();
        wallet = created as any;
      }

      sendSuccess(res, {
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
              return sendError(res, 400, "refid is required");

            const [payment] = await db
              .select()
              .from(walletPayments)
              .where(eq(walletPayments.externalReference, refid))
              .limit(1);
            if (!payment)
              return sendError(res, 404, "Payment not found");

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
                "User-Agent": "Nyambika/1.0",
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
            return sendSuccess(res, { status: finalStatus, gateway: json });
          } catch (e) {
            console.error("Error checking payment status:", e);
            return sendError(res, 500, "Failed to check payment status", e);
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
            return sendError(res, 404, "product_boost not configured");
          return sendSuccess(res, setting);
        } catch (e) {
          console.error("Error fetching product boost payment setting:", e);
          return sendError(res, 500, "Failed to load boost fee", e);
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
              return sendError(res, 404, "Product not found");
            }
            // Authorization: producer can only boost own product unless admin
            if (req.userRole !== "admin" && product.producerId !== req.userId) {
              return sendError(res, 403, "You can only boost your own product");
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
              return sendError(res, 500, "Boost pricing not configured");
            }
            const amount = Number(boostSetting.amountInRwf);
            if (!amount || amount <= 0) {
              return sendError(res, 500, "Invalid boost amount");
            }

            // Ensure wallet exists
            let [wallet] = await db
              .select()
              .from(userWallets)
              .where(eq(userWallets.userId, req.userId))
              .limit(1);
            if (!wallet) {
              const vals = {
                id: randomUUID(),
                userId: req.userId,
                balance: "0",
                status: "active",
              } as any;
              const [created] = await db
                .insert(userWallets)
                .values(vals)
                .returning();
              wallet = created as any;
            }

            const currentBalance = Number(wallet.balance) || 0;
            if (currentBalance < amount) {
              return sendError(res, 402, "Insufficient wallet balance to boost product", {
                required: amount,
                balance: currentBalance,
              });
            }

            // Record wallet payment (debit)
            let payment: any;
            {
              const vals = {
                id: randomUUID(),
                walletId: wallet.id,
                userId: req.userId,
                type: "debit" as const,
                amount: String(amount.toFixed(2)),
                method: "mobile_money" as const,
                provider: "mtn" as const,
                phone: (req.body && (req.body as any).phone) || null,
                status: "completed" as const,
                description: `Product boost fee for product ${productId}`,
                externalReference: `BOOST-${Date.now()}`,
              } as any;
              const [created] = await db
                .insert(walletPayments)
                .values(vals)
                .returning();
              payment = created as any;
            }

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

            sendSuccess(res, {
              product: updatedProduct,
              wallet: updatedWallet,
              payment,
              boostAmount: amount,
            }, "Product boosted successfully");
          } catch (error) {
            console.error("Error boosting product:", error);
            sendError(res, 500, "Internal server error", error);
          }
        }
      );
    } catch (error) {
      console.error("Error in GET /api/wallet:", error);
      sendError(res, 500, "Internal server error", error);
    }
  });

  // Initiate a demo Mobile Money top-up (mock)
  app.post("/api/wallet/topup", requireAuth, async (req: any, res) => {
    try {
      const { amount, provider = "mtn", phone } = req.body || {};
      const parsedAmount = Number(amount);
      if (!parsedAmount || parsedAmount <= 0) {
        return sendError(res, 400, "Invalid amount");
      }

      // Ensure wallet exists
      let [wallet] = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, req.userId))
        .limit(1);
      if (!wallet) {
        const vals = {
          id: randomUUID(),
          userId: req.userId,
          balance: "0",
          status: "active",
        } as any;
        const [created] = await db
          .insert(userWallets)
          .values(vals)
          .returning();
        wallet = created as any;
      }

      // Create a pending wallet payment record
      let payment: any;
      {
        const vals = {
          id: randomUUID(),
          walletId: wallet.id,
          userId: req.userId,
          type: "topup" as const,
          amount: String(parsedAmount.toFixed(2)),
          method: "mobile_money" as const,
          provider,
          phone: phone || null,
          status: "pending" as const,
          description: "Demo Mobile Money top-up",
          externalReference: `DEMO-${Date.now()}`,
        } as any;
        const [created] = await db
          .insert(walletPayments)
          .values(vals)
          .returning();
        payment = created as any;
      }

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

      sendSuccess(res, {
        payment: { ...payment, status: "completed" },
        wallet: updatedWallet,
      }, "Top-up successful", 201);
    } catch (error) {
      console.error("Error in POST /api/wallet/topup:", error);
      sendError(res, 500, "Internal server error", error);
    }
  });

  // Wallet webhook (mock) — accepts paymentId and marks it completed
  app.post("/api/wallet/webhook", async (req: any, res) => {
    try {
      const { paymentId, status = "completed" } = req.body || {};
      if (!paymentId) {
        return sendError(res, 400, "paymentId is required");
      }

      const [payment] = await db
        .select()
        .from(walletPayments)
        .where(eq(walletPayments.id, paymentId))
        .limit(1);
      if (!payment) {
        return sendError(res, 404, "Payment not found");
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

      sendSuccess(res, null, "Webhook processed successfully");
    } catch (error) {
      console.error("Error in POST /api/wallet/webhook:", error);
      sendError(res, 500, "Internal server error", error);
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
      sendSuccess(res, list);
    } catch (error) {
      console.error("Error in GET /api/wallet/payments:", error);
      sendError(res, 500, "Internal server error", error);
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
          return sendError(res, 400, "Invalid amount");
        }
        if (!phone || typeof phone !== "string") {
          return sendError(res, 400, "Phone number is required");
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

        let payment: any;
        {
          const vals = {
            id: randomUUID(),
            walletId: wallet.id,
            userId: req.userId,
            type: "topup" as const,
            amount: String(parsedAmount.toFixed(2)),
            method: "mobile_money" as const,
            provider: "opay" as const,
            phone,
            status: "pending" as const,
            description: "OPAY wallet top-up",
            externalReference,
          } as any;
          const [created] = await db
            .insert(walletPayments)
            .values(vals)
            .returning();
          payment = created as any;
        }

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

          return sendSuccess(res, {
            payment: { ...payment, status: "completed" },
            wallet: updatedWallet,
            mode: "mock",
          }, "Payment successful (Mock Mode)", 201);
        }

        if (!hasAuth) {
          return sendError(res, 500, "Payment gateway credentials missing");
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
          : String(phone);

        // Send payment request
        const timeoutMs = ESICIA_STATIC.TIMEOUT_MS;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
            "User-Agent": "Nyambika/1.0",
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
          return sendError(res, 400, mapRetcode(retcode), { gateway: json });
        }

        if (success && url) {
          return sendSuccess(res, {
            ok: true,
            payment,
            redirectUrl: url,
          });
        }

        // retcode 0, success 1, but no checkout URL: treat as USSD push/STK flow
        // Keep wallet payment as pending and let client poll or wait for callback
        return sendSuccess(res, {
          ok: true,
          payment,
          mode: "push",
          message: "Payment request sent. Please approve on your phone.",
          refid: payment.externalReference,
          gateway: debug ? json : undefined,
        });
      } catch (error) {
        console.error("Error in POST /api/payments/opay/initiate:", error);
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // ✅ Payment callback route (separated)
  app.post("/api/payments/opay/callback", async (req: any, res) => {
    try {
      const { reference, refid, reply, status, statusid } = req.body || {};
      const ref = reference || refid;

      if (!ref)
        return sendError(res, 400, "Missing reference/refid");

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

      // Try update wallet payment if it exists (generic payments may not create wallet records)
      const [payment] = await db
        .select()
        .from(walletPayments)
        .where(eq(walletPayments.externalReference, ref))
        .limit(1);
      if (payment && (payment.status || "").toLowerCase() === "pending") {
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

      // Always attempt to activate a pending subscription linked to this reference when completed
      if (finalStatus === "completed") {
        try {
          const [pendingSub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.paymentReference, ref))
            .limit(1);
          if (
            pendingSub &&
            (pendingSub.status || "").toLowerCase() === "pending"
          ) {
            const now = new Date();
            const cycle = String(pendingSub.billingCycle || "monthly");
            const end = new Date(now);
            if (cycle === "annual") end.setFullYear(end.getFullYear() + 1);
            else end.setMonth(end.getMonth() + 1);
            await db
              .update(subscriptions)
              .set({
                status: "active",
                startDate: now as any,
                endDate: end as any,
                paymentMethod: "mobile_money",
              })
              .where(eq(subscriptions.id, pendingSub.id))
              .returning();
          }
        } catch (e) {
          console.error(
            "Failed to activate pending subscription on callback:",
            e
          );
        }
      }

      return sendSuccess(res, null, "Operation successful");
    } catch (error) {
      console.error("Error in POST /api/payments/opay/callback:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  const requireRole = (roles: string[]) => {
    const normalized = roles.map((r) => r.toLowerCase());
    return (req: any, res: any, next: any) => {
      const role = (req.userRole || "").toString().toLowerCase();
      // Defensive: if role is missing, treat as unauthenticated
      if (!role) {
        return sendError(res, 401, "Authentication required");
      }
      // Admin bypass (superuser)
      if (role === "admin") {
        return next();
      }
      if (!normalized.includes(role)) {
        return sendError(res, 403, "Insufficient permissions");
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
        sendError(res, 500, "Internal server error");
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
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Admin: unified user verification by ID (agent/producer/other)
  app.post(
    "/api/admin/users/:userId/verify",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        const { userId } = req.params as { userId: string };
        if (!userId)
          return sendError(res, 400, "userId is required");

        const user = await storage.getUserById(userId).catch(() => null as any);
        if (!user) return sendError(res, 404, "User not found");

        const role = String(user.role || "").toLowerCase();
        if (role === "agent") {
          // Delegate to existing admin verify agent handler
          (req as any).params = { ...(req as any).params, agentId: userId };
          return adminVerifyAgent(req as any, res as any);
        }
        if (role === "producer") {
          // Delegate to existing admin verify producer handler
          (req as any).params = { ...(req as any).params, producerId: userId };
          return adminVerifyProducer(req as any, res as any);
        }

        // For other roles, just set isVerified = true
        const updated = await storage.updateUser(userId, {
          isVerified: true,
        } as any);
        return sendSuccess(res, {
          message: "User verified successfully",
          user: updated,
        });
      } catch (error) {
        console.error("Error in /api/admin/users/:userId/verify:", error);
        return sendError(res, 500, "Internal server error");
      }
    }
  );

  // Admin: refund a subscription payment and reverse all related commissions
  app.post(
    "/api/admin/subscription-payments/:id/refund",
    requireAuth,
    requireRole(["admin"]),
    async (req: any, res) => {
      try {
        return refundSubscriptionPayment(req as any, res as any);
      } catch (error) {
        console.error(
          "Error in POST /api/admin/subscription-payments/:id/refund:",
          error
        );
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Admin: get latest subscription (with plan) for a producer
  app.get(
    "/api/admin/producers/:producerId/subscription",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        await adminGetProducerSubscription(req as any, res as any);
      } catch (error) {
        console.error(
          "Error in /api/admin/producers/:producerId/subscription:",
          error
        );
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Admin: activate producer subscription without payment
  app.post(
    "/api/admin/producers/:producerId/activate-subscription",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        await adminActivateProducerSubscription(req as any, res as any);
      } catch (error) {
        console.error(
          "Error in /api/admin/producers/:producerId/activate-subscription:",
          error
        );
        sendError(res, 500, "Internal server error");
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
        sendError(res, 500, "Internal server error");
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
        sendError(res, 500, "Internal server error");
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

        sendSuccess(res, {
          totalUsers,
          totalProducers,
          totalAgents,
          totalOrders,
          totalRevenue,
        });
      } catch (error) {
        console.error("Error in /api/admin/stats:", error);
        sendError(res, 500, "Internal server error");
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
        sendSuccess(res, sanitized);
      } catch (error) {
        console.error("Error in /api/admin/producers:", error);
        sendError(res, 500, "Internal server error");
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
        sendSuccess(res, sanitized);
      } catch (error) {
        console.error("Error in /api/admin/agents:", error);
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Admin agents: list all agent payments (with filters + pagination via headers)
  app.get(
    "/api/admin/agents/:agentId/payments",
    requireAuth,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        const agentId = String(req.params.agentId);
        const {
          from,
          to,
          status,
          payoutStatus,
          producerId,
          planId,
          limit,
          offset,
        } = (req.query || {}) as {
          from?: string;
          to?: string;
          status?: string;
          payoutStatus?: string;
          producerId?: string;
          planId?: string;
          limit?: string;
          offset?: string;
        };

        const conditions: any[] = [eq(subscriptionPayments.agentId, agentId)];
        if (status && typeof status === "string") {
          conditions.push(eq(subscriptionPayments.status, status));
        }
        if (payoutStatus && typeof payoutStatus === "string") {
          conditions.push(
            eq(subscriptionPayments.agentPayoutStatus as any, payoutStatus)
          );
        }
        if (producerId && typeof producerId === "string") {
          conditions.push(eq(subscriptions.userId, producerId));
        }
        if (planId && typeof planId === "string") {
          conditions.push(eq(subscriptions.planId, planId));
        }
        if (from) {
          const fromDate = new Date(from);
          if (!isNaN(fromDate.getTime())) {
            conditions.push(
              sql`${subscriptionPayments.createdAt} >= ${fromDate}`
            );
          }
        }
        if (to) {
          const toDate = new Date(to);
          if (!isNaN(toDate.getTime())) {
            conditions.push(
              sql`${subscriptionPayments.createdAt} <= ${toDate}`
            );
          }
        }

        // total count
        const [{ total } = { total: 0 }] = await db
          .select({ total: sql<number>`COUNT(*)` })
          .from(subscriptionPayments)
          .leftJoin(
            subscriptions,
            eq(subscriptionPayments.subscriptionId, subscriptions.id)
          )
          .where(and.apply(null, conditions as any));

        const q = db
          .select({
            id: subscriptionPayments.id,
            amount: subscriptionPayments.amount,
            agentCommission: subscriptionPayments.agentCommission,
            status: subscriptionPayments.status,
            paymentMethod: subscriptionPayments.paymentMethod,
            paymentReference: subscriptionPayments.paymentReference,
            createdAt: subscriptionPayments.createdAt,
            agentPayoutStatus: subscriptionPayments.agentPayoutStatus as any,
            agentPayoutDate: subscriptionPayments.agentPayoutDate as any,
            agentPayoutReference:
              subscriptionPayments.agentPayoutReference as any,
            agentPayoutNotes: subscriptionPayments.agentPayoutNotes as any,
            producerName: users.fullName,
            planName: subscriptionPlans.name,
          })
          .from(subscriptionPayments)
          .leftJoin(
            subscriptions,
            eq(subscriptionPayments.subscriptionId, subscriptions.id)
          )
          .leftJoin(users, eq(subscriptions.userId, users.id))
          .leftJoin(
            subscriptionPlans,
            eq(subscriptions.planId, subscriptionPlans.id)
          )
          .where(and.apply(null, conditions as any))
          .orderBy(desc(subscriptionPayments.createdAt));

        let rowsQuery: any = q as any;
        const lim = Math.max(0, Number(limit || 0));
        const off = Math.max(0, Number(offset || 0));
        if (lim) rowsQuery = (rowsQuery as any).limit(lim);
        if (off) rowsQuery = (rowsQuery as any).offset(off);

        const rows = await rowsQuery;
        res.setHeader("X-Total-Count", String(total || 0));
        return sendSuccess(res, rows);
      } catch (error) {
        console.error("Error fetching agent payments:", error);
        return sendError(res, 500, "Internal server error");
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
        sendSuccess(res, sanitized);
      } catch (error) {
        console.error("Error in /api/admin/customers:", error);
        sendError(res, 500, "Internal server error");
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
        sendSuccess(res, sanitized);
      } catch (error) {
        console.error("Error in /api/admin/admins:", error);
        sendError(res, 500, "Internal server error");
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
          return sendError(res, 400, "Missing required fields: email, password, name, role");
        }

        const normalizedRole = String(role).toLowerCase();
        const allowedRoles = ["customer", "producer", "agent", "admin"];
        if (!allowedRoles.includes(normalizedRole)) {
          return sendError(res, 400, "Invalid role");
        }

        // Check for existing user
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return sendError(res, 400, "User already exists");
        }

        const hashed = await bcrypt.hash(password, 10);

        // Create user (generate referralCode for agents)
        const userData: any = {
          username: email, // Use email as username for now
          email,
          password: hashed,
          fullName: name,
          role: normalizedRole,
          phone: phone || null,
        };

        const user = await storage.createUser(userData);

        const { password: _pw, ...sanitized } = user as any;
        sendSuccess(res, sanitized, "User created successfully", 201);
      } catch (error) {
        console.error("Error in POST /api/admin/users:", error);
        sendError(res, 500, "Internal server error");
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
        sendSuccess(res, recent);
      } catch (error) {
        console.error("Error in /api/admin/orders:", error);
        sendError(res, 500, "Internal server error");
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

        sendSuccess(res, result);
      } catch (error) {
        console.error("Error in /api/admin/pending-approvals:", error);
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Subscription plans (public)
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      await getSubscriptionPlans(req as any, res as any);
    } catch (error) {
      console.error("Error in /api/subscription-plans:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Subscription plans: get by id (public)
  app.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const { getSubscriptionPlanById } = await import("./subscription-plans");
      await getSubscriptionPlanById(req as any, res as any);
    } catch (error) {
      console.error("Error in /api/subscription-plans/:id:", error);
      sendError(res, 500, "Internal server error");
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
        sendError(res, 500, "Internal server error");
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
        sendError(res, 500, "Internal server error");
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
        return sendError(res, 400, "Missing required fields: planId, billingCycle, paymentMethod, amount");
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
      sendError(res, 500, "Internal server error");
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
        sendError(res, 500, "Internal server error");
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
        sendError(res, 500, "Internal server error");
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
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, role, phone } = req.body;
      const referrerId = (req.body?.ref || req.query?.ref || "")
        .toString()
        .trim();

      // Validate input
      if (!email || !password || !name || !role) {
        return sendError(res, 400, "Missing required fields");
      }

      if (!["customer", "producer", "agent"].includes(role)) {
        return sendError(res, 400, "Invalid role");
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return sendError(res, 400, "User with this email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Resolve referral (agent onboarding only)
      let referredBy: string | null = null;
      if (referrerId && role === "agent") {
        try {
          const referrer = await db
            .select({ id: usersTable.id, role: usersTable.role })
            .from(usersTable)
            .where(eq(usersTable.referralCode, referrerId))
            .limit(1);
          if (
            referrer[0] &&
            String(referrer[0].role).toLowerCase() === "agent"
          ) {
            referredBy = referrer[0].id;
          }
        } catch (_e) {
          // ignore referral errors
        }
      }

      // Create user (generate referralCode for agents)
      const userData: any = {
        username: email, // Use email as username for now
        email,
        password: hashedPassword,
        fullName: name,
        role,
        phone: phone || null,
        ...(role === "agent" && referredBy ? { referredBy } : {}),
        ...(role === "agent"
          ? { referralCode: await generateUniqueReferralCode() }
          : {}),
      };

      const user = await storage.createUser(userData);

      // Note: Referral signup bonus is not credited on direct registration.
      // It will be credited after admin verifies the agent.

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

      sendSuccess(res, { user: mappedUser, token }, "Registration successful", 201);
    } catch (error) {
      console.error("Registration error:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, 400, "Email and password are required");
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return sendError(res, 401, "Invalid email or password");
      }

      // Check if user has password field
      if (!user.password) {
        console.error("User found but no password field:", user);
        return sendError(res, 500, "User account configuration error");
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return sendError(res, 401, "Invalid email or password");
      }

      // Warn if JWT_SECRET is not configured; continue with fallback to avoid hard 500s in dev
      if (!process.env.JWT_SECRET) {
        console.warn(
          "JWT_SECRET not set; using fallback-secret. Configure JWT_SECRET in backend/.env for production."
        );
      }

      // Generate JWT token
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
        termsAccepted: (user as any).termsAccepted ?? false,
        termsAcceptedAt: (user as any).termsAcceptedAt ?? null,
      };

      sendSuccess(res, {
        user: mappedUser,
        token,
      }, "Login successful");
    } catch (error) {
      const err = error as Error;
      console.error("Login error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      sendError(res, 500, "Internal server error");
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.userId);
      if (!user) {
        return sendError(res, 404, "User not found");
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
        termsAccepted: (user as any).termsAccepted ?? false,
        termsAcceptedAt: (user as any).termsAcceptedAt ?? null,
      };
      sendSuccess(res, mappedUser);
    } catch (error) {
      console.error("Get user error:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Change password (supports both PUT and POST for flexibility)
  const changePasswordHandler = async (req: any, res: any) => {
    try {
      const { currentPassword, newPassword } = req.body || {};

      if (!currentPassword || !newPassword) {
        return sendError(res, 400, "currentPassword and newPassword are required");
      }

      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return sendError(res, 400, "New password must be at least 6 characters");
      }

      const user = await storage.getUserById(req.userId);
      if (!user || !user.password) {
        return sendError(res, 404, "User not found");
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return sendError(res, 400, "Current password is incorrect");
      }

      const isSame = await bcrypt.compare(newPassword, user.password);
      if (isSame) {
        return sendError(res, 400, "New password must be different from current password");
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashed } as any);

      sendSuccess(res, null, "Password updated successfully");
    } catch (error) {
      console.error("Error in change-password:", error);
      return sendError(res, 500, "Internal server error");
    }
  };

  app.put("/api/auth/change-password", requireAuth, changePasswordHandler);
  app.post("/api/auth/change-password", requireAuth, changePasswordHandler);

  // Logout (JWT is stateless — client discards token)
  app.post("/api/auth/logout", (_req, res) => {
    sendSuccess(res, null, "Logged out successfully");
  });

  // Forgot password — generate reset token and send email
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return sendError(res, 400, "Email is required");

      const user = await storage.getUserByEmail(email);
      // Always return success to prevent email enumeration
      if (!user) {
        return sendSuccess(res, null, "If that email exists, a reset link has been sent");
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.updateUser(user.id, {
        resetToken: rawToken,
        resetTokenExpires: expires,
      } as any);

      const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
      const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (emailErr) {
        console.error("[forgot-password] Email send failed:", emailErr);
        // Log reset URL in dev so it can be used without email setup
        if (process.env.NODE_ENV !== "production") {
          console.log("[forgot-password] Reset URL:", resetUrl);
        }
      }

      sendSuccess(res, null, "If that email exists, a reset link has been sent");
    } catch (error) {
      console.error("Error in forgot-password:", error);
      sendError(res, 500, "Failed to process password reset request");
    }
  });

  // Reset password — verify token and update password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return sendError(res, 400, "token and newPassword are required");
      }
      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return sendError(res, 400, "Password must be at least 6 characters");
      }

      const user = await storage.getUserByResetToken(token);
      if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
        return sendError(res, 400, "Invalid or expired reset token");
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, {
        password: hashed,
        resetToken: null,
        resetTokenExpires: null,
      } as any);

      sendSuccess(res, null, "Password reset successfully");
    } catch (error) {
      console.error("Error in reset-password:", error);
      sendError(res, 500, "Failed to reset password");
    }
  });

  // Google OAuth 2.0
  app.get("/api/auth/oauth/google", async (req, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        `${req.protocol}://${req.get("host")}/api/auth/oauth/google/callback`;
      const state = req.query.state?.toString() || "";
      if (!clientId) {
        return sendError(res, 500, "Google OAuth not configured: missing GOOGLE_CLIENT_ID");
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
      sendError(res, 500, "Failed to initiate Google OAuth");
    }
  });

  app.get("/api/auth/oauth/google/callback", async (req, res) => {
    try {
      const code = req.query.code as string | undefined;
      if (!code) {
        return sendError(res, 400, "Missing authorization code");
      }

      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        `${req.protocol}://${req.get("host")}/api/auth/oauth/google/callback`;
      if (!clientId || !clientSecret) {
        return sendError(res, 500, "Google OAuth not configured");
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
        return sendError(res, 502, "Failed to exchange code");
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
        return sendError(res, 502, "Failed to fetch user info");
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
          process.env.NODE_ENV === "production" ? ".Nyambika.com" : undefined,
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
    <p>Redirecting to Nyambika...</p>
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
      sendError(res, 500, "Authentication failed");
    }
  });

  // Finalize OAuth registration by choosing a role
  app.post("/api/auth/register-oauth", async (req, res) => {
    try {
      const { oauthToken, role, phone, ref } = req.body || {};
      if (!oauthToken || !role) {
        return sendError(res, 400, "oauthToken and role are required");
      }

      const allowedRoles = ["customer", "producer", "agent"];
      if (!allowedRoles.includes(String(role))) {
        return sendError(res, 400, "Invalid role");
      }

      // Verify pending token
      let payload: any;
      try {
        payload = jwt.verify(String(oauthToken), jwtSecret);
      } catch {
        return sendError(res, 401, "Invalid or expired OAuth session");
      }
      if (!payload || payload.kind !== "oauth_pending" || !payload.email) {
        return sendError(res, 400, "Invalid OAuth payload");
      }

      const email = String(payload.email).toLowerCase();

      // If already exists (e.g., race condition), log them in instead
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        const token = jwt.sign(
          { userId: existing.id, role: existing.role || "customer" },
          jwtSecret,
          { expiresIn: "7d" }
        );
        const {
          password: _pw,
          fullName,
          ...userWithoutPassword
        } = existing as any;
        const mappedExisting = {
          ...userWithoutPassword,
          name: fullName || existing.email.split("@")[0],
        } as any;
        return sendSuccess(res, { user: mappedExisting, token });
      }

      // Resolve referral (agent onboarding only)
      const refStr = typeof ref === "string" ? ref.trim() : "";
      let referredBy: string | null = null;
      if (role === "agent" && refStr) {
        try {
          // Try by referral code
          const [byCode] = await db
            .select({ id: usersTable.id, role: usersTable.role })
            .from(usersTable)
            .where(eq(usersTable.referralCode, refStr))
            .limit(1);
          if (byCode && String(byCode.role).toLowerCase() === "agent") {
            referredBy = byCode.id;
          } else {
            // Fallback: direct user id
            const [byId] = await db
              .select({ id: usersTable.id, role: usersTable.role })
              .from(usersTable)
              .where(eq(usersTable.id, refStr))
              .limit(1);
            if (byId && String(byId.role).toLowerCase() === "agent") {
              referredBy = byId.id;
            }
          }
        } catch {}
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
        ...(role === "agent" && referredBy ? { referredBy } : {}),
        ...(role === "agent"
          ? { referralCode: await generateUniqueReferralCode() }
          : {}),
      });
      const { password: _pwNew, fullName: fnNew, ...safe } = created as any;
      const mappedUser = {
        ...safe,
        id: String(safe.id),
        role: safe.role as UserRole,
        name: fnNew || safe.email.split("@")[0],
      } as any;

      // Generate JWT token
      const token = jwt.sign(
        { userId: mappedUser.id, role: mappedUser.role },
        jwtSecret,
        { expiresIn: "7d" }
      );

        res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      // Note: Referral signup bonus is credited only after admin verification, not during direct registration
      return sendSuccess(res, { token, user: mappedUser }, "OAuth registration finalized");
    } catch (error) {
      console.error("register-oauth error:", error);
      return sendError(res, 500, "Internal server error");
    }
  });

  // Agent: referral summary
  app.get(
    "/api/agent/referrals/summary",
    requireAuth,
    requireRole(["agent"]),
    async (req: any, res) => {
      try {
        const agentId = req.userId;
        // Direct sub-agents
        const direct = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(
            and(
              eq(usersTable.role, "agent"),
              eq(usersTable.referredBy, agentId)
            )
          );
        const directIds = direct.map((d: { id: string }) => d.id);

        // Indirect sub-agents (level 2)
        let indirectCount = 0;
        if (directIds.length > 0) {
          const indirect = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(
              and(
                eq(usersTable.role, "agent"),
                inArray(usersTable.referredBy as any, directIds)
              )
            );
          indirectCount = indirect.length;
        }

        // Earnings
        const [lvl1] = await db
          .select({ total: sql`COALESCE(SUM(${agentCommissions.amount}), 0)` })
          .from(agentCommissions)
          .where(
            and(
              eq(agentCommissions.agentId, agentId),
              eq(agentCommissions.level, 1)
            )
          );
        const [lvl2] = await db
          .select({ total: sql`COALESCE(SUM(${agentCommissions.amount}), 0)` })
          .from(agentCommissions)
          .where(
            and(
              eq(agentCommissions.agentId, agentId),
              eq(agentCommissions.level, 2)
            )
          );

        const total = Number(lvl1?.total || 0) + Number(lvl2?.total || 0);
        sendSuccess(res, {
          directCount: direct.length,
          indirectCount,
          level1Earnings: Number(lvl1?.total || 0),
          level2Earnings: Number(lvl2?.total || 0),
          totalEarnings: total,
          payoutThreshold: 5000,
        });
      } catch (e) {
        console.error("/api/agent/referrals/summary error:", e);
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Agent: referral network
  app.get(
    "/api/agent/referrals/network",
    requireAuth,
    requireRole(["agent"]),
    async (req: any, res) => {
      try {
        const agentId = req.userId;
        const direct = await db
          .select({
            id: usersTable.id,
            email: usersTable.email,
            fullName: usersTable.fullName,
            createdAt: usersTable.createdAt,
            isVerified: usersTable.isVerified,
          })
          .from(usersTable)
          .where(
            and(
              eq(usersTable.role, "agent"),
              eq(usersTable.referredBy, agentId)
            )
          );
        const directIds = direct.map((d: { id: string }) => d.id);
        let indirect: any[] = [];
        if (directIds.length > 0) {
          indirect = await db
            .select({
              id: usersTable.id,
              email: usersTable.email,
              fullName: usersTable.fullName,
              createdAt: usersTable.createdAt,
              parentId: usersTable.referredBy,
              isVerified: usersTable.isVerified,
            })
            .from(usersTable)
            .where(
              and(
                eq(usersTable.role, "agent"),
                inArray(usersTable.referredBy as any, directIds)
              )
            );
        }
        sendSuccess(res, { direct, indirect });
      } catch (e) {
        console.error("/api/agent/referrals/network error:", e);
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Agent: referral commissions list
  app.get(
    "/api/agent/referrals/commissions",
    requireAuth,
    requireRole(["agent"]),
    async (req: any, res) => {
      try {
        const agentId = req.userId;
        // Referral commissions where this agent is parent (levels 1/2)
        const referralRows = await db
          .select({
            id: agentCommissions.id,
            amount: agentCommissions.amount,
            level: agentCommissions.level,
            status: agentCommissions.status,
            createdAt: agentCommissions.createdAt,
            sourceAgentId: agentCommissions.sourceAgentId,
          })
          .from(agentCommissions)
          .where(eq(agentCommissions.agentId, agentId))
          .orderBy(desc(agentCommissions.createdAt));

        // Direct commissions from subscription payments processed by this agent
        const directRows = await db
          .select({
            id: subscriptionPayments.id,
            amount: subscriptionPayments.agentCommission,
            status: subscriptionPayments.status,
            createdAt: subscriptionPayments.createdAt,
          })
          .from(subscriptionPayments)
          .where(
            and(
              eq(subscriptionPayments.agentId, agentId),
              eq(subscriptionPayments.status, "completed")
            )
          )
          .orderBy(desc(subscriptionPayments.createdAt));

        const normalizedDirect = (directRows as any[]).map((r) => ({
          id: r.id,
          amount: r.amount, // already a string (decimal) per schema
          level: 0 as 0, // denote direct commission
          status: r.status,
          createdAt: r.createdAt,
          sourceAgentId: null as any,
        }));

        const combined = [...(referralRows as any[]), ...normalizedDirect].sort(
          (a, b) =>
            new Date(b.createdAt as any).getTime() -
            new Date(a.createdAt as any).getTime()
        );

        sendSuccess(res, combined);
      } catch (e) {
        console.error("/api/agent/referrals/commissions error:", e);
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Facebook OAuth 2.0
  app.get("/api/auth/oauth/facebook", async (req, res) => {
    try {
      const clientId = process.env.FACEBOOK_APP_ID;
      const redirectUri =
        process.env.FACEBOOK_REDIRECT_URI ||
        `${req.protocol}://${req.get("host")}/api/auth/oauth/facebook/callback`;
      const state = req.query.state?.toString() || "";
      if (!clientId) {
        return sendError(res, 500, "Facebook OAuth not configured: missing FACEBOOK_APP_ID");
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
      sendError(res, 500, "Failed to initiate Facebook OAuth");
    }
  });

  app.get("/api/auth/oauth/facebook/callback", async (req, res) => {
    try {
      const code = req.query.code as string | undefined;
      if (!code) {
        return sendError(res, 400, "Missing authorization code");
      }

      const clientId = process.env.FACEBOOK_APP_ID!;
      const clientSecret = process.env.FACEBOOK_APP_SECRET!;
      const redirectUri =
        process.env.FACEBOOK_REDIRECT_URI ||
        `${req.protocol}://${req.get("host")}/api/auth/oauth/facebook/callback`;
      if (!clientId || !clientSecret) {
        return sendError(res, 500, "Facebook OAuth not configured");
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
        return sendError(res, 502, "Failed to exchange code");
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
        return sendError(res, 502, "Failed to fetch user info");
      }
      const profile: any = await userInfoResp.json();

      const email: string = profile.email;
      const name: string =
        profile.name || (email ? email.split("@")[0] : "Facebook User");

      if (!email) {
        return sendError(res, 400, "Email permission required");
      }

      const frontendBase =
        process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;

      // Check if user already exists
      let user = await storage.getUserByEmail(email);

      if (!user) {
        // New user — issue a short-lived pending token and redirect to
        // the register page so the user can choose their role.
        const pendingToken = jwt.sign(
          {
            kind: "oauth_pending",
            provider: "facebook",
            email,
            name,
          },
          jwtSecret,
          { expiresIn: "15m" }
        );

        const registerUrl = `${frontendBase}/register?oauth=facebook&email=${encodeURIComponent(
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

      // Existing user — issue a 7-day JWT and redirect to oauth-complete
      const displayName = user.fullName || user.email.split("@")[0];

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

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
        domain:
          process.env.NODE_ENV === "production" ? ".nyambika.com" : undefined,
      });

      const frontendUserData = {
        id: user.id,
        email: user.email,
        fullName: displayName,
        role: user.role || "customer",
        isVerified: user.isVerified || false,
      };

      const redirectUrl = new URL(`${frontendBase}/auth/oauth-complete`);
      redirectUrl.searchParams.set(
        "user",
        encodeURIComponent(JSON.stringify(frontendUserData))
      );
      redirectUrl.hash = `#token=${encodeURIComponent(token)}`;

      const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script>
      const userData = ${JSON.stringify(frontendUserData)};
      sessionStorage.setItem('user', JSON.stringify(userData));
      window.location.href = ${JSON.stringify(redirectUrl.toString())};
    </script>
  </head>
  <body>
    <p>Redirecting to Nyambika...</p>
    <script>
      setTimeout(function() {
        window.location.href = ${JSON.stringify(redirectUrl.toString())};
      }, 1000);
    </script>
  </body>
</html>`;
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      console.error("Facebook OAuth callback error:", error);
      sendError(res, 500, "Authentication failed");
    }
  });

  // Update product (admin or owning producer)
  app.put("/api/products/:id", requireAuth, async (req: any, res) => {
    try {
      const existing = await storage.getProduct(req.params.id);
      if (!existing)
        return sendError(res, 404, "Product not found");

      // Authorization: admin can update any, producer only their own
      const isAdmin = req.userRole === "admin";
      const isOwner =
        req.userRole === "producer" && existing.producerId === req.userId;
      if (!isAdmin && !isOwner) {
        return sendError(res, 403, "Insufficient permissions");
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
        return sendError(res, 404, "Product not found");
      sendSuccess(res, product, "Product updated successfully");
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, 400, "Validation error", error.errors);
      }
      console.error("Error updating product:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Delete product (admin or owning producer)
  app.delete("/api/products/:id", requireAuth, async (req: any, res) => {
    try {
      const existing = await storage.getProduct(req.params.id);
      if (!existing)
        return sendError(res, 404, "Product not found");

      const isAdmin = req.userRole === "admin";
      const isOwner =
        req.userRole === "producer" && existing.producerId === req.userId;
      if (!isAdmin && !isOwner) {
        return sendError(res, 403, "Insufficient permissions");
      }

      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      sendError(res, 500, "Internal server error");
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
          return sendError(res, 400, "Invalid email format");
        }
        const existing = await storage.getUserByEmail(trimmed);
        if (existing && existing.id !== req.userId) {
          return sendError(res, 400, "Email already in use by another account");
        }
        updateData.email = trimmed;
        // Keep username aligned with email for this app
        updateData.username = trimmed;
      }

      const user = await storage.updateUser(req.userId, updateData);
      if (!user) {
        return sendError(res, 404, "User not found");
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

      sendSuccess(res, mappedUser);
    } catch (error) {
      console.error("Update profile error:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Change password
  app.post("/api/auth/change-password", requireAuth, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        return sendError(res, 400, "currentPassword and newPassword are required");
      }

      // Basic password policy
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return sendError(res, 400, "New password must be at least 8 characters long");
      }

      const user = await storage.getUserById(req.userId);
      if (!user) {
        return sendError(res, 404, "User not found");
      }
      if (!user.password) {
        return sendError(res, 400, "Password change not available for this account type");
      }

      const matches = await bcrypt.compare(currentPassword, user.password);
      if (!matches) {
        return sendError(res, 401, "Current password is incorrect");
      }

      if (currentPassword === newPassword) {
        return sendError(res, 400, "New password must be different from current password");
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      const updated = await storage.updateUser(req.userId, {
        password: hashed,
      } as any);
      if (!updated) {
        return sendError(res, 500, "Failed to update password");
      }

      sendSuccess(res, null, "Password updated successfully");
    } catch (error) {
      console.error("Change password error:", error);
      sendError(res, 500, "Internal server error");
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
          // User might already exist, ignore
        }
      }

      sendSuccess(res, {
        users: createdUsers,
      }, "Demo users seeded successfully");
    } catch (error) {
      console.error("Error seeding demo users:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Categories routes
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      sendSuccess(res, categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return sendError(res, 404, "Category not found");
      }
      sendSuccess(res, category);
    } catch (error) {
      console.error("Error fetching category:", error);
      sendError(res, 500, "Internal server error");
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
        sendSuccess(res, category, "Category created successfully", 201);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(res, 400, "Validation error", error.errors);
        }
        console.error("Error creating category:", error);
        sendError(res, 500, "Internal server error");
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
          return sendError(res, 404, "Category not found");
        }
        sendSuccess(res, category, "Category updated successfully");
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(res, 400, "Validation error", error.errors);
        }
        console.error("Error updating category:", error);
        sendError(res, 500, "Internal server error");
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
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Function to crop product image specifically
  async function cropProductImage(imageUrl: string): Promise<string> {
    try {
      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      // Create temp file for processing
      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempInputPath = path.join(
        tempDir,
        `temp-product-${Date.now()}.jpg`
      );
      const tempOutputPath = path.join(
        tempDir,
        `temp-product-cropped-${Date.now()}.jpg`
      );

      // Write buffer to temp file
      fs.writeFileSync(tempInputPath, imageBuffer);

      try {
        // Process the image (compress and crop)
        const result = await processImage(tempInputPath, tempOutputPath);

        if (result.success && result.outputPath) {
          // For now, we'll return the original URL since we can't easily upload to the same storage
          // In a real implementation, you'd upload the processed image and return the new URL
          return imageUrl; // Return original URL for now
        } else {
          console.error("Image processing failed:", result.error);
          return imageUrl; // Return original URL on failure
        }
      } finally {
        // Clean up temp files
        try {
          if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        } catch (cleanupError) {
          console.warn("Failed to clean up temp files:", cleanupError);
        }
      }
    } catch (error) {
      console.error("Error cropping product image:", error);
      return imageUrl; // Return original URL on error
    }
  }

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
          return sendError(res, 400, "Missing required fields");
        }

        // Enforce subscription plan maxProducts for producers (admins bypass)
        try {
          if (req.userRole === "producer") {
            // Find active subscription for this producer
            const activeSubs = await db
              .select()
              .from(subscriptions)
              .where(
                and(
                  eq(subscriptions.userId, req.userId),
                  eq(subscriptions.status, "active")
                )
              )
              .limit(1);
            let maxProductsLimit: number | null = null;
            if (activeSubs && activeSubs[0]) {
              const planId = (activeSubs[0] as any).planId as string;
              if (planId) {
                const plans = await db
                  .select()
                  .from(subscriptionPlans)
                  .where(eq(subscriptionPlans.id, planId))
                  .limit(1);
                if (plans && plans[0]) {
                  const mp = (plans[0] as any).maxProducts;
                  maxProductsLimit =
                    typeof mp === "number"
                      ? mp
                      : parseInt(String(mp || 0), 10) || 0;
                }
              }
            }
            // If no active subscription found, treat as zero allowed (block creation)
            if (maxProductsLimit === null) maxProductsLimit = 0;

            if (maxProductsLimit > 0) {
              // Count current products for this producer
              const current = await db
                .select({ id: products.id })
                .from(products)
                .where(eq(products.producerId, req.userId));
              const currentCount = current.length;
              if (currentCount >= maxProductsLimit) {
                return sendError(res, 403, `Product limit reached for your current plan. Max allowed products: ${maxProductsLimit}. Please remove some products or upgrade your plan.`, {
                  code: "PRODUCT_LIMIT_REACHED",
                  maxProducts: maxProductsLimit,
                  currentProducts: currentCount,
                });
              }
            }
          }
        } catch (limitErr) {
          console.warn(
            "Failed to evaluate product limit: ",
            (limitErr as any)?.message || limitErr
          );
          // Do not block creation on evaluation error; proceed gracefully
        }

        // Crop the main product image
        const croppedImageUrl = await cropProductImage(imageUrl);

        const productData = {
          name,
          nameRw,
          description,
          price: price.toString(),
          categoryId,
          producerId: req.userId,
          imageUrl: croppedImageUrl,
          additionalImages: additionalImages || [],
          sizes: sizes || [],
          colors: colors || [],
          stockQuantity: stockQuantity || 0,
          inStock: (stockQuantity || 0) > 0,
          isApproved: req.userRole === "admin", // Auto-approve for admins
        };

        const product = await storage.createProduct(productData);
        sendSuccess(res, product, "Product created successfully", 201);
      } catch (error) {
        console.error("Error creating product:", error);
        sendError(res, 500, "Internal server error");
      }
    }
  );

  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, category, search, limit, offset, page, producerId } = req.query;
      
      const parsedLimit = limit ? parseInt(limit as string) : 30;
      let parsedOffset = offset ? parseInt(offset as string) : 0;
      
      // Support page-based pagination
      if (page && !offset) {
        const pageNum = parseInt(page as string);
        parsedOffset = (pageNum - 1) * parsedLimit;
      }

      const options = {
        categoryId: (categoryId || category) as string,
        search: search as string,
        limit: parsedLimit,
        offset: parsedOffset,
        producerId: producerId as string,
      };

      const [list, totalCount] = await Promise.all([
        storage.getProducts(options),
        storage.getProductsCount(options)
      ]);

      let finalProducts = list;

      // If listing products for a specific producer, enforce plan maxProducts by slicing
      if (options.producerId) {
        try {
          let maxProductsLimit = 0;
          const activeSubs = await db
            .select()
            .from(subscriptions)
            .where(
              and(
                eq(subscriptions.userId, options.producerId),
                eq(subscriptions.status, "active")
              )
            )
            .limit(1);
          if (activeSubs && activeSubs[0]) {
            const planId = (activeSubs[0] as any).planId as string;
            if (planId) {
              const plans = await db
                .select()
                .from(subscriptionPlans)
                .where(eq(subscriptionPlans.id, planId))
                .limit(1);
              if (plans && plans[0]) {
                const mp = (plans[0] as any).maxProducts;
                maxProductsLimit =
                  typeof mp === "number"
                    ? mp
                    : parseInt(String(mp || 0), 10) || 0;
              }
            }
          }

          if (
            maxProductsLimit > 0 &&
            Array.isArray(list) &&
            (parsedOffset + list.length) > maxProductsLimit
          ) {
            // Calculate how many products from THIS page are allowed
            const allowedOnThisPage = Math.max(0, maxProductsLimit - parsedOffset);
            finalProducts = list.slice(0, allowedOnThisPage);
          }
        } catch (e) {
          console.warn("Failed to enforce listing limit: ", e);
        }
      }

      // Return structured response for infinite scroll support
      sendSuccess(res, {
        products: finalProducts,
        totalCount,
        hasNextPage: parsedOffset + parsedLimit < totalCount,
        limit: parsedLimit,
        offset: parsedOffset
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product)
        return sendError(res, 404, "Product not found");
      sendSuccess(res, product, "Product retrieved successfully");
    } catch (error) {
      console.error("Error fetching product:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      sendSuccess(res, product, "Product created successfully", 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, 400, "Validation error", error.errors);
      }
      console.error("Error creating product:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return sendError(res, 404, "User not found");
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      sendSuccess(res, userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      sendSuccess(res, userWithoutPassword, "User created successfully", 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, 400, "Validation error", error.errors);
      }
      console.error("Error creating user:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return sendError(res, 404, "User not found");
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      sendSuccess(res, userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, 400, "Validation error", error.errors);
      }
      console.error("Error updating user:", error);
      sendError(res, 500, "Internal server error");
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
      sendSuccess(res, withCompany);
    } catch (error) {
      console.error("Error fetching producers:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.get("/api/producers/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user || user.role !== "producer")
        return sendError(res, 404, "Producer not found");
      const { password, ...safe } = user as any;
      sendSuccess(res, safe);
    } catch (error) {
      console.error("Error fetching producer:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.get("/api/producers/:id/products", async (req, res) => {
    try {
      const products = await storage.getProducts({ producerId: req.params.id });
      sendSuccess(res, products);
    } catch (error) {
      console.error("Error fetching producer products:", error);
      sendError(res, 500, "Internal server error");
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
          return sendError(res, 404, "Company not found");
        }
        sendSuccess(res, company);
      } catch (error) {
        console.error("Error fetching company:", error);
        sendError(res, 500, "Internal server error");
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
          return sendError(res, 409, "Company already exists. Use update instead.");
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
        sendSuccess(res, company, "Company created successfully", 201);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(res, 400, "Validation error", error.errors);
        }
        console.error("Error creating company:", error);
        sendError(res, 500, "Internal server error");
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
          return sendError(res, 404, "Company not found");
        }
        sendSuccess(res, updated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return sendError(res, 400, "Validation error", error.errors);
        }
        console.error("Error updating company:", error);
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Get company by ID for store page (must be before generic /api/companies route)
  app.get("/api/companies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const company = await storage.getCompanyById(id);

      if (!company) {
        return sendError(res, 404, "Company not found");
      }

      sendSuccess(res, company);
    } catch (error) {
      console.error("Error fetching company:", error);
      sendError(res, 500, "Failed to fetch company");
    }
  });

  // Get products by company ID for store page
  app.get("/api/companies/:id/products", async (req, res) => {
    try {
      const { id } = req.params;

      // First verify company exists
      const company = await storage.getCompanyById(id);
      if (!company) {
        return sendError(res, 404, "Company not found");
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
          return sendError(res, 403, "Producer subscription inactive. Store temporarily unavailable.");
        }
      } catch (e) {
        console.error("Subscription check failed:", e);
        return sendError(res, 500, "Failed to verify subscription for this store");
      }

      // Get products with category information for this company
      const companyProducts = await storage.getProductsByCompanyId(id);

      sendSuccess(res, companyProducts);
    } catch (error) {
      console.error("Error fetching company products:", error);
      sendError(res, 500, "Failed to fetch company products");
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
        return sendSuccess(res, company ? [company] : []);
      }
      const companies = await storage.getCompanies();
      sendSuccess(res, companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  // Cart routes
  app.get("/api/cart", requireAuth, async (req: any, res) => {
    try {
      const cartItems = await storage.getCartItems(req.userId);
      sendSuccess(res, cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.post("/api/cart", requireAuth, async (req: any, res) => {
    try {
      const addToCartSchema = z.object({
        productId: z.string().min(1, "productId is required"),
        quantity: z.coerce.number().int().positive().default(1),
        size: z.string().optional().nullable(),
        color: z.string().optional().nullable(),
      });

      const parsed = addToCartSchema.parse(req.body || {});
      const payload = {
        userId: req.userId as string,
        productId: parsed.productId,
        quantity: parsed.quantity,
        size: parsed.size ?? "",
        color: parsed.color ?? "",
      } as const;

      const cartItem = await storage.addToCart(payload as any);
      sendSuccess(res, cartItem, "Item added to cart", 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, 400, "Validation error", error.errors);
      }
      console.error("Error adding to cart:", error);
      sendError(res, 500, "Internal server error");
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
        return sendError(res, 404, "Cart item not found");
      }
      sendSuccess(res, cartItem, "Item added to cart");
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, 400, "Validation error", error.errors);
      }
      console.error("Error updating cart item:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.delete("/api/cart/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from cart:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.delete("/api/cart", requireAuth, async (req: any, res) => {
    try {
      await storage.clearCart(req.userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing cart:", error);
      sendError(res, 500, "Internal server error");
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

      sendSuccess(res, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      sendError(res, 500, "Error creating payment intent", error.message);
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
        sendError(res, 500, "Failed to fetch producer orders");
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
          return sendError(res, 400, "Status is required");
        }

        const order = await storage.updateOrderStatus(req.params.id, status);
        if (!order) {
          return sendError(res, 404, "Order not found");
        }
        sendSuccess(res, order);
      } catch (error) {
        console.error("Error updating order status:", error);
        sendError(res, 500, "Failed to update order status");
      }
    }
  );

  // Favorites routes
  app.get("/api/favorites", requireAuth, async (req: any, res) => {
    try {
      const favorites = await storage.getFavorites(req.userId);
      sendSuccess(res, favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      sendError(res, 500, "Internal server error");
    }
  });

  app.post("/api/favorites", requireAuth, async (req: any, res) => {
    try {
      const validatedData = insertFavoriteSchema.parse({
        ...req.body,
        userId: req.userId,
      });
      const favorite = await storage.addToFavorites(validatedData);
      sendSuccess(res, favorite, "Added to favorites", 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendError(res, 400, "Validation error", error.errors);
      }
      console.error("Error adding to favorites:", error);
      sendError(res, 500, "Internal server error");
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
        sendError(res, 500, "Internal server error");
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
        sendSuccess(res, { isFavorite });
      } catch (error) {
        console.error("Error checking favorite status:", error);
        sendError(res, 500, "Internal server error");
      }
    }
  );

  // Try-on sessions routes are now handled by /routes/try-on.ts

  // AI Try-on processing endpoint
  app.post(
    "/api/try-on-sessions/:id/process",
    requireAuth,
    async (req: any, res) => {
      try {
        const session = await storage.getTryOnSession(req.params.id);
        if (!session) {
          return sendError(res, 404, "Try-on session not found");
        }

        const product = await storage.getProduct(session.productId!);
        if (!product) {
          return sendError(res, 404, "Product not found");
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
          measurements
        );

        if (result.success) {
          await storage.updateTryOnSession(req.params.id, {
            status: "completed",
            tryOnImageUrl: result.tryOnImageUrl,
            fitRecommendation: JSON.stringify(result.recommendations),
          });
          sendSuccess(res, {
            tryOnImageUrl: result.tryOnImageUrl,
            recommendations: result.recommendations,
          }, "Try-on completed successfully");
        } else {
          await storage.updateTryOnSession(req.params.id, { status: "failed" });
          sendError(res, 500, result.error || "Try-on processing failed");
        }
      } catch (error) {
        console.error("Error processing try-on session:", error);
        await storage.updateTryOnSession(req.params.id, { status: "failed" });
        sendError(res, 500, "Internal server error", error);
      }
    }
  );

  // AI Fashion analysis endpoint
  app.post("/api/ai/analyze-fashion", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return sendError(res, 400, "Image data is required");
      }

      const analysis = await analyzeFashionImage(imageBase64);
      sendSuccess(res, analysis);
    } catch (error) {
      console.error("Error analyzing fashion image:", error);
      sendError(res, 500, "Failed to analyze image", error);
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
        sendSuccess(res, recommendation);
      } catch (error) {
        console.error("Error generating size recommendation:", error);
        sendError(res, 500, "Failed to generate size recommendation", error);
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
      sendSuccess(res, { query: q, results: products });
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

  // ============= MY OUTFIT ROOM API ROUTES =============

  // Outfit Collections
  app.get("/api/outfit-collections", requireAuth, async (req: any, res) => {
    try {
      const collections = await storage.getOutfitCollections(req.userId);
      sendSuccess(res, collections);
    } catch (error) {
      console.error("Error fetching outfit collections:", error);
      sendError(res, 500, "Failed to fetch outfit collections", error);
    }
  });

  app.get("/api/outfit-collections/:id", requireAuth, async (req: any, res) => {
    try {
      const collection = await storage.getOutfitCollection(req.params.id);
      if (!collection) {
        return sendError(res, 404, "Outfit collection not found");
      }
      // Verify ownership
      if (collection.userId !== req.userId) {
        return sendError(res, 403, "Access denied");
      }
      sendSuccess(res, collection);
    } catch (error) {
      console.error("Error fetching outfit collection:", error);
      sendError(res, 500, "Failed to fetch outfit collection", error);
    }
  });

  app.post("/api/outfit-collections", requireAuth, async (req: any, res) => {
    try {
      const collectionData = {
        ...req.body,
        userId: req.userId,
      };
      const collection = await storage.createOutfitCollection(collectionData);
      sendSuccess(res, collection, "Outfit collection created successfully", 201);
    } catch (error) {
      console.error("Error creating outfit collection:", error);
      sendError(res, 500, "Failed to create outfit collection", error);
    }
  });

  app.put("/api/outfit-collections/:id", requireAuth, async (req: any, res) => {
    try {
      // Verify ownership
      const existing = await storage.getOutfitCollection(req.params.id);
      if (!existing) {
        return sendError(res, 404, "Outfit collection not found");
      }
      if (existing.userId !== req.userId) {
        return sendError(res, 403, "Access denied");
      }

      const updated = await storage.updateOutfitCollection(
        req.params.id,
        req.body
      );
      sendSuccess(res, updated, "Outfit collection updated successfully");
    } catch (error) {
      console.error("Error updating outfit collection:", error);
      sendError(res, 500, "Failed to update outfit collection", error);
    }
  });

  app.delete(
    "/api/outfit-collections/:id",
    requireAuth,
    async (req: any, res) => {
      try {
        // Verify ownership
        const existing = await storage.getOutfitCollection(req.params.id);
        if (!existing) {
          return res
            .status(404)
            .json({ message: "Outfit collection not found" });
        }
        if (existing.userId !== req.userId) {
          return sendError(res, 403, "Access denied");
        }

        await storage.deleteOutfitCollection(req.params.id);
        sendSuccess(res, null, "Outfit collection deleted successfully");
      } catch (error) {
        console.error("Error deleting outfit collection:", error);
        res.status(500).json({ message: "Failed to delete outfit collection" });
      }
    }
  );

  // Outfit Items
  app.post("/api/outfit-items", requireAuth, async (req: any, res) => {
    try {
      // Verify outfit ownership
      const outfit = await storage.getOutfitCollection(req.body.outfitId);
      if (!outfit) {
        return res.status(404).json({ message: "Outfit collection not found" });
      }
      if (outfit.userId !== req.userId) {
        return sendError(res, 403, "Access denied");
      }

      const item = await storage.addItemToOutfit(req.body);
      sendSuccess(res, item, "Item added to outfit", 201);
    } catch (error) {
      console.error("Error adding item to outfit:", error);
      sendError(res, 500, "Failed to add item to outfit", error);
    }
  });

  app.delete("/api/outfit-items/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.removeItemFromOutfit(req.params.id);
      sendSuccess(res, null, "Item removed from outfit successfully");
    } catch (error) {
      console.error("Error removing item from outfit:", error);
      sendError(res, 500, "Failed to remove item from outfit", error);
    }
  });

  // User Style Profile
  app.get("/api/style-profile", requireAuth, async (req: any, res) => {
    try {
      let profile = await storage.getUserStyleProfile(req.userId);

      // Create default profile if it doesn't exist
      if (!profile) {
        profile = await storage.createUserStyleProfile({
          userId: req.userId,
          favoriteColors: [],
          favoriteCategories: [],
          preferredBrands: [],
          stylePreferences: JSON.stringify({}),
          aiInsights: JSON.stringify({}),
        });
      }

      sendSuccess(res, profile);
    } catch (error) {
      console.error("Error fetching style profile:", error);
      sendError(res, 500, "Failed to fetch style profile", error);
    }
  });

  app.put("/api/style-profile", requireAuth, async (req: any, res) => {
    try {
      const updated = await storage.updateUserStyleProfile(
        req.userId,
        req.body
      );
      sendSuccess(res, updated, "Style profile updated successfully");
    } catch (error) {
      console.error("Error updating style profile:", error);
      sendError(res, 500, "Failed to update style profile", error);
    }
  });

  // AI-Powered Recommendations
  app.get("/api/outfit-recommendations", requireAuth, async (req: any, res) => {
    try {
      // Get user's try-on history
      const tryOnSessions = await storage.getTryOnSessions(req.userId);
      const styleProfile = await storage.getUserStyleProfile(req.userId);

      // Analyze user preferences from history
      const categoryFrequency: Record<string, number> = {};
      const colorPreferences: Record<string, number> = {};

      for (const session of tryOnSessions) {
        if (session.productId) {
          const product = await storage.getProduct(String(session.productId));
          if (product) {
            // Track category preferences
            if (product.categoryId) {
              const catId = String(product.categoryId);
              categoryFrequency[catId] = (categoryFrequency[catId] || 0) + 1;
            }
            // Track color preferences
            if (product.colors && Array.isArray(product.colors)) {
              product.colors.forEach((color: string) => {
                colorPreferences[color] = (colorPreferences[color] || 0) + 1;
              });
            }
          }
        }
      }

      // Boost categories and colors from style profile
      if (styleProfile) {
        if (
          styleProfile.favoriteCategories &&
          Array.isArray(styleProfile.favoriteCategories)
        ) {
          styleProfile.favoriteCategories.forEach((catId: string) => {
            categoryFrequency[catId] = (categoryFrequency[catId] || 0) + 5; // Weight boost for explicit preferences
          });
        }
        if (
          styleProfile.favoriteColors &&
          Array.isArray(styleProfile.favoriteColors)
        ) {
          styleProfile.favoriteColors.forEach((color: string) => {
            colorPreferences[color] = (colorPreferences[color] || 0) + 5; // Weight boost for explicit preferences
          });
        }
      }

      // Get top categories
      const topCategories = Object.entries(categoryFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([catId]) => catId);

      // Get recommended products
      const recommendations = await storage.getProducts({
        limit: 20,
        categoryId: topCategories[0],
      });

      sendSuccess(res, {
        recommendations,
        insights: {
          topCategories: Object.entries(categoryFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5),
          favoriteColors: Object.entries(colorPreferences)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5),
          totalTryOns: tryOnSessions.length,
        },
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      sendError(res, 500, "Failed to generate recommendations", error);
    }
  });

  // Style Analytics
  app.get("/api/style-analytics", requireAuth, async (req: any, res) => {
    try {
      const tryOnSessions = await storage.getTryOnSessions(req.userId);
      const favorites = await storage.getFavorites(req.userId);
      const outfitCollections = await storage.getOutfitCollections(req.userId);

      // Calculate style metrics
      const categoryBreakdown: Record<string, number> = {};
      const monthlyActivity: Record<string, number> = {};

      for (const session of tryOnSessions) {
        if (session.productId) {
          const product = await storage.getProduct(String(session.productId));
          if (product && product.categoryId) {
            const catId = String(product.categoryId);
            categoryBreakdown[catId] = (categoryBreakdown[catId] || 0) + 1;
          }
        }

        // Track monthly activity
        const month = new Date(session.createdAt || Date.now())
          .toISOString()
          .slice(0, 7);
        monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
      }

      sendSuccess(res, {
        totalTryOns: tryOnSessions.length,
        totalFavorites: favorites.length,
        totalOutfits: outfitCollections.length,
        categoryBreakdown,
        monthlyActivity,
        recentActivity: tryOnSessions.slice(0, 10),
      });
    } catch (error) {
      console.error("Error fetching style analytics:", error);
      sendError(res, 500, "Failed to fetch style analytics", error);
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    sendSuccess(res, {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Nyambika AI Fashion Platform API",
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
