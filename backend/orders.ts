import { Response } from "express";
import { db } from "./db";
import crypto from "crypto";
import { orders, orderItems, cartItems, products, users } from "./shared/schema.dialect";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { sendSuccess, sendError } from "./utils/response";

// GET /api/orders - Get user's orders
export const getUserOrders = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }


    const userOrders = await db
      .select({
        id: orders.id,
        total: orders.total,
        status: orders.status,
        validationStatus: orders.validationStatus,
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
      return sendSuccess(res, []);
    }


    // Get order items for each order, defensively
    const ordersWithItems = await Promise.all(
      userOrders.map(async (order: any) => {
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
          if (
            typeof shippingAddress === "string" &&
            shippingAddress.trim().startsWith("{")
          ) {
            try {
              shippingAddress = JSON.parse(shippingAddress);
            } catch {}
          }

          return { ...order, shippingAddress, items };
        } catch (itemErr) {
          console.warn("Failed to fetch items for order", order.id, itemErr);
          return { ...order, items: [] as any[] };
        }
      })
    );

    sendSuccess(res, ordersWithItems);
  } catch (error) {
    console.error("Error fetching orders:", error);
    sendError(res, 500, "Failed to fetch orders", error);
  }
};

// GET /api/producer/orders - Get orders for current producer (only items belonging to this producer)
export const getProducerOrders = async (req: any, res: Response) => {
  try {
    const userId = req.userId; // producer or admin acting as producer
    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }

    const statusFilter = (req.query.status as string | undefined)?.trim();

    // Gather order IDs where this producer has at least one item
    const orderIdRows = await db
      .select({ orderId: orderItems.orderId })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(products.producerId, userId));

    const orderIds = Array.from(
      new Set(orderIdRows.map((r: any) => r.orderId))
    ).filter(Boolean) as string[];
    if (orderIds.length === 0) {
      return sendSuccess(res, []);
    }

    // Base orders for these IDs
    const baseQuery = db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        total: orders.total,
        status: orders.status,
        validationStatus: orders.validationStatus,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        shippingAddress: orders.shippingAddress,
        trackingNumber: orders.trackingNumber,
        notes: orders.notes,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(inArray(orders.id, orderIds))
      .orderBy(desc(orders.createdAt))
      .$dynamic();

    if (statusFilter && statusFilter.length > 0) {
      baseQuery.where(
        and(inArray(orders.id, orderIds), eq(orders.status, statusFilter))
      );
    }

    const baseOrders = await baseQuery;

    const ordersWithItems = await Promise.all(
      baseOrders.map(async (order: any) => {
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
                producerId: products.producerId,
              },
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(
              and(
                eq(orderItems.orderId, order.id),
                eq(products.producerId, userId)
              )
            );

          const producerTotal = items.reduce((sum: number, it: any) => {
            const priceNum =
              typeof it.price === "string"
                ? parseFloat(it.price)
                : (it.price as unknown as number);
            const qty =
              typeof it.quantity === "number"
                ? it.quantity
                : parseInt(String(it.quantity) || "0", 10);
            return (
              sum +
              (isFinite(priceNum) ? priceNum : 0) * (isFinite(qty) ? qty : 0)
            );
          }, 0);

          let shippingAddress = order.shippingAddress as any;
          if (
            typeof shippingAddress === "string" &&
            shippingAddress.trim().startsWith("{")
          ) {
            try {
              shippingAddress = JSON.parse(shippingAddress);
            } catch {}
          }

          return {
            ...order,
            shippingAddress,
            items,
            total: producerTotal.toFixed(2),
          };
        } catch (itemErr) {
          console.warn(
            "Failed to fetch producer items for order",
            order.id,
            itemErr
          );
          return { ...order, items: [] as any[], total: "0.00" };
        }
      })
    );

    return sendSuccess(res, ordersWithItems);

  } catch (error) {
    console.error("Error fetching producer orders:", error);
    sendError(res, 500, "Failed to fetch producer orders", error);
  }
};

