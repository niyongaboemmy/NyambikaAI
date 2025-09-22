import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { db } from "./db";
import {
  users,
  companies,
  subscriptions,
  subscriptionPlans,
  subscriptionPayments,
  agentCommissions,
  users as usersTable,
  userWallets,
  walletPayments,
  paymentSettings,
  products,
  User,
} from "./shared/schema.dialect";
import {
  eq,
  and,
  desc,
  count,
  sum,
  sql,
  isNotNull,
  countDistinct,
  ne,
} from "drizzle-orm";

const isMySQL =
  String(process.env.DB_DIALECT || "postgres").toLowerCase() === "mysql";

// Ensure a wallet exists and return it
async function ensureUserWallet(userId: string) {
  let [wallet] = await db
    .select()
    .from(userWallets)
    .where(eq(userWallets.userId, userId))
    .limit(1);
  if (!wallet) {
    const vals: any = {
      id: randomUUID(),
      userId,
      balance: "0",
      status: "active",
    };
    if (isMySQL) {
      await db.insert(userWallets).values(vals).execute();
      wallet = vals as any;
    } else {
      const [created] = await db.insert(userWallets).values(vals).returning();
      wallet = created as any;
    }
  }
  return wallet as any;
}

// Credit a user's wallet and record history
async function creditWallet(
  userId: string,
  amountNumber: number,
  description: string,
  metadata?: Record<string, any>
) {
  if (!amountNumber || amountNumber <= 0) return;
  const wallet = await ensureUserWallet(userId);
  const currentBalance = Number(wallet.balance) || 0;
  const newBalance = currentBalance + amountNumber;
  const paymentVals: any = {
    id: randomUUID(),
    walletId: wallet.id,
    userId,
    type: "credit",
    amount: String(amountNumber.toFixed(2)),
    currency: "RWF",
    method: "system",
    provider: null as any,
    phone: null as any,
    status: "completed",
    externalReference: metadata?.externalReference || null,
    description,
  };
  if (isMySQL) {
    await db.insert(walletPayments).values(paymentVals).execute();
    await db
      .update(userWallets)
      .set({
        balance: String(newBalance.toFixed(2)),
        updatedAt: new Date() as any,
      })
      .where(eq(userWallets.id, wallet.id))
      .execute();
  } else {
    await db.insert(walletPayments).values(paymentVals).returning();
    await db
      .update(userWallets)
      .set({
        balance: String(newBalance.toFixed(2)),
        updatedAt: new Date() as any,
      })
      .where(eq(userWallets.id, wallet.id))
      .returning();
  }
  return { ...wallet, balance: String(newBalance.toFixed(2)) };
}

// Debit a user's wallet and record history
async function debitWallet(
  userId: string,
  amountNumber: number,
  description: string,
  metadata?: Record<string, any>
) {
  if (!amountNumber || amountNumber <= 0) return;
  const wallet = await ensureUserWallet(userId);
  const currentBalance = Number(wallet.balance) || 0;
  const newBalance = currentBalance - amountNumber;
  const paymentVals: any = {
    id: randomUUID(),
    walletId: wallet.id,
    userId,
    type: "debit",
    amount: String(amountNumber.toFixed(2)),
    currency: "RWF",
    method: "system",
    provider: null as any,
    phone: null as any,
    status: "completed",
    externalReference: metadata?.externalReference || null,
    description,
  };
  if (isMySQL) {
    await db.insert(walletPayments).values(paymentVals).execute();
    await db
      .update(userWallets)
      .set({ balance: String(newBalance.toFixed(2)), updatedAt: new Date() as any })
      .where(eq(userWallets.id, wallet.id))
      .execute();
  } else {
    await db.insert(walletPayments).values(paymentVals).returning();
    await db
      .update(userWallets)
      .set({ balance: String(newBalance.toFixed(2)), updatedAt: new Date() as any })
      .where(eq(userWallets.id, wallet.id))
      .returning();
  }
  return { ...wallet, balance: String(newBalance.toFixed(2)) };
}

