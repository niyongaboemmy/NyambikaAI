import { Request, Response } from "express";
import crypto from "crypto";
import { db } from "./db";
import {
  users,
  subscriptions,
  orders,
  products,
  subscriptionPayments,
  companies,
  subscriptionPlans,
  userWallets,
  walletPayments,
  paymentSettings,
  agentCommissions,
} from "./shared/schema.dialect";
import { eq, and, desc, count, sum, sql } from "drizzle-orm";

const isMySQL = String(process.env.DB_DIALECT || "postgres").toLowerCase() === "mysql";

// Minimal helpers to handle wallet credits
async function ensureUserWallet(userId: string) {
  let [wallet] = await db
    .select()
    .from(userWallets)
    .where(eq(userWallets.userId, userId))
    .limit(1);
  if (!wallet) {
    const vals: any = { id: crypto.randomUUID(), userId, balance: "0", status: "active" };
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

// Generate a unique referral code (uppercase alphanumeric), ensuring uniqueness in users table
async function generateUniqueReferralCode(length: number = 8): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars
  function randomCode() {
    let s = "";
    for (let i = 0; i < length; i++) {
      s += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return s;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    const [exists] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);
    if (!exists) return code;
  }
  // Last resort, use crypto fallback
  return crypto.randomUUID().replace(/-/g, "").slice(0, length).toUpperCase();
}

async function creditWallet(
  userId: string,
  amountNumber: number,
  description: string,
  externalReference?: string
) {
  if (!amountNumber || amountNumber <= 0) return;
  const wallet = await ensureUserWallet(userId);
  const currentBalance = Number(wallet.balance) || 0;
  const newBalance = currentBalance + amountNumber;
  const paymentVals: any = {
    id: crypto.randomUUID(),
    walletId: wallet.id,
    userId,
    type: "credit",
    amount: String(amountNumber.toFixed(2)),
    currency: "RWF",
    method: "system",
    provider: null as any,
    phone: null as any,
    status: "completed",
    externalReference: externalReference || null,
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
}

// Admin Stats Endpoint
export async function getAdminStats(_req: Request, res: Response) {
  try {
    // Get total users by role
    const totalUsers = await db.select({ count: count() }).from(users);
    const totalProducers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "producer"));
    const totalAgents = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "agent"));
    const totalCustomers = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "customer"));

    // Get total products
    const totalProducts = await db.select({ count: count() }).from(products);
    const pendingProducts = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.isApproved, false));

    // Get total orders
    const totalOrders = await db.select({ count: count() }).from(orders);
    const activeOrders = await db
      .select({ count: count() })
      .from(orders)
      .where(
        sql`${orders.status} IN ('pending', 'confirmed', 'processing', 'shipped')`
      );

    // Get subscription revenue (completed payments)
    const subscriptionRevenue = await db
      .select({
        total: sum(subscriptionPayments.amount),
      })
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.status, "completed"));

    const stats = {
      users: totalUsers[0].count,
      producers: totalProducers[0].count,
      agents: totalAgents[0].count,
      customers: totalCustomers[0].count,
      products: totalProducts[0].count,
      pendingProducts: pendingProducts[0].count,
      orders: totalOrders[0].count,
      activeOrders: activeOrders[0].count,
      subscriptionRevenue: Number(subscriptionRevenue[0].total) || 0,
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}