// GET /api/orders/:id - Get specific order details
export const getOrderById = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole; // Added to check user role
    const producerId = req.userId; // For producers, this is their user ID
    const orderId = req.params.id;

    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }

    // Build the base order query
    const orderQuery = db
      .select({
        id: orders.id,
        customerId: orders.customerId, // Include customerId in the selection
        total: orders.total,
        status: orders.status,
        validationStatus: orders.validationStatus,
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
    if (userRole === "producer" || userRole === "admin") {
      orderQuery.where(eq(orders.id, orderId));
    } else {
      // For customers, only show their own orders
      orderQuery.where(
        and(eq(orders.id, orderId), eq(orders.customerId, userId))
      );
    }

    const [order] = await orderQuery;

    if (!order) {
      return sendError(res, 404, "Order not found");
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
      if (userRole === "producer") {
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
    if (
      typeof shippingAddress === "string" &&
      shippingAddress.trim().startsWith("{")
    ) {
      try {
        shippingAddress = JSON.parse(shippingAddress);
      } catch {}
    }

    const orderWithItems = { ...order, shippingAddress, items };

    sendSuccess(res, orderWithItems);
  } catch (error) {
    console.error("Error fetching order:", error);
    sendError(res, 500, "Failed to fetch order", error);
  }
};

// POST /api/orders - Create new order
export const createOrder = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }


    const { items, total, paymentMethod: rawPaymentMethod, shippingAddress, notes } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, "Order items are required");
    }

    if (!total || !shippingAddress) {
      return sendError(res, 400, "Missing required order information");
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return sendError(res, 400, "Each item must have productId, quantity, and price");
      }
    }


    // Start transaction
    const result = await db.transaction(async (tx: any) => {
      // Create the order
      const orderId = crypto.randomUUID();
      const orderValues: any = {
        id: orderId,
        customerId: userId,
        total: parseFloat(total).toFixed(2),
        status: "confirmed", // Auto-confirm direct orders
        paymentMethod: rawPaymentMethod || "direct_order",
        paymentStatus: "completed", // Auto-complete for direct orders
        shippingAddress:
          typeof shippingAddress === "string"
            ? shippingAddress
            : JSON.stringify(shippingAddress),
        notes: notes || null,
      };
      await tx.insert(orders).values(orderValues).returning();
      // Select created order row for consistent return shape
      const [newOrder] = await tx.select().from(orders).where(eq(orders.id, orderId));

      // Create order items
      const orderItemsData = items.map((item: any) => ({
        id: crypto.randomUUID(),
        orderId: newOrder.id,
        productId: item.productId,
        quantity: parseInt(item.quantity) || 1,
        price: parseFloat(item.price).toFixed(2),
        size: item.size || null,
        color: item.color || null,
      }));
      await tx.insert(orderItems).values(orderItemsData).returning();

      // Clear user's cart after successful order
      await tx.delete(cartItems).where(eq(cartItems.userId, userId));

      return newOrder;
    });

    // Orders are automatically confirmed without payment processing

    sendSuccess(res, result, "Order created successfully", 201);
  } catch (error) {
    console.error("Error creating order:", error);
    sendError(res, 500, "Failed to create order", error);
  }
};

