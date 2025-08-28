import { Request, Response } from "express";
import { db } from "./db";
import { subscriptions, products, orderItems } from "./shared/schema";
import { eq, and } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Get producer dashboard stats: totalProducts, totalOrders, totalRevenue
export async function getProducerStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Products count for this producer
    const producerProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.producerId, userId));
    const totalProducts = producerProducts.length;

    // Orders and revenue: find all orderItems that belong to products by this producer
    const rows = await db
      .select({
        orderId: orderItems.orderId,
        price: orderItems.price,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(products.producerId, userId));

    const orderIdSet = new Set<string>();
    let totalRevenue = 0;
    for (const r of rows as any[]) {
      if (r.orderId) orderIdSet.add(String(r.orderId));
      const priceNum = typeof r.price === "string" ? parseFloat(r.price) : Number(r.price) || 0;
      const qtyNum = typeof r.quantity === "number" ? r.quantity : parseInt(String(r.quantity) || "0", 10);
      if (isFinite(priceNum) && isFinite(qtyNum)) totalRevenue += priceNum * qtyNum;
    }
    const totalOrders = orderIdSet.size;

    return res.json({ totalProducts, totalOrders, totalRevenue });
  } catch (error) {
    console.error("Error fetching producer stats:", error);
    return res.status(500).json({ message: "Failed to fetch producer stats" });
  }
}

// Get producer subscription status
export async function getProducerSubscriptionStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user is a producer
    if (req.user?.role !== "producer") {
      return res.status(403).json({ message: "Access denied. Producer role required." });
    }

    // Find active subscription for the producer
    const activeSubscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, "active")
        )
      )
      .limit(1);

    if (activeSubscription.length === 0) {
      return res.json({
        hasActiveSubscription: false,
        message: "No active subscription found"
      });
    }

    const subscription = activeSubscription[0];
    const now = new Date();
    const expiresAt = new Date(subscription.endDate);

    // Check if subscription is expired
    if (expiresAt < now) {
      return res.json({
        hasActiveSubscription: false,
        subscriptionId: subscription.id,
        status: "expired",
        expiresAt: subscription.endDate,
        message: "Subscription has expired"
      });
    }

    return res.json({
      hasActiveSubscription: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      expiresAt: subscription.endDate,
      planId: subscription.planId
    });

  } catch (error) {
    console.error("Error checking subscription status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
