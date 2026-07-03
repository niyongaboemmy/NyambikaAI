import 'dotenv/config';
import { db } from './db';
import {
  users,
  products,
  cartItems,
  orders,
  orderItems,
  favorites,
} from './shared/schema.dialect';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';

async function seedAgent() {
  const email = 'agent@nyambika.ai';
  const exists = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (exists.length > 0) {
    console.log('Agent already seeded. Skipping.');
    return exists[0].id;
  }
  const id = randomUUID();
  await db.insert(users).values({
    id,
    username: email,
    email,
    password: await bcrypt.hash('Passw0rd!', 10),
    fullName: 'Nyambika Agent',
    role: 'agent',
    isVerified: true,
    isActive: true,
    termsAccepted: true,
    termsAcceptedAt: new Date(),
    referralCode: 'AGENT001',
    phone: '+250780000099',
    location: 'Kigali',
  });
  console.log('Seeded agent: agent@nyambika.ai / Passw0rd!');
  return id;
}

async function seedOrdersAndItems() {
  const customer = await db
    .select()
    .from(users)
    .where(eq(users.email, 'customer@nyambika.ai'))
    .limit(1);
  if (customer.length === 0) {
    console.warn('No seed customer found; skipping orders.');
    return;
  }
  const customerId = customer[0].id;

  const existingOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .limit(1);
  if (existingOrders.length > 0) {
    console.log('Orders already seeded for customer. Skipping.');
    return;
  }

  const prodRows = await db.select().from(products).limit(6);
  if (prodRows.length === 0) {
    console.warn('No products found; skipping orders.');
    return;
  }

  const statuses = [
    { status: 'pending', paymentStatus: 'pending' },
    { status: 'confirmed', paymentStatus: 'paid' },
    { status: 'shipped', paymentStatus: 'paid' },
    { status: 'delivered', paymentStatus: 'paid' },
  ];

  for (let i = 0; i < statuses.length; i++) {
    const product = prodRows[i % prodRows.length];
    const qty = 1 + (i % 2);
    const total = (parseFloat(product.price as any) * qty).toFixed(2);
    const orderId = randomUUID();

    await db.insert(orders).values({
      id: orderId,
      customerId,
      producerId: product.producerId,
      total,
      status: statuses[i].status,
      validationStatus: statuses[i].status === 'delivered' ? 'confirmed_by_customer' : 'pending',
      paymentMethod: 'mobile_money',
      paymentStatus: statuses[i].paymentStatus,
      shippingAddress: 'KG 123 St, Kigali, Rwanda',
      createdAt: new Date(Date.now() - (statuses.length - i) * 86400000),
      isConfirmedByCustomer: statuses[i].status === 'delivered',
      customerConfirmationDate: statuses[i].status === 'delivered' ? new Date() : null,
    });

    await db.insert(orderItems).values({
      id: randomUUID(),
      orderId,
      productId: product.id,
      quantity: qty,
      price: product.price as any,
      size: (product.sizes as any)?.[0] || 'M',
      color: (product.colors as any)?.[0] || 'Black',
    });
  }

  console.log(`Seeded ${statuses.length} orders with items for customer@nyambika.ai.`);
}

async function seedCartAndFavorites() {
  const customer = await db
    .select()
    .from(users)
    .where(eq(users.email, 'customer@nyambika.ai'))
    .limit(1);
  if (customer.length === 0) return;
  const customerId = customer[0].id;

  const existingCart = await db
    .select({ id: cartItems.id })
    .from(cartItems)
    .where(eq(cartItems.userId, customerId))
    .limit(1);

  const prodRows = await db.select().from(products).limit(10);
  if (prodRows.length === 0) return;

  if (existingCart.length === 0) {
    for (const product of prodRows.slice(0, 3)) {
      await db.insert(cartItems).values({
        id: randomUUID(),
        userId: customerId,
        productId: product.id,
        quantity: 1,
        size: (product.sizes as any)?.[0] || 'M',
        color: (product.colors as any)?.[0] || 'Black',
      });
    }
    console.log('Seeded cart items for customer@nyambika.ai.');
  } else {
    console.log('Cart items already seeded. Skipping.');
  }

  const existingFavs = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(eq(favorites.userId, customerId))
    .limit(1);

  if (existingFavs.length === 0) {
    for (const product of prodRows.slice(3, 6)) {
      await db.insert(favorites).values({
        id: randomUUID(),
        userId: customerId,
        productId: product.id,
      });
    }
    console.log('Seeded favorites for customer@nyambika.ai.');
  } else {
    console.log('Favorites already seeded. Skipping.');
  }
}

async function main() {
  await seedAgent();
  await seedOrdersAndItems();
  await seedCartAndFavorites();
  console.log('Extra seeding complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Extra seeding failed:', err);
  process.exit(1);
});