// PUT /api/orders/:id - Update order status
export const updateOrder = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    const userRole = req.userRole;

    if (!userId) {
      return sendError(res, 401, "Unauthorized");
    }


    const orderId = req.params.id;
    const { status, trackingNumber, notes } = req.body;

    // First, check if the order exists and get basic info
    const [existingOrder] = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
      })
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!existingOrder) {
      return sendError(res, 404, "Order not found");
    }


    // Check if user is admin - they can update any order
    if (userRole === "admin") {
      // Admin can update any order
    }
    // Check if user is the customer
    else if (existingOrder.customerId === userId) {
      // Customers can only update certain fields (like notes)
      // and can't change status to certain values
      if (status && !["cancelled"].includes(status)) {
        return sendError(res, 403, "You can only cancel your own orders");
      }

    }
    // Check if user is a producer with items in this order
    else if (userRole === "producer") {
      const producerItems = await db
        .select({ count: sql<number>`count(*)` })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(
          and(eq(orderItems.orderId, orderId), eq(products.producerId, userId))
        );

      if (producerItems[0].count === 0) {
        return sendError(res, 403, "You don't have permission to update this order");
      }

    }
    // If none of the above, user is not authorized
    else {
      return sendError(res, 403, "You don't have permission to update this order");
    }


    // If we get here, the user is authorized to update the order
    const updateData: any = {};
    if (status) updateData.status = status;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;
    if (notes) updateData.notes = notes;

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    sendSuccess(res, updatedOrder, "Order updated successfully");
  } catch (error) {
    console.error("Error updating order:", error);
    sendError(res, 500, "Failed to update order", error);
  }
};

// DELETE /api/orders/:id - Cancel order (only if pending)
export const cancelOrder = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return sendError(res, 401, "Unauthorized");
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
      return sendError(res, 404, "Order not found");
    }


    // Only allow cancellation by the customer who placed the order
    if (existingOrder.customerId !== userId) {
      return sendError(res, 403, "You can only cancel your own orders");
    }


    // Only allow cancellation if order is still pending or confirmed (since orders auto-confirm now)
    if (!["pending", "confirmed"].includes(existingOrder.status)) {
      return sendError(res, 400, "Order cannot be cancelled", `Orders with status '${existingOrder.status}' cannot be cancelled.`);
    }


    // Update order status to cancelled
    const [cancelledOrder] = await db
      .update(orders)
      .set({
        status: "cancelled",
        notes: "Order cancelled by customer",
      })
      .where(eq(orders.id, orderId))
      .returning();

    sendSuccess(res, cancelledOrder, "Order cancelled successfully");
  } catch (error) {
    console.error("Error cancelling order:", error);
    return sendError(res, 500, "Failed to cancel order", error);
  }
};


// PUT /api/orders/:id/validation-status - Update validation_status with role checks
export const updateOrderValidationStatus = async (req: any, res: Response) => {
  try {
    const userId = req.userId as string | undefined;
    const role = req.userRole as string | undefined;
    if (!userId) return sendError(res, 401, "Unauthorized");


    const orderId = req.params.id as string;
    const newStatus = String(req.body?.validationStatus || "").trim();
    const allowedValues = [
      "pending",
      "in_progress",
      "done",
      "confirmed_by_customer",
    ];
    if (!allowedValues.includes(newStatus)) {
      return sendError(res, 400, "Invalid validationStatus value");
    }


    // Fetch order basic info
    const [existing] = await db
      .select({ id: orders.id, customerId: orders.customerId })
      .from(orders)
      .where(eq(orders.id, orderId));
    if (!existing) return sendError(res, 404, "Order not found");


    // Customers: can only set confirmed_by_customer on their own orders
    if (role === "customer") {
      if (existing.customerId !== userId) {
        return sendError(res, 403, "Unauthorized access");
      }

      if (newStatus !== "confirmed_by_customer") {
        return sendError(res, 400, "Customers can only set confirmed_by_customer");
      }

      const [updated] = await db
        .update(orders)
        .set({
          validationStatus: newStatus,
          isConfirmedByCustomer: true,
          customerConfirmationDate: new Date() as any,
        })
        .where(eq(orders.id, orderId))
        .returning();
      return sendSuccess(res, updated);
    }


    // Producers/Admins: can set pending, in_progress, done
    if (role === "producer" || role === "admin") {
      if (role === "producer") {
        // Ensure this producer has at least one item in this order
        const ownedItem = await db
          .select({ id: orderItems.id })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(
            and(
              eq(orderItems.orderId, orderId),
              eq(products.producerId, userId)
            )
          )
          .limit(1);
        if (ownedItem.length === 0) {
          return sendError(res, 403, "You do not have items in this order");
        }

      }

      if (!["in_progress", "done", "pending"].includes(newStatus)) {
        return sendError(res, 400, "Producers can set: pending, in_progress, done");
      }

      const [updated] = await db
        .update(orders)
        .set({ validationStatus: newStatus })
        .where(eq(orders.id, orderId))
        .returning();
      return sendSuccess(res, updated);
    }


    return sendError(res, 403, "Unauthorized access");

  } catch (error) {
    console.error("Error updating validation status:", error);
    return sendError(res, 500, "Failed to update validation status", error);
  }
};


