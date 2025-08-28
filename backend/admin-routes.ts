import { Request, Response } from "express";
import { db } from "./db";
import {
  users,
  subscriptions,
  orders,
  products,
  subscriptionPayments,
} from "./shared/schema";
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
      agents.map(async (agent) => {
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
      ...pendingProducts.map((product) => ({
        id: product.id,
        type: "product",
        title: product.name,
        producer: product.producerName,
        submittedDate: product.createdAt?.toISOString().split("T")[0],
        priority: "medium",
        image: product.imageUrl,
      })),
      ...unverifiedProducers.map((producer) => ({
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
