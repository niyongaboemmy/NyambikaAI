import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { db } from "./db";
import {
  subscriptions,
  subscriptionPlans,
  subscriptionPayments,
  users,
  InsertSubscription,
} from "./shared/schema.dialect";
import { eq, and, gte, desc } from "drizzle-orm";
import { sendSuccess, sendError } from "./utils/response";


// Extend Request interface to include subscription property
interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; role: string };
  subscription?: any;
}

// Get user's active subscription
export const getUserSubscription = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const subscription = await db
      .select({
        subscription: subscriptions,
        plan: subscriptionPlans,
      })
      .from(subscriptions)
      .leftJoin(
        subscriptionPlans,
        eq(subscriptions.planId, subscriptionPlans.id)
      )
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
          gte(subscriptions.endDate, new Date())
        )
      )
      .limit(1);

    if (subscription.length === 0) {
      return sendError(res, 404, "No active subscription found");
    }

    return sendSuccess(res, subscription[0]);
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return sendError(res, 500, "Failed to fetch subscription", error);
  }
};


// Create new subscription
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const subscriptionData: InsertSubscription = req.body;

    // Calculate end date based on billing cycle
    const startDate = new Date();
    const endDate = new Date(startDate);

    if (subscriptionData.billingCycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionData.billingCycle === "annual") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscriptionId = randomUUID();

    // Drizzle ORM handles Date objects properly for PostgreSQL timestamp columns
    const { id, ...subscriptionDataWithoutId } = subscriptionData;
    await db.insert(subscriptions).values({
      id: subscriptionId,
      ...subscriptionDataWithoutId,
      startDate: startDate,
      endDate: endDate,
    });

    // Fetch the created subscription
    const newSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    return sendSuccess(res, newSubscription[0], "Subscription created successfully", 201);
  } catch (error) {
    console.error("Error creating subscription:", error);
    return sendError(res, 500, "Failed to create subscription", error);
  }
};


// Update subscription status
export const updateSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db
      .update(subscriptions)
      .set({ status })
      .where(eq(subscriptions.id, id));

    // Fetch the updated subscription
    const updatedSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (updatedSubscription.length === 0) {
      return sendError(res, 404, "Subscription not found");
    }

    return sendSuccess(res, updatedSubscription[0], "Subscription updated successfully");
  } catch (error) {
    console.error("Error updating subscription:", error);
    return sendError(res, 500, "Failed to update subscription", error);
  }
};


// Renew subscription
export const renewSubscription = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, paymentReference, agentId } = req.body;

    // Get current subscription
    const currentSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (currentSub.length === 0) {
      return sendError(res, 404, "Subscription not found");
    }

    const subscription = currentSub[0];

    // Get plan details for pricing
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscription.planId))
      .limit(1);

    if (!plan[0]) {
      return sendError(res, 404, "Subscription plan not found");
    }

    const planData = plan[0];
    const amount =
      subscription.billingCycle === "monthly"
        ? planData.monthlyPrice
        : planData.annualPrice;
    const agentCommission = agentId
      ? (parseFloat(amount) * 0.4).toString()
      : null;

    // Create payment record
    const paymentId = randomUUID();
    await db.insert(subscriptionPayments).values({
      id: paymentId,
      subscriptionId: id,
      agentId,
      amount,
      agentCommission,
      paymentMethod,
      paymentReference,
      status: "pending",
    });

    // Fetch the created payment
    const payment = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.id, paymentId))
      .limit(1);

    // Calculate new end date
    const newEndDate = new Date(subscription.endDate);
    if (subscription.billingCycle === "monthly") {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    // Update subscription
    await db
      .update(subscriptions)
      .set({
        endDate: newEndDate,
        status: "active",
        paymentMethod,
        paymentReference,
      })
      .where(eq(subscriptions.id, id));

    // Fetch the updated subscription
    const updatedSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    return sendSuccess(res, {
      subscription: updatedSubscription[0],
      payment: payment[0],
    }, "Subscription renewed successfully");
  } catch (error) {
    console.error("Error renewing subscription:", error);
    return sendError(res, 500, "Failed to renew subscription", error);
  }
};


// Get subscription payments history
export const getSubscriptionPayments = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;

    const payments = await db
      .select({
        payment: subscriptionPayments,
        agent: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
        },
      })
      .from(subscriptionPayments)
      .leftJoin(users, eq(subscriptionPayments.agentId, users.id))
      .where(eq(subscriptionPayments.subscriptionId, subscriptionId))
      .orderBy(desc(subscriptionPayments.createdAt));

    return sendSuccess(res, payments);
  } catch (error) {
    console.error("Error fetching subscription payments:", error);
    return sendError(res, 500, "Failed to fetch payments", error);
  }
};


// Get agent's managed subscriptions
export const getAgentSubscriptions = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    const subscriptionsData = await db
      .select({
        subscription: subscriptions,
        plan: subscriptionPlans,
        producer: {
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          businessName: users.businessName,
        },
      })
      .from(subscriptions)
      .leftJoin(
        subscriptionPlans,
        eq(subscriptions.planId, subscriptionPlans.id)
      )
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .where(eq(subscriptions.agentId, agentId))
      .orderBy(desc(subscriptions.createdAt));

    return sendSuccess(res, subscriptionsData);
  } catch (error) {
    console.error("Error fetching agent subscriptions:", error);
    return sendError(res, 500, "Failed to fetch agent subscriptions", error);
  }
};


// Check subscription validity
export const checkSubscriptionValidity = async (userId: string) => {
  try {
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active"),
          gte(subscriptions.endDate, new Date())
        )
      )
      .limit(1);

    return subscription.length > 0 ? subscription[0] : null;
  } catch (error) {
    console.error("Error checking subscription validity:", error);
    return null;
  }
};

// Middleware to validate producer subscription
export const validateProducerSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id; // Assuming user is attached to request

    if (!userId) {
      return sendError(res, 401, "User not authenticated");
    }


    // Check if user is a producer
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0 || user[0].role !== "producer") {
      return next(); // Not a producer, skip validation
    }

    const validSubscription = await checkSubscriptionValidity(userId);

    if (!validSubscription) {
      return sendError(res, 402, "Subscription required", {
        description: "Please subscribe to a plan to continue using producer features",
        redirectTo: "/subscription",
      });
    }


    req.subscription = validSubscription;
    next();
  } catch (error) {
    console.error("Error validating subscription:", error);
    return sendError(res, 500, "Failed to validate subscription", error);
  }
};