// Get latest subscription for a producer (admin)
export async function getProducerSubscriptionAdmin(req: Request, res: Response) {
  try {
    const { producerId } = req.params as { producerId: string };
    // Validate producer exists
    const [producer] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, producerId), eq(users.role, "producer")))
      .limit(1);
    if (!producer) {
      return res.status(404).json({ message: "Producer not found" });
    }

    // Get most recent subscription record with plan info
    const rows = await db
      .select({
        subscription: subscriptions,
        plan: subscriptionPlans,
      })
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.userId, producerId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!rows.length) {
      return res.status(404).json({ message: "No subscription found" });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching producer subscription (admin):", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Activate a producer subscription without payment (admin-only)
export async function activateProducerSubscription(req: Request, res: Response) {
  try {
    const { producerId } = req.params as { producerId: string };
    const { planId, billingCycle } = (req.body || {}) as {
      planId?: string;
      billingCycle?: "monthly" | "annual";
    };

    if (!producerId || !planId || !billingCycle) {
      return res.status(400).json({
        message: "producerId, planId and billingCycle are required",
      });
    }

    // Validate producer exists and has role 'producer'
    const [producer] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, producerId), eq(users.role, "producer")))
      .limit(1);
    if (!producer) {
      return res.status(404).json({ message: "Producer not found" });
    }

    // Validate plan
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);
    if (!plan) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    // Compute subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (billingCycle === "monthly") endDate.setMonth(endDate.getMonth() + 1);
    else endDate.setFullYear(endDate.getFullYear() + 1);

    // Determine amount based on plan and cycle (for record only; no payment required)
    const amount =
      billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice; // decimals as strings

    // Upsert subscription for this producer
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, producerId))
      .limit(1);

    if (existing) {
      await db
        .update(subscriptions)
        .set({
          planId,
          status: "active",
          billingCycle,
          startDate: startDate as any,
          endDate: endDate as any,
          amount, // record plan price, even though no payment is taken now
          paymentMethod: null,
          paymentReference: null,
        })
        .where(eq(subscriptions.id, existing.id));
    } else {
      await db.insert(subscriptions).values({
        id: crypto.randomUUID(),
        userId: producerId,
        planId,
        agentId: null,
        status: "active",
        billingCycle,
        startDate: startDate as any,
        endDate: endDate as any,
        amount,
        paymentMethod: null,
        paymentReference: null,
        autoRenew: false,
      } as any);
    }

    return res.json({
      message: "Subscription activated successfully",
      producerId,
      planId,
      billingCycle,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("Error activating producer subscription:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Get All Producers
export async function getAdminProducers(_req: Request, res: Response) {
  try {
    const producers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        businessName: users.businessName,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "producer"))
      .orderBy(desc(users.createdAt));

    res.json(producers);
  } catch (error) {
    console.error("Error fetching producers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get All Agents
export async function getAdminAgents(_req: Request, res: Response) {
  try {
    const agents = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "agent"))
      .orderBy(desc(users.createdAt));

    // Get managed producers count for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent: any) => {
        const managedProducers = await db
          .select({ count: count() })
          .from(subscriptions)
          .where(eq(subscriptions.agentId, agent.id));

        return {
          ...agent,
          managedProducers: managedProducers[0].count,
        };
      })
    );

    res.json(agentsWithStats);
  } catch (error) {
    console.error("Error fetching agents:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get All Orders for Admin
export async function getAdminOrders(_req: Request, res: Response) {
  try {
    const adminOrders = await db
      .select({
        id: orders.id,
        total: orders.total,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        customerName: users.fullName,
        customerEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.customerId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(50);

    res.json(adminOrders);
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get Pending Approvals
export async function getPendingApprovals(_req: Request, res: Response) {
  try {
    // Get pending products
    const pendingProducts = await db
      .select({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        createdAt: products.createdAt,
        producerName: users.fullName,
        producerEmail: users.email,
      })
      .from(products)
      .leftJoin(users, eq(products.producerId, users.id))
      .where(eq(products.isApproved, false))
      .orderBy(desc(products.createdAt));

    // Get unverified producers
    const unverifiedProducers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        businessName: users.businessName,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.role, "producer"), eq(users.isVerified, false)))
      .orderBy(desc(users.createdAt));

    const approvals = [
      ...pendingProducts.map((product: any) => ({
        id: product.id,
        type: "product",
        title: product.name,
        producer: product.producerName,
        submittedDate: product.createdAt?.toISOString().split("T")[0],
        priority: "medium",
        image: product.imageUrl,
      })),
      ...unverifiedProducers.map((producer: any) => ({
        id: producer.id,
        type: "producer",
        title: "Producer Application",
        producer: producer.fullName,
        businessName: producer.businessName,
        submittedDate: producer.createdAt?.toISOString().split("T")[0],
        priority: "high",
      })),
    ];

    res.json(approvals);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Approve Product
export async function approveProduct(req: Request, res: Response) {
  try {
    const { productId } = req.params;

    await db
      .update(products)
      .set({ isApproved: true })
      .where(eq(products.id, productId));

    res.json({ message: "Product approved successfully" });
  } catch (error) {
    console.error("Error approving product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Verify Producer
export async function verifyProducer(req: Request, res: Response) {
  try {
    const { producerId } = req.params;

    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, producerId));

    res.json({ message: "Producer verified successfully" });
  } catch (error) {
    console.error("Error verifying producer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Verify Agent
export async function verifyAgent(req: Request, res: Response) {
  try {
    const { agentId } = req.params;
    // Fetch current agent state to detect first-time verification and referredBy
    const [agent] = await db
      .select({ id: users.id, role: users.role, isVerified: users.isVerified, referredBy: users.referredBy, referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, agentId))
      .limit(1);

    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, agentId));

    // On first-time verification, if this agent was referred by a parent agent, credit signup bonus to parent
    if (agent && agent.isVerified === false && String(agent.role).toLowerCase() === "agent") {
      // Ensure the agent now has a referralCode for future sharing
      try {
        if (!agent.referralCode) {
          const code = await generateUniqueReferralCode();
          if (isMySQL) {
            await db.update(users).set({ referralCode: code }).where(eq(users.id, agentId)).execute();
          } else {
            await db.update(users).set({ referralCode: code }).where(eq(users.id, agentId)).returning();
          }
        }
      } catch (e) {
        console.warn("Failed to set referral code on verify:", (e as any)?.message || e);
      }

      if (agent.referredBy) {
        try {
          let bonus = 0;
          try {
            const [setting] = await db
              .select()
              .from(paymentSettings)
              .where(eq(paymentSettings.name, "agent_signup_bonus"))
              .limit(1);
            bonus = Number((setting as any)?.amountInRwf || 0) || 0;
          } catch {}
          // Default reward is 500 RWF if not configured in settings
          if (!bonus) bonus = 500;
          await creditWallet(
            agent.referredBy as string,
            bonus,
            "Agent signup referral bonus (admin verified)",
            `AG-ADMIN-VERIFY-${agentId}`
          );

          // Also record a commission row so it appears in the commissions API
          const commissionVals: any = {
            id: crypto.randomUUID(),
            agentId: agent.referredBy,
            sourceAgentId: agentId,
            subscriptionPaymentId: null,
            level: 1,
            amount: String(Number(bonus).toFixed(2)),
            status: "completed",
          };
          if (isMySQL) {
            await db.insert(agentCommissions).values(commissionVals).execute();
          } else {
            await db.insert(agentCommissions).values(commissionVals).returning();
          }
        } catch (e) {
          console.warn(
            "Failed to credit parent on admin verify:",
            (e as any)?.message || e
          );
        }
      }
    }

    res.json({ message: "Agent verified successfully" });
  } catch (error) {
    console.error("Error verifying agent:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get Producer Company details (admin)
export async function getProducerCompany(req: Request, res: Response) {
  try {
    const { producerId } = req.params;
    const rows = await db
      .select({
        id: companies.id,
        name: companies.name,
        email: companies.email,
        phone: companies.phone,
        location: companies.location,
        logoUrl: companies.logoUrl,
        websiteUrl: companies.websiteUrl,
        createdAt: companies.createdAt,
      })
      .from(companies)
      .where(eq(companies.producerId, producerId))
      .limit(1);

    if (!rows.length) {
      return res.status(404).json({ message: "Company not found for this producer" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching producer company:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
