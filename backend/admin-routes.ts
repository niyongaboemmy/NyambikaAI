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
} from "./shared/schema.dialect";
import { eq, and, desc, count, sum, sql } from "drizzle-orm";

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

    await db
      .update(users)
      .set({ isVerified: true })
      .where(eq(users.id, agentId));

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
