import "dotenv/config";
import { db } from "./db";
import { tryOnSessions, users } from "./shared/schema.dialect";
import { eq } from "drizzle-orm";

async function testSession() {
  try {
    const id = "8126277c-3548-45f1-bb6f-058904b33b58";
    
    // Test 1: Check if session exists
    const sessions = await db.select().from(tryOnSessions).where(eq(tryOnSessions.id, id));
    console.log("Sessions found:", sessions.length);
    console.log("Session data:", sessions[0] || "No session");
    
    // Test 2: Check all sessions (first 5)
    const allSessions = await db.select().from(tryOnSessions).limit(5);
    console.log("Total sessions in DB (showing first 5):", allSessions);
    
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

testSession();
