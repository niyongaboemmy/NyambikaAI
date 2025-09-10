import 'dotenv/config';
import { db } from './db';
import {
  categories,
  users,
  companies,
  products,
  subscriptions,
  subscriptionPlans,
  subscriptionPayments,
  userWallets,
  walletPayments,
} from './shared/schema.dialect';
import { randomUUID } from 'crypto';
import { seedSubscriptionPlans } from './subscription-plans';
import bcrypt from 'bcryptjs';
import { eq, and, sql } from 'drizzle-orm';

async function seedCategories() {
  // Check if categories already exist
  const existing = await db.select({ id: categories.id }).from(categories).limit(1);
  if (existing.length > 0) {
    console.log('Categories already seeded. Skipping.');
    return;
  }

  const now = new Date();
  const initial = [
    {
      id: randomUUID(),
      name: "Women's Fashion",
      nameRw: "Imyenda y'Abagore",
      description:
        "Dresses, skirts, tops, trousers, and women's collections",
      imageUrl: 'https://picsum.photos/seed/womens-fashion/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: "Men's Fashion",
      nameRw: "Imyenda y'Abagabo",
      description:
        "Suits, shirts, jeans, t-shirts, jackets, and men's outfits",
      imageUrl: 'https://picsum.photos/seed/mens-fashion/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Kids & Babies',
      nameRw: "Imyenda y'Abana",
      description: 'Clothing for newborns, toddlers, boys, and girls',
      imageUrl: 'https://picsum.photos/seed/kids-babies-fashion/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Traditional Wear',
      nameRw: 'Imyenda Nyarwanda',
      description:
        'Imishanana, ibitenge, kitenge dresses, and African collections',
      imageUrl: 'https://picsum.photos/seed/traditional-wear/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Shoes & Footwear',
      nameRw: 'Inkweto',
      description:
        'Sneakers, heels, sandals, boots, and slippers for all genders',
      imageUrl: 'https://picsum.photos/seed/shoes-footwear/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Bags & Purses',
      nameRw: "Imikapu n'Ibikapu",
      description: 'Handbags, backpacks, purses, and travel bags',
      imageUrl: 'https://picsum.photos/seed/bags-purses/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Jewelry & Accessories',
      nameRw: "Imirimbo n'Ibikoresho",
      description:
        'Earrings, necklaces, watches, bracelets, sunglasses, and belts',
      imageUrl: 'https://picsum.photos/seed/jewelry-accessories/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Sportswear',
      nameRw: 'Imyenda ya Siporo',
      description:
        'Tracksuits, gym wear, sneakers, football kits, and yoga outfits',
      imageUrl: 'https://picsum.photos/seed/sportswear/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Luxury Collections',
      nameRw: "Imyenda y'Icyubahiro",
      description: 'Designer outfits, luxury brands, and premium fashion',
      imageUrl: 'https://picsum.photos/seed/luxury-collections/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Work & Office Wear',
      nameRw: "Imyenda y'Akarusho",
      description: 'Corporate suits, formal shirts, blouses, and uniforms',
      imageUrl: 'https://picsum.photos/seed/work-office-wear/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Winter & Jackets',
      nameRw: "Imyenda yo Guhangana n'Ubukonje",
      description: 'Jackets, sweaters, coats, hoodies, and cold-season wear',
      imageUrl: 'https://picsum.photos/seed/winter-jackets/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Summer & Beachwear',
      nameRw: 'Imyambaro yo Ku Nyanja',
      description:
        'Swimwear, shorts, crop tops, beach dresses, and summer outfits',
      imageUrl: 'https://picsum.photos/seed/summer-beachwear/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Wedding & Party Wear',
      nameRw: 'Imyenda yo Gukoreramo Ubukwe',
      description:
        'Bridal gowns, suits, bridesmaids dresses, and reception outfits',
      imageUrl: 'https://picsum.photos/seed/wedding-party-wear/800/600',
      createdAt: now,
    },
    {
      id: randomUUID(),
      name: 'Sleepwear & Lingerie',
      nameRw: 'Imyenda yo Kurara',
      description: 'Nightgowns, pajamas, robes, and intimate wear',
      imageUrl: 'https://picsum.photos/seed/sleepwear-lingerie/800/600',
      createdAt: now,
    },
  ];

  await db.insert(categories).values(initial);
  console.log(`Seeded ${initial.length} categories.`);
}

async function getPlanIdByName(name: string) {
  const rows = await db
    .select({ id: subscriptionPlans.id })
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.name, name))
    .limit(1);
  return rows[0]?.id as string | undefined;
}

async function seedProducersAndCompanies() {
  // Create two producers if not exist
  const producersData = [
    {
      email: 'producer1@nyambika.ai',
      fullName: 'Producer One',
      businessName: 'Kigali Styles Co.',
      location: 'Kigali',
      phone: '+250780000001',
    },
    {
      email: 'producer2@nyambika.ai',
      fullName: 'Producer Two',
      businessName: 'Nyamirambo Fashion House',
      location: 'Nyamirambo',
      phone: '+250780000002',
    },
  ];

  for (const p of producersData) {
    const exists = await db.select().from(users).where(eq(users.email, p.email)).limit(1);
    if (exists.length === 0) {
      const producerId = randomUUID();
      await db
        .insert(users)
        .values({
          id: producerId,
          username: p.email,
          email: p.email,
          password: await bcrypt.hash('Passw0rd!', 10),
          fullName: p.fullName,
          role: 'producer',
          isVerified: true,
          phone: p.phone,
          location: p.location,
        });

      await db.insert(companies).values({
        id: randomUUID(),
        producerId: producerId,
        name: p.businessName,
        email: p.email,
        phone: p.phone,
        location: p.location,
        logoUrl: null,
        websiteUrl: null,
      });
    }
  }
  console.log('Seeded producers and companies (idempotent).');
}