// Read numeric setting amount (e.g., basis points or RWF) with a fallback
async function getSettingAmount(name: string, fallback: number) {
  try {
    const [row] = await db
      .select()
      .from(paymentSettings)
      .where(eq(paymentSettings.name, name))
      .limit(1);
    const val = Number((row as any)?.amountInRwf ?? 0);
    return isNaN(val) || val <= 0 ? fallback : val;
  } catch (_e) {
    return fallback;
  }
}

// Admin: Refund a subscription payment and reverse commissions to wallets
export async function refundSubscriptionPayment(req: Request, res: Response) {
  try {
    const paymentId = String((req.params as any)?.id || "");
    if (!paymentId)
      return res.status(400).json({ message: "Payment id is required" });

    const [pay] = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.id, paymentId))
      .limit(1);
    if (!pay) return res.status(404).json({ message: "Payment not found" });
    if (String((pay as any).status).toLowerCase() === "refunded") {
      return res.status(400).json({ message: "Payment already refunded" });
    }

    // Mark payment refunded
    if (isMySQL) {
      await db
        .update(subscriptionPayments)
        .set({ status: "refunded" } as any)
        .where(eq(subscriptionPayments.id, paymentId))
        .execute();
    } else {
      await db
        .update(subscriptionPayments)
        .set({ status: "refunded" } as any)
        .where(eq(subscriptionPayments.id, paymentId))
        .returning();
    }

    // Reverse direct agent commission
    const agentId = (pay as any).agentId as string | null;
    const directCommissionNum = Number((pay as any).agentCommission || 0);
    if (agentId && directCommissionNum > 0) {
      await debitWallet(
        agentId,
        directCommissionNum,
        "Refund reversal: subscription commission",
        { externalReference: `SUB-REFUND-${paymentId}` }
      );
    }

    // Reverse referral commissions associated with this payment
    const commRows = await db
      .select({
        id: agentCommissions.id,
        agentId: agentCommissions.agentId,
        amount: agentCommissions.amount,
      })
      .from(agentCommissions)
      .where(eq(agentCommissions.subscriptionPaymentId, paymentId));

    for (const row of commRows as any[]) {
      const amt = Number(row.amount || 0);
      if (amt > 0) {
        await debitWallet(
          row.agentId,
          amt,
          "Refund reversal: referral commission",
          { externalReference: `REF-REFUND-${row.id}` }
        );
      }
    }

    // Mark those commissions as cancelled
    if (isMySQL) {
      await db
        .update(agentCommissions)
        .set({ status: "cancelled" } as any)
        .where(eq(agentCommissions.subscriptionPaymentId, paymentId))
        .execute();
    } else {
      await db
        .update(agentCommissions)
        .set({ status: "cancelled" } as any)
        .where(eq(agentCommissions.subscriptionPaymentId, paymentId))
        .returning();
    }

    res.json({ ok: true, message: "Payment refunded and commissions reversed" });
  } catch (e) {
    console.error("refundSubscriptionPayment error:", e);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Helper: distribute referral commissions to parent (L1) and grandparent (L2)
async function distributeReferralCommissions(
  directAgentId: string,
  subscriptionPaymentId: string,
  directAgentCommissionStr: string
) {
  try {
    const directAgentCommission = Number(directAgentCommissionStr) || 0;
    if (directAgentCommission <= 0) return;

    // Fetch the direct agent's parent chain up to 2 levels
    const [directAgent] = await db
      .select({
        id: usersTable.id,
        referredBy: usersTable.referredBy,
        isActive: usersTable.isActive,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(eq(usersTable.id, directAgentId));

    if (!directAgent) return;

    // Level 1: parent of direct agent
    let parent1: any = null;
    if (directAgent.referredBy) {
      const [p1] = await db
        .select({
          id: usersTable.id,
          referredBy: usersTable.referredBy,
          isActive: usersTable.isActive,
          role: usersTable.role,
        })
        .from(usersTable)
        .where(eq(usersTable.id, directAgent.referredBy));
      parent1 = p1 || null;
    }

    // Level 2: parent of parent1
    let parent2: any = null;
    if (parent1?.referredBy) {
      const [p2] = await db
        .select({
          id: usersTable.id,
          isActive: usersTable.isActive,
          role: usersTable.role,
        })
        .from(usersTable)
        .where(eq(usersTable.id, parent1.referredBy));
      parent2 = p2 || null;
    }

    // Utility to insert commission row
    // Load dynamic percentages in basis points (10000 = 100%) with defaults 10% and 5%
    const l1bps = await getSettingAmount("agent_referral_l1_percent", 1000);
    const l2bps = await getSettingAmount("agent_referral_l2_percent", 500);

    const insertCommission = async (
      agentId: string,
      sourceAgentId: string,
      level: 1 | 2
    ) => {
      const bps = level === 1 ? l1bps : l2bps;
      const percent = Math.max(0, bps) / 10000; // convert to fraction
      const amountNum = directAgentCommission * percent;
      const amount = amountNum.toFixed(2);
      const commissionId = randomUUID();
      const vals = {
        id: commissionId,
        agentId,
        sourceAgentId,
        subscriptionPaymentId,
        level,
        amount,
        status: "pending",
      } as any;
      if (isMySQL) {
        await db.insert(agentCommissions).values(vals).execute();
      } else {
        await db.insert(agentCommissions).values(vals).returning();
      }
      // Auto-credit wallet for referral commission
      await creditWallet(agentId, amountNum, `Referral commission L${level}`, {
        externalReference: `REF-COM-${commissionId}`,
      });
    };

    // Apply constraints: active-only and role agent
    if (
      parent1 &&
      parent1.isActive !== false &&
      String(parent1.role).toLowerCase() === "agent"
    ) {
      await insertCommission(parent1.id, directAgentId, 1);
    }
    if (
      parent2 &&
      parent2.isActive !== false &&
      String(parent2.role).toLowerCase() === "agent"
    ) {
      await insertCommission(parent2.id, directAgentId, 2);
    }
  } catch (e) {
    console.error(
      "distributeReferralCommissions error:",
      (e as any)?.message || e
    );
  }
}

// Get Agent Dashboard Stats
export async function getAgentStats(req: Request, res: Response) {
  try {
    const agentId = (req.user as User)?.id;
    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get total producers managed by this agent (distinct count)
    const totalProducers = await db
      .select({ count: countDistinct(subscriptions.userId) })
      .from(subscriptions)
      .where(
        eq(subscriptions.agentId, agentId),
        ne(subscriptions.status, "pending")
      );

    // Get active subscriptions
    const activeSubscriptions = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.agentId, agentId),
          eq(subscriptions.status, "active")
        )
      );

    // Get expired subscriptions
    const expiredSubscriptions = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.agentId, agentId),
          eq(subscriptions.status, "expired")
        )
      );

    // Get total commissions earned
    const totalCommissions = await db
      .select({
        total: sum(subscriptionPayments.agentCommission),
      })
      .from(subscriptionPayments)
      .where(
        and(
          eq(subscriptionPayments.agentId, agentId),
          eq(subscriptionPayments.status, "completed")
        )
      );

    // Get monthly commissions (current month)
    const currentMonth = new Date();
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );

    const monthlyCommissions = await db
      .select({
        total: sum(subscriptionPayments.agentCommission),
      })
      .from(subscriptionPayments)
      .where(
        and(
          eq(subscriptionPayments.agentId, agentId),
          eq(subscriptionPayments.status, "completed"),
          sql`${subscriptionPayments.createdAt} >= ${startOfMonth}`
        )
      );

    // Get pending payments
    const pendingPayments = await db
      .select({ count: count() })
      .from(subscriptionPayments)
      .where(
        and(
          eq(subscriptionPayments.agentId, agentId),
          eq(subscriptionPayments.status, "pending")
        )
      );

    const stats = {
      totalProducers: totalProducers[0].count,
      activeSubscriptions: activeSubscriptions[0].count,
      expiredSubscriptions: expiredSubscriptions[0].count,
      totalCommissions: Number(totalCommissions[0].total) || 0,
      monthlyCommissions: Number(monthlyCommissions[0].total) || 0,
      pendingPayments: pendingPayments[0].count,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching agent stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get All Available Producers (for agent assignment)
export async function getAvailableProducers(req: Request, res: Response) {
  try {
    const agentId = (req.user as User)?.id;
    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get all producers that have registered companies
    const producers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        businessName: companies.name,
        phone: users.phone,
        location: users.location,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        subscriptionId: subscriptions.id,
        subscriptionStatus: subscriptions.status,
        subscriptionEndDate: subscriptions.endDate,
        subscriptionStartDate: subscriptions.startDate,
        planName: subscriptionPlans.name,
        planPrice: subscriptions.amount,
        billingCycle: subscriptions.billingCycle,
        currentAgentId: subscriptions.agentId,
        // Company information
        companyId: companies.id,
        companyName: companies.name,
        companyEmail: companies.email,
        companyPhone: companies.phone,
        companyLocation: companies.location,
        companyTin: companies.tin,
        companyLogoUrl: companies.logoUrl,
        companyWebsiteUrl: companies.websiteUrl,
        companyCreatedAt: companies.createdAt,
      })
      .from(users)
      .innerJoin(companies, eq(users.id, companies.producerId))
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .leftJoin(
        subscriptionPlans,
        eq(subscriptions.planId, subscriptionPlans.id)
      )
      .where(
        and(eq(users.role, "producer"), eq(subscriptions.status, "active"))
      )
      .orderBy(desc(users.createdAt));

    // Get product counts for each producer
    const producersWithCounts = await Promise.all(
      producers.map(async (producer: any) => {
        const productCount = await db
          .select({ count: count() })
          .from(products)
          .where(eq(products.producerId, producer.id));

        // Calculate commission earned
        const commissionData = await db
          .select({ total: sum(subscriptionPayments.agentCommission) })
          .from(subscriptionPayments)
          .leftJoin(
            subscriptions,
            eq(subscriptionPayments.subscriptionId, subscriptions.id)
          )
          .where(
            and(
              eq(subscriptions.userId, producer.id),
              eq(subscriptionPayments.agentId, agentId),
              eq(subscriptionPayments.status, "completed")
            )
          );

        return {
          ...producer,
          productsCount: productCount[0].count,
          commissionEarned: Number(commissionData[0].total) || 0,
          isAssignedToMe: producer.currentAgentId === agentId,
          canAssign:
            !producer.currentAgentId || producer.currentAgentId === agentId,
        };
      })
    );

    res.json(producersWithCounts);
  } catch (error) {
    console.error("Error fetching available producers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get Producers Managed by Agent
export async function getAgentProducers(req: Request, res: Response) {
  try {
    const agentId = (req.user as User)?.id;
    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // First, get the latest subscription for each producer
    interface LatestSubscription {
      userId: string;
      latestSubscription: Date;
    }

    // Get the most recent subscription for each producer
    const latestSubscriptionsQuery = db
      .select({
        userId: subscriptions.userId,
        latestSubscription: sql<Date>`MAX(${subscriptions.createdAt})`.as(
          "latest_subscription"
        ),
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.agentId, agentId),
          isNotNull(subscriptions.userId),
          ne(subscriptions.status, "pending")
        )
      )
      .groupBy(subscriptions.userId);

    const latestSubscriptions =
      (await latestSubscriptionsQuery) as LatestSubscription[];

    // Then get the full producer details using the latest subscription
    const producers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        businessName: users.businessName,
        phone: users.phone,
        location: users.location,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        subscriptionId: subscriptions.id,
        subscriptionStatus: subscriptions.status,
        subscriptionEndDate: subscriptions.endDate,
        subscriptionStartDate: subscriptions.startDate,
        planName: subscriptionPlans.name,
        planPrice: subscriptions.amount,
        billingCycle: subscriptions.billingCycle,
        // Company information
        companyId: companies.id,
        companyName: companies.name,
        companyEmail: companies.email,
        companyPhone: companies.phone,
        companyLocation: companies.location,
        companyTin: companies.tin,
        companyLogoUrl: companies.logoUrl,
        companyWebsiteUrl: companies.websiteUrl,
        companyCreatedAt: companies.createdAt,
      })
      .from(users)
      .innerJoin(companies, eq(users.id, companies.producerId))
      .innerJoin(
        subscriptions,
        and(
          eq(users.id, subscriptions.userId),
          eq(subscriptions.agentId, agentId),
          sql`(${users.id}, ${subscriptions.createdAt}) IN (${sql.join(
            latestSubscriptions.map(
              (ls) => sql`(${ls.userId}, ${ls.latestSubscription})`
            ),
            sql`, `
          )})`
        )
      )
      .leftJoin(
        subscriptionPlans,
        eq(subscriptions.planId, subscriptionPlans.id)
      )
      .where(eq(users.role, "producer"))
      .orderBy(desc(subscriptions.createdAt));

    // Get product counts and commission data for each producer
    const producersWithDetails = await Promise.all(
      producers.map(async (producer: any) => {
        const productCount = await db
          .select({ count: count() })
          .from(products)
          .where(eq(products.producerId, producer.id));

        const commissionData = await db
          .select({ total: sum(subscriptionPayments.agentCommission) })
          .from(subscriptionPayments)
          .leftJoin(
            subscriptions,
            eq(subscriptionPayments.subscriptionId, subscriptions.id)
          )
          .where(
            and(
              eq(subscriptions.userId, producer.id),
              eq(subscriptionPayments.agentId, agentId),
              eq(subscriptionPayments.status, "completed")
            )
          );

        const lastPayment = await db
          .select({
            amount: subscriptionPayments.amount,
            createdAt: subscriptionPayments.createdAt,
          })
          .from(subscriptionPayments)
          .leftJoin(
            subscriptions,
            eq(subscriptionPayments.subscriptionId, subscriptions.id)
          )
          .where(
            and(
              eq(subscriptions.userId, producer.id),
              eq(subscriptionPayments.agentId, agentId)
            )
          )
          .orderBy(desc(subscriptionPayments.createdAt))
          .limit(1);

        return {
          ...producer,
          productsCount: productCount[0].count,
          commissionEarned: Number(commissionData[0].total) || 0,
          lastPayment: lastPayment[0]?.createdAt || null,
          totalPaid: Number(lastPayment[0]?.amount) || 0,
        };
      })
    );

    res.json(producersWithDetails);
  } catch (error) {
    console.error("Error fetching agent producers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Process Subscription Payment
export async function processSubscriptionPayment(req: Request, res: Response) {
  try {
    const agentId = (req.user as User)?.id;
    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      producerId,
      planId,
      billingCycle,
      paymentMethod,
      paymentReference,
    } = req.body;

    // Basic validation
    if (!producerId || !planId || !billingCycle) {
      return res
        .status(400)
        .json({ message: "producerId, planId and billingCycle are required" });
    }
    if (!paymentMethod) {
      return res.status(400).json({ message: "paymentMethod is required" });
    }

    // Get the subscription plan
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!plan.length) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    const selectedPlan = plan[0];
    const amount =
      billingCycle === "monthly"
        ? selectedPlan.monthlyPrice
        : selectedPlan.annualPrice; // decimal columns are strings in Drizzle
    const agentCommission = (Number(amount) * 0.4).toFixed(2); // Drizzle decimal expects string (40% commission)

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create or update subscription
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, producerId))
      .limit(1);

    let subscriptionId: string;

    if (existingSubscription.length > 0) {
      // Update existing subscription
      await db
        .update(subscriptions)
        .set({
          planId,
          agentId,
          status: "active",
          billingCycle,
          startDate,
          endDate,
          amount, // string
          paymentMethod: paymentMethod ?? null,
        })
        .where(eq(subscriptions.id, existingSubscription[0].id));

      subscriptionId = existingSubscription[0].id;
    } else {
      // Create new subscription
      const id = randomUUID();
      await db.insert(subscriptions).values({
        id,
        userId: producerId,
        planId,
        agentId,
        status: "active",
        billingCycle,
        startDate,
        endDate,
        amount, // string
        paymentMethod: paymentMethod ?? null,
      });
      subscriptionId = id;
    }

    // Create payment record
    const paymentId = randomUUID();
    const payVals: any = {
      id: paymentId,
      subscriptionId,
      agentId,
      amount, // string
      agentCommission, // string
      paymentMethod, // required (not null)
      paymentReference: paymentReference ?? null,
      status: "completed",
    };
    if (isMySQL) {
      await db.insert(subscriptionPayments).values(payVals).execute();
    } else {
      await db.insert(subscriptionPayments).values(payVals).returning();
    }

    // Auto-credit direct agent's wallet with their commission (40%)
    const agentCommissionNum = Number(agentCommission) || 0;
    if (agentCommissionNum > 0 && agentId) {
      await creditWallet(
        agentId,
        agentCommissionNum,
        "Subscription commission (40%)",
        {
          externalReference: `SUB-COM-${paymentId}`,
        }
      );
    }

    // Distribute referral commissions to L1 (10%) and L2 (5%) of the direct agent's commission
    await distributeReferralCommissions(agentId, paymentId, agentCommission);

    res.json({
      message: "Subscription payment processed successfully",
      commission: agentCommission,
    });
  } catch (error) {
    console.error("Error processing subscription payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Assign Agent to Producer
export async function assignAgentToProducer(req: Request, res: Response) {
  try {
    const agentId = (req.user as User)?.id;
    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      producerId,
      planId: rawPlanId,
      subscriptionPlanId,
      billingCycle,
      paymentMethod,
      paymentReference,
    } = req.body;
    const planId = rawPlanId || subscriptionPlanId;
    if (!producerId) {
      return res.status(400).json({ message: "Producer ID is required" });
    }

    // Check if producer exists
    const producer = await db
      .select()
      .from(users)
      .where(and(eq(users.id, producerId), eq(users.role, "producer")))
      .limit(1);

    if (!producer.length) {
      return res.status(404).json({ message: "Producer not found" });
    }

    // If planId provided, fetch plan (for amount + dates)
    let selectedPlan: any | null = null;
    if (planId) {
      const planRows = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);
      if (!planRows.length) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      selectedPlan = planRows[0];
      if (
        !billingCycle ||
        (billingCycle !== "monthly" && billingCycle !== "annual")
      ) {
        return res.status(400).json({
          message:
            "billingCycle must be 'monthly' or 'annual' when planId is provided",
        });
      }
    }

    // Check if producer has an active subscription
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, producerId))
      .limit(1);

    // If subscription exists, update agent (and optionally plan)
    if (existingSubscription.length > 0) {
      if (selectedPlan) {
        const amount =
          billingCycle === "monthly"
            ? selectedPlan.monthlyPrice
            : selectedPlan.annualPrice;
        const startDate = new Date();
        const endDate = new Date();
        if (billingCycle === "monthly")
          endDate.setMonth(endDate.getMonth() + 1);
        else endDate.setFullYear(endDate.getFullYear() + 1);

        await db
          .update(subscriptions)
          .set({
            agentId,
            planId,
            status: "active",
            billingCycle,
            startDate,
            endDate,
            amount,
            paymentMethod:
              paymentMethod ?? existingSubscription[0].paymentMethod ?? null,
          })
          .where(eq(subscriptions.id, existingSubscription[0].id));
      } else {
        await db
          .update(subscriptions)
          .set({ agentId })
          .where(eq(subscriptions.id, existingSubscription[0].id));
      }

      return res.json({ message: "Agent assigned to producer successfully" });
    }

    // No subscription exists yet
    if (!selectedPlan) {
      // If no plan provided, require one to create subscription; otherwise previous behavior blocks assignment
      return res.status(400).json({
        message:
          "No subscription found. Provide planId and billingCycle to create and assign in one step, or use the payment endpoint.",
      });
    }

    const amount =
      billingCycle === "monthly"
        ? selectedPlan.monthlyPrice
        : selectedPlan.annualPrice;
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === "monthly") endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    const subId = randomUUID();
    await db.insert(subscriptions).values({
      id: subId,
      userId: producerId,
      planId,
      agentId,
      status: "active",
      billingCycle,
      startDate,
      endDate,
      amount,
      paymentMethod: paymentMethod ?? null,
      paymentReference: paymentReference ?? null,
    });

    // Optionally, record a payment if paymentMethod was included
    if (paymentMethod) {
      const agentCommission = (Number(amount) * 0.4).toFixed(2);
      await db.insert(subscriptionPayments).values({
        id: randomUUID(),
        subscriptionId: subId,
        agentId,
        amount,
        agentCommission,
        paymentMethod,
        paymentReference: paymentReference ?? null,
        status: "completed",
      });
    }

    return res.json({
      message: "Subscription created and agent assigned successfully",
    });
  } catch (error) {
    console.error("Error assigning agent to producer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get Producer Details for Agent
export async function getProducerDetails(req: Request, res: Response) {
  try {
    const agentId = (req.user as User)?.id;
    const { producerId } = req.params;

    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get producer details with subscription info and company details
    const producer = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        businessName: users.businessName,
        phone: users.phone,
        location: users.location,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
        subscriptionId: subscriptions.id,
        subscriptionStatus: subscriptions.status,
        subscriptionEndDate: subscriptions.endDate,
        subscriptionStartDate: subscriptions.startDate,
        planName: subscriptionPlans.name,
        planPrice: subscriptions.amount,
        billingCycle: subscriptions.billingCycle,
        // Company information
        companyId: companies.id,
        companyName: companies.name,
        companyEmail: companies.email,
        companyPhone: companies.phone,
        companyLocation: companies.location,
        companyTin: companies.tin,
        companyLogoUrl: companies.logoUrl,
        companyWebsiteUrl: companies.websiteUrl,
        companyCreatedAt: companies.createdAt,
      })
      .from(users)
      .leftJoin(companies, eq(users.id, companies.producerId))
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .leftJoin(
        subscriptionPlans,
        eq(subscriptions.planId, subscriptionPlans.id)
      )
      .where(
        and(
          eq(users.id, producerId),
          eq(users.role, "producer"),
          eq(subscriptions.agentId, agentId)
        )
      )
      .limit(1);

    if (!producer.length) {
      return res
        .status(404)
        .json({ message: "Producer not found or not assigned to you" });
    }

    // Get additional details
    const productCount = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.producerId, producerId));

    const commissionData = await db
      .select({ total: sum(subscriptionPayments.agentCommission) })
      .from(subscriptionPayments)
      .leftJoin(
        subscriptions,
        eq(subscriptionPayments.subscriptionId, subscriptions.id)
      )
      .where(
        and(
          eq(subscriptions.userId, producerId),
          eq(subscriptionPayments.agentId, agentId),
          eq(subscriptionPayments.status, "completed")
        )
      );

    const paymentHistory = await db
      .select({
        id: subscriptionPayments.id,
        amount: subscriptionPayments.amount,
        agentCommission: subscriptionPayments.agentCommission,
        paymentMethod: subscriptionPayments.paymentMethod,
        status: subscriptionPayments.status,
        createdAt: subscriptionPayments.createdAt,
      })
      .from(subscriptionPayments)
      .leftJoin(
        subscriptions,
        eq(subscriptionPayments.subscriptionId, subscriptions.id)
      )
      .where(
        and(
          eq(subscriptions.userId, producerId),
          eq(subscriptionPayments.agentId, agentId)
        )
      )
      .orderBy(desc(subscriptionPayments.createdAt));

    const result = {
      ...producer[0],
      productsCount: productCount[0].count,
      commissionEarned: Number(commissionData[0].total) || 0,
      paymentHistory,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching producer details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get Agent Commission History
export async function getAgentCommissions(req: Request, res: Response) {
  try {
    const agentId = (req.user as User)?.id;
    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const commissions = await db
      .select({
        id: subscriptionPayments.id,
        amount: subscriptionPayments.amount,
        agentCommission: subscriptionPayments.agentCommission,
        paymentMethod: subscriptionPayments.paymentMethod,
        status: subscriptionPayments.status,
        createdAt: subscriptionPayments.createdAt,
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
      .where(eq(subscriptionPayments.agentId, agentId))
      .orderBy(desc(subscriptionPayments.createdAt));

    res.json(commissions);
  } catch (error) {
    console.error("Error fetching agent commissions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
