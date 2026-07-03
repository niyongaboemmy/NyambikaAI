import "dotenv/config";
import { db } from "./db";
import { tryOnSessions } from "./shared/schema.dialect";
import { eq } from "drizzle-orm";

async function run() {
  const [s] = await db.select().from(tryOnSessions).where(eq(tryOnSessions.id, "0225ae2d-79ff-4ac2-b04b-b7e49a982b86"));
  console.log("STATUS:", s.status);
  console.log("NOTES:", s.notes);
  console.log("IMAGE:", s.tryOnImageUrl);
  console.log("ERROR:", s.fitRecommendation);
  process.exit(0);
}
run();