async function seedSubscriptionsForProducers() {
  const planId = (await getPlanIdByName('Professional')) || (await getPlanIdByName('Starter'));
  if (!planId) {
    console.warn('No subscription plan found; skipping producer subscriptions.');
    return;
  }

  const producerRows = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(eq(users.role, 'producer'), eq(users.isVerified, true)));

  const now = new Date();
  for (const pr of producerRows) {
    const existing = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.userId, pr.id))
      .limit(1);
    if (existing.length === 0) {
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      const amount = '35000';
      const subId = randomUUID();
      await db
        .insert(subscriptions)
        .values({
          id: subId,
          userId: pr.id,
          planId,
          status: 'active',
          billingCycle: 'monthly',
          startDate: now,
          endDate: end,
          amount,
          paymentMethod: 'mobile_money',
        });

      await db.insert(subscriptionPayments).values({
        id: randomUUID(),
        subscriptionId: subId,
        amount,
        agentCommission: '0',
        paymentMethod: 'mobile_money',
        status: 'completed',
        createdAt: now,
      });
    }
  }
  console.log('Seeded subscriptions for producers (idempotent).');
}

async function seedProductsForProducers() {
  const catRows = await db.select().from(categories).limit(5);
  const producerRows = await db
    .select({ id: users.id, fullName: users.fullName })
    .from(users)
    .where(eq(users.role, 'producer'));

  if (catRows.length === 0 || producerRows.length === 0) return;

  const samples = [
    { name: 'Classic Shirt', price: '25000', imageUrl: 'https://images.unsplash.com/photo-1520975922391-922f8cfe9f39?auto=format&fit=crop&w=800&h=600' },
    { name: 'Elegant Dress', price: '45000', imageUrl: 'https://images.unsplash.com/photo-1520975916090-3105956f2279?auto=format&fit=crop&w=800&h=600' },
    { name: 'Casual Pants', price: '30000', imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&h=600' },
  ];

  for (const producer of producerRows) {
    // create a couple products per category
    for (const cat of catRows) {
      for (const s of samples) {
        await db.insert(products).values({
          id: randomUUID(),
          name: `${s.name} by ${producer.fullName || 'Producer'}`,
          nameRw: s.name,
          description: `${s.name} high-quality apparel`,
          price: s.price,
          categoryId: (cat as any).id,
          producerId: producer.id,
          imageUrl: s.imageUrl,
          additionalImages: [],
          sizes: ['S', 'M', 'L'],
          colors: ['Black', 'White'],
          inStock: true,
          isApproved: true,
          stockQuantity: 20,
          createdAt: new Date(),
        }).onDuplicateKeyUpdate({ set: { name: sql`VALUES(name)` } });
      }
    }
  }
  console.log('Seeded products for producers (idempotent upsert).');
}

async function seedCustomerAndWallet() {
  const email = 'customer@nyambika.ai';
  const exists = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let userId: string;
  if (exists.length === 0) {
    userId = randomUUID();
    await db.insert(users).values({
      id: userId,
      username: email,
      email,
      password: await bcrypt.hash('Passw0rd!', 10),
      fullName: 'Test Customer',
      role: 'customer',
      isVerified: true,
    });
  } else {
    userId = exists[0].id as string;
  }

  // Ensure wallet
  const walletRows = await db.select().from(userWallets).where(eq(userWallets.userId, userId)).limit(1);
  let walletId: string;
  if (walletRows.length === 0) {
    walletId = randomUUID();
    await db.insert(userWallets).values({
      id: walletId,
      userId,
      balance: '0',
      status: 'active',
    });
  } else {
    walletId = walletRows[0].id as string;
  }

  // Add a sample topup payment
  await db.insert(walletPayments).values({
    id: randomUUID(),
    walletId,
    userId,
    type: 'topup',
    amount: '5000',
    currency: 'RWF',
    method: 'mobile_money',
    provider: 'mtn',
    phone: '+250780000003',
    status: 'completed',
    description: 'Initial topup',
    createdAt: new Date(),
  });

  console.log('Seeded customer and wallet payment.');
}

async function seedDefaultAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@nyambika.ai';
  const name = process.env.SEED_ADMIN_NAME?.trim() || 'Nyambika Admin';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Passw0rd!';

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    console.log(`Admin ${email} already exists. Skipping.`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    id: randomUUID(),
    username: email,
    email,
    password: hashed,
    fullName: name,
    role: 'admin',
    isVerified: true,
  });
  console.log(`Seeded default admin: ${email}`);
}

async function main() {
  await seedSubscriptionPlans();
  await seedCategories();
  await seedDefaultAdmin();
  await seedProducersAndCompanies();
  await seedSubscriptionsForProducers();
  await seedProductsForProducers();
  await seedCustomerAndWallet();
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    // Neon serverless pool cleans up when process exits
    process.exit(0);
  });
