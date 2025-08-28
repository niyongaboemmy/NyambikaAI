import { Request, Response } from "express";
import { db } from "./db";
import {
  users,
  subscriptions,
  subscriptionPlans,
  subscriptionPayments,
  User,
} from "./shared/schema";
import { eq, and, desc, count, sum, sql } from "drizzle-orm";

// Get Agent Dashboard Stats
export async function getAgentStats(req: Request, res: Response) {
  try {
    const agentId = (req.user as User)?.id;
    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get total producers managed by this agent
    const totalProducers = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(eq(subscriptions.agentId, agentId));

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

// Get Producers Managed by Agent
export async function getAgentProducers(req: Request, res: Response) {
  try {
    const agentId = (req.user as User)?.id;
    if (!agentId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const producers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        businessName: users.businessName,
        isVerified: users.isVerified,
        subscriptionStatus: subscriptions.status,
        subscriptionEndDate: subscriptions.endDate,
        planName: subscriptionPlans.name,
        planPrice: subscriptions.amount,
      })
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .leftJoin(
        subscriptionPlans,
        eq(subscriptions.planId, subscriptionPlans.id)
      )
      .where(
        and(eq(users.role, "producer"), eq(subscriptions.agentId, agentId))
      )
      .orderBy(desc(subscriptions.createdAt));

    res.json(producers);
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
      return res.status(400).json({ message: "producerId, planId and billingCycle are required" });
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
    const agentCommission = (Number(amount) * 0.2).toFixed(2); // Drizzle decimal expects string

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
      const newSubscription = await db
        .insert(subscriptions)
        .values({
          userId: producerId,
          planId,
          agentId,
          status: "active",
          billingCycle,
          startDate,
          endDate,
          amount, // string
          paymentMethod: paymentMethod ?? null,
        })
        .returning({ id: subscriptions.id });

      subscriptionId = newSubscription[0].id;
    }

    // Create payment record
    await db.insert(subscriptionPayments).values({
      subscriptionId,
      agentId,
      amount, // string
      agentCommission, // string
      paymentMethod, // required (not null)
      paymentReference: paymentReference ?? null,
      status: "completed",
    });

    res.json({
      message: "Subscription payment processed successfully",
      commission: agentCommission,
    });
  } catch (error) {
    console.error("Error processing subscription payment:", error);
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
