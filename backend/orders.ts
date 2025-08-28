import { Response } from "express";
import { db } from "./db";
import { orders, orderItems, cartItems, products } from "./shared/schema";
import { eq, desc, and } from "drizzle-orm";

// GET /api/orders - Get user's orders
export const getUserOrders = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userOrders = await db
      .select({
        id: orders.id,
        total: orders.total,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        shippingAddress: orders.shippingAddress,
        trackingNumber: orders.trackingNumber,
        notes: orders.notes,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.customerId, userId))
      .orderBy(desc(orders.createdAt));

    if (!userOrders || userOrders.length === 0) {
      return res.status(200).json([]);
    }

    // Get order items for each order, defensively
    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        try {
          const items = await db
            .select({
              id: orderItems.id,
              productId: orderItems.productId,
              quantity: orderItems.quantity,
              price: orderItems.price,
              size: orderItems.size,
              color: orderItems.color,
              product: {
                id: products.id,
                name: products.name,
                imageUrl: products.imageUrl,
              },
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, order.id));

          // attempt to parse shippingAddress if it looks like JSON
          let shippingAddress = order.shippingAddress as any;
          if (typeof shippingAddress === "string" && shippingAddress.trim().startsWith("{")) {
            try { shippingAddress = JSON.parse(shippingAddress); } catch {}
          }

          return { ...order, shippingAddress, items };
        } catch (itemErr) {
          console.warn("Failed to fetch items for order", order.id, itemErr);
          return { ...order, items: [] as any[] };
        }
      })
    );

    res.status(200).json(ordersWithItems);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders", details: (error as any)?.message || String(error) });
  }
};

// GET /api/orders/:id - Get specific order details
export const getOrderById = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole; // Added to check user role
    const producerId = req.userId; // For producers, this is their user ID
    const orderId = req.params.id;
    
    console.log('Order ID:', orderId);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);
    
    if (!userId) {
      console.log('No user ID found in request');
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Build the base order query
    const orderQuery = db
      .select({
        id: orders.id,
        customerId: orders.customerId, // Include customerId in the selection
        total: orders.total,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        shippingAddress: orders.shippingAddress,
        trackingNumber: orders.trackingNumber,
        notes: orders.notes,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .$dynamic();

    // Apply conditions based on user role
    if (userRole === 'producer' || userRole === 'admin') {
      orderQuery.where(eq(orders.id, orderId));
    } else {
      // For customers, only show their own orders
      orderQuery.where(
        and(
          eq(orders.id, orderId),
          eq(orders.customerId, userId)
        )
      );
    }

    const [order] = await orderQuery;

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Get order items with product details
    let items: any[] = [];
    try {
      const itemsQuery = db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          size: orderItems.size,
          color: orderItems.color,
          product: {
            id: products.id,
            name: products.name,
            nameRw: products.nameRw,
            description: products.description,
            imageUrl: products.imageUrl,
            additionalImages: products.additionalImages,
            producerId: products.producerId, // Include producerId for filtering
          },
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .$dynamic();

      // Apply conditions based on user role
      if (userRole === 'producer') {
        // For producers, only show items from their products
        itemsQuery.where(
          and(
            eq(orderItems.orderId, orderId),
            eq(products.producerId, producerId)
          )
        );
      } else {
        // For customers and admins, show all items in the order
        itemsQuery.where(eq(orderItems.orderId, orderId));
      }
      
      items = await itemsQuery;

    } catch (itemErr) {
      console.warn("Failed to fetch items for order", orderId, itemErr);
    }

    // attempt to parse shippingAddress if it's a JSON string
    let shippingAddress = order.shippingAddress as any;
    if (typeof shippingAddress === "string" && shippingAddress.trim().startsWith("{")) {
      try { shippingAddress = JSON.parse(shippingAddress); } catch {}
    }

    const orderWithItems = { ...order, shippingAddress, items };

    res.json(orderWithItems);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order", details: (error as any)?.message || String(error) });
  }
};

// POST /api/orders - Create new order
export const createOrder = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { items, total, paymentMethod, shippingAddress, notes } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order items are required" });
    }

    if (!total || !paymentMethod || !shippingAddress) {
      return res.status(400).json({ error: "Missing required order information" });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return res.status(400).json({ error: "Each item must have productId, quantity, and price" });
      }
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create the order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          customerId: userId,
          total: parseFloat(total).toFixed(2),
          paymentMethod,
          paymentStatus: paymentMethod === "cash_on_delivery" ? "pending" : "pending",
          shippingAddress: typeof shippingAddress === "string" ? shippingAddress : JSON.stringify(shippingAddress),
          notes: notes || null,
        })
        .returning();

      // Create order items
      const orderItemsData = items.map((item: any) => ({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price).toFixed(2),
        size: item.size || null,
        color: item.color || null,
      }));

      await tx.insert(orderItems).values(orderItemsData);

      // Clear user's cart after successful order
      await tx
        .delete(cartItems)
        .where(eq(cartItems.userId, userId));

      return newOrder;
    });

    // Simulate payment processing for demo
    if (paymentMethod !== "cash_on_delivery") {
      // In a real app, you would integrate with payment providers here
      // For demo purposes, we'll simulate a successful payment
      setTimeout(async () => {
        try {
          await db
            .update(orders)
            .set({
              paymentStatus: "completed",
              status: "confirmed",
            })
            .where(eq(orders.id, result.id));
        } catch (error) {
          console.error("Error updating payment status:", error);
        }
      }, 2000);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// PUT /api/orders/:id - Update order status
export const updateOrder = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orderId = req.params.id;
    const { status, trackingNumber, notes } = req.body;

    // Verify order belongs to user or user is admin/producer
    const [existingOrder] = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        producerId: orders.producerId,
      })
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only allow updates by customer (limited), producer, or admin
    const canUpdate = 
      existingOrder.customerId === userId ||
      existingOrder.producerId === userId;
      // Add admin check here when roles are implemented

    if (!canUpdate) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Update order
    const updateData: any = {};

    if (status) updateData.status = status;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes) updateData.notes = notes;

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
};

// DELETE /api/orders/:id - Cancel order (only if pending)
export const cancelOrder = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const orderId = req.params.id;

    // Get order details to verify ownership and status
    const [existingOrder] = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        status: orders.status,
      })
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only allow cancellation by the customer who placed the order
    if (existingOrder.customerId !== userId) {
      return res.status(403).json({ error: "You can only cancel your own orders" });
    }

    // Only allow cancellation if order is still pending
    if (existingOrder.status !== "pending") {
      return res.status(400).json({ 
        error: "Order cannot be cancelled", 
        message: `Orders with status '${existingOrder.status}' cannot be cancelled. Only pending orders can be cancelled.`
      });
    }

    // Update order status to cancelled
    const [cancelledOrder] = await db
      .update(orders)
      .set({ 
        status: "cancelled",
        notes: "Order cancelled by customer"
      })
      .where(eq(orders.id, orderId))
      .returning();

    res.json({ 
      message: "Order cancelled successfully", 
      order: cancelledOrder 
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
};
