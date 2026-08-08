import 'dotenv/config';
import { db } from './db';
import { categories } from './shared/schema.dialect';
import { eq, like } from 'drizzle-orm';

// One-off fix: categories seeded before picsum.photos was swapped out for
// placehold.co (picsum was timing out / returning 500s via next/image in some
// dev environments). Re-run this any time to catch rows still pointing at picsum.
async function main() {
  const stale = await db
    .select({ id: categories.id, name: categories.name, imageUrl: categories.imageUrl })
    .from(categories)
    .where(like(categories.imageUrl, '%picsum.photos%'));

  if (stale.length === 0) {
    console.log('No categories reference picsum.photos. Nothing to update.');
    return;
  }

  for (const cat of stale) {
    const text = encodeURIComponent(cat.name || 'Category').replace(/%20/g, '+');
    const newUrl = `https://placehold.co/800x600/EAD9A8/3D2F14?text=${text}`;
    await db
      .update(categories)
      .set({ imageUrl: newUrl })
      .where(eq(categories.id, cat.id));
    console.log(`Updated "${cat.name}" -> ${newUrl}`);
  }

  console.log(`Updated ${stale.length} categories.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
