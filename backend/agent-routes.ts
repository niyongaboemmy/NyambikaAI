import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { db } from "./db";
import {
  users,
  companies,
  subscriptions,
  subscriptionPlans,
  subscriptionPayments,
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
} from "drizzle-orm";

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
      .where(eq(subscriptions.agentId, agentId));

    // Get active subscriptions
    const activeSubscriptions = await db
      .select({ count: countDistinct(subscriptions.id) })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.agentId, agentId),
          eq(subscriptions.status, "active")
        )
      );

    // Get expired subscriptions
    const expiredSubscriptions = await db
      .select({ count: countDistinct(subscriptions.id) })
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
      .where(eq(users.role, "producer"))
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

    const latestSubscriptions = (await db
      .select({
        userId: subscriptions.userId,
        latestSubscription: sql<Date>`MAX(${subscriptions.createdAt})`.as(
          "latest_subscription"
        ),
      })
      .from(subscriptions)
      .where(
        and(eq(subscriptions.agentId, agentId), isNotNull(subscriptions.userId))
      )
      .groupBy(subscriptions.userId)) as unknown as LatestSubscription[];

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
    await db.insert(subscriptionPayments).values({
      id: randomUUID(),
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
      const agentCommission = (Number(amount) * 0.2).toFixed(2);
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
