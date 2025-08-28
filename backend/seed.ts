import 'dotenv/config';
import { db } from './db';
import { categories } from './shared/schema';
import { seedSubscriptionPlans } from './subscription-plans';

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
      name: "Women's Fashion",
      nameRw: "Imyenda y'Abagore",
      description: 'Dresses, skirts, tops and more',
      imageUrl:
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&h=600',
      createdAt: now,
    },
    {
      name: "Men's Fashion",
      nameRw: "Imyenda y'Abagabo",
      description: 'Shirts, trousers, suits and more',
      imageUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&h=600',
      createdAt: now,
    },
    {
      name: 'Accessories',
      nameRw: 'Ibikoresho',
      description: 'Bags, jewelry, hats and more',
      imageUrl:
        'https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?auto=format&fit=crop&w=800&h=600',
      createdAt: now,
    },
    {
      name: 'Kids',
      nameRw: 'Abana',
      description: 'Clothing for children',
      imageUrl:
        'https://images.unsplash.com/photo-1519455953755-af066f52f1ea?auto=format&fit=crop&w=800&h=600',
      createdAt: now,
    },
    {
      name: 'Traditional',
      nameRw: 'Gakondo',
      description: 'Traditional Rwandan styles',
      imageUrl:
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&h=600',
      createdAt: now,
    },
  ];

  await db.insert(categories).values(initial);
  console.log(`Seeded ${initial.length} categories.`);
}

async function main() {
  await seedSubscriptionPlans();
  await seedCategories();
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