// GET /api/orders/producer/:producerId - Get orders for specific producer
export const getOrdersByProducerId = async (req: any, res: Response) => {
  try {
    const { producerId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;
    
    if (!userId) {
      return sendError(res, 401, "Authentication required");
    }


    // Only allow access if user is the producer themselves or an admin
    if (userRole !== 'admin' && userId !== producerId) {
      return sendError(res, 403, "Access denied");
    }


    const statusFilter = (req.query.status as string | undefined)?.trim();
    const searchQuery = (req.query.search as string | undefined)?.trim();

    // Get order IDs where this producer has items
    const orderIdRows = await db
      .select({ orderId: orderItems.orderId })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(products.producerId, producerId));

    const orderIds = Array.from(
      new Set(orderIdRows.map((r: any) => r.orderId))
    ).filter(Boolean) as string[];

    if (orderIds.length === 0) {
      return sendSuccess(res, []);
    }


    // Build dynamic query
    let whereConditions = [inArray(orders.id, orderIds)];
    
    if (statusFilter && statusFilter !== 'all') {
      whereConditions.push(eq(orders.status, statusFilter));
    }

    const baseOrders = await db
      .select({
        id: orders.id,
        customerId: orders.customerId,
        total: orders.total,
        status: orders.status,
        validationStatus: orders.validationStatus,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        shippingAddress: orders.shippingAddress,
        trackingNumber: orders.trackingNumber,
        notes: orders.notes,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(users, eq(orders.customerId, users.id))
      .where(and(...whereConditions))
      .orderBy(desc(orders.createdAt));

    // Get customer info and items for each order
    const ordersWithDetails = await Promise.all(
      baseOrders.map(async (order: any) => {
        try {
          // Get customer info
          const customer = await db
            .select({
              id: users.id,
              name: users.fullName,
              email: users.email,
              phone: users.phone,
            })
            .from(users)
            .where(eq(users.id, order.customerId!))
            .limit(1);

          // Get producer's items in this order
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
                producerId: products.producerId,
              },
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(
              and(
                eq(orderItems.orderId, order.id),
                eq(products.producerId, producerId)
              )
            );

          // Calculate producer-specific total
          const producerTotal = items.reduce((sum: number, item: any) => {
            const priceNum = typeof item.price === "string" 
              ? parseFloat(item.price) 
              : (item.price as unknown as number);
            const qty = typeof item.quantity === "number" 
              ? item.quantity 
              : parseInt(String(item.quantity) || "0", 10);
            return sum + (isFinite(priceNum) ? priceNum : 0) * (isFinite(qty) ? qty : 0);
          }, 0);

          const customerInfo = customer[0] || {};

          return {
            ...order,
            total: producerTotal.toFixed(2),
            customerName: customerInfo.name || 'Unknown Customer',
            customerEmail: customerInfo.email || '',
            customerPhone: customerInfo.phone || '',
            items: items,
          };
        } catch (error) {
          console.error(`Error processing order ${order.id}:`, error);
          return {
            ...order,
            customerName: 'Unknown Customer',
            customerEmail: '',
            customerPhone: '',
            items: [],
          };
        }
      })
    );

    // Apply search filter if provided
    let filteredOrders = ordersWithDetails;
    if (searchQuery) {
      filteredOrders = ordersWithDetails.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return sendSuccess(res, filteredOrders);
  } catch (error) {
    console.error("Error fetching producer orders:", error);
    return sendError(res, 500, "Failed to fetch orders", error);
  }
};

