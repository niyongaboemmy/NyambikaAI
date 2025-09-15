import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { db } from './db';
import { subscriptions, subscriptionPlans, subscriptionPayments, users, InsertSubscription } from './shared/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

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
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
          gte(subscriptions.endDate, new Date())
        )
      )
      .limit(1);

    if (subscription.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    res.json(subscription[0]);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
};

// Create new subscription
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const subscriptionData: InsertSubscription = req.body;
    
    // Calculate end date based on billing cycle
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (subscriptionData.billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionData.billingCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscriptionId = randomUUID();
    await db
      .insert(subscriptions)
      .values({
        id: subscriptionId,
        ...subscriptionData,
        startDate,
        endDate,
      });

    // Fetch the created subscription
    const newSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    res.status(201).json(newSubscription[0]);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
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
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(updatedSubscription[0]);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
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
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const subscription = currentSub[0];
    
    // Get plan details for pricing
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscription.planId))
      .limit(1);

    if (plan.length === 0) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    const planData = plan[0];
    const amount = subscription.billingCycle === 'monthly' ? planData.monthlyPrice : planData.annualPrice;
    const agentCommission = agentId ? (parseFloat(amount) * 0.4).toString() : null;

    // Create payment record
    const paymentId = randomUUID();
    await db
      .insert(subscriptionPayments)
      .values({
        id: paymentId,
        subscriptionId: id,
        agentId,
        amount,
        agentCommission,
        paymentMethod,
        paymentReference,
        status: 'pending',
      });

    // Fetch the created payment
    const payment = await db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.id, paymentId))
      .limit(1);

    // Calculate new end date
    const newEndDate = new Date(subscription.endDate);
    if (subscription.billingCycle === 'monthly') {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    // Update subscription
    await db
      .update(subscriptions)
      .set({
        endDate: newEndDate,
        status: 'active',
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

    res.json({
      subscription: updatedSubscription[0],
      payment: payment[0],
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ error: 'Failed to renew subscription' });
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

    res.json(payments);
  } catch (error) {
    console.error('Error fetching subscription payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
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
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .where(eq(subscriptions.agentId, agentId))
      .orderBy(desc(subscriptions.createdAt));

    res.json(subscriptionsData);
  } catch (error) {
    console.error('Error fetching agent subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch agent subscriptions' });
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
          eq(subscriptions.status, 'active'),
          gte(subscriptions.endDate, new Date())
        )
      )
      .limit(1);

    return subscription.length > 0 ? subscription[0] : null;
  } catch (error) {
    console.error('Error checking subscription validity:', error);
    return null;
  }
};

// Middleware to validate producer subscription
export const validateProducerSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id; // Assuming user is attached to request
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a producer
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0 || user[0].role !== 'producer') {
      return next(); // Not a producer, skip validation
    }

    const validSubscription = await checkSubscriptionValidity(userId);
    
    if (!validSubscription) {
      return res.status(402).json({ 
        error: 'Subscription required',
        message: 'Please subscribe to a plan to continue using producer features',
        redirectTo: '/subscription'
      });
    }

    req.subscription = validSubscription;
    next();
  } catch (error) {
    console.error('Error validating subscription:', error);
    res.status(500).json({ error: 'Failed to validate subscription' });
  }
};
