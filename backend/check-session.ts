import "dotenv/config";
import { db } from "./db";
import { tryOnSessions } from "./shared/schema.dialect";
import { eq } from "drizzle-orm";

async function check() {
  const result = await db.select().from(tryOnSessions).where(eq(tryOnSessions.id, "217db6c8-ee60-41fa-a0b6-783d2fa48b3a"));
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
check();
