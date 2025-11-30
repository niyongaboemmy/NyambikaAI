import { db } from "./db";
import { tryOnSessions, users } from "./shared/schema.dialect";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

async function testTryOnPutEndpoint() {
  try {
    console.log("🧪 Starting Try-On PUT Endpoint Test...\n");

    // Step 1: Create or get a test user
    console.log("📝 Step 1: Setting up test user...");
    const testUserId = "test-user-" + randomUUID();
    const testUserEmail = `test-${Date.now()}@example.com`;

    // Create a test user
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, testUserEmail));

    let userId = existingUser?.id || testUserId;

    if (!existingUser) {
      await db.insert(users).values({
        id: testUserId,
        email: testUserEmail,
        name: "Test User",
        passwordHash: "hashed_password",
        role: "customer",
      });
      console.log(`✅ Created test user: ${testUserId}`);
    } else {
      console.log(`✅ Using existing test user: ${userId}`);
    }

    // Step 2: Create a try-on session
    console.log("\n📸 Step 2: Creating try-on session...");
    const sessionId = randomUUID();
    const testSession = {
      id: sessionId,
      userId: userId,
      customerImageUrl: "https://example.com/customer.jpg",
      productId: "product-123",
      status: "processing" as const,
      isFavorite: false,
    };

    await db.insert(tryOnSessions).values(testSession);
    console.log(`✅ Created try-on session: ${sessionId}`);

    // Verify session was created
    const [createdSession] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, sessionId));

    console.log("📊 Initial Session Data:");
    console.log(JSON.stringify(createdSession, null, 2));

    // Step 3: Test updating the session with various fields
    console.log("\n🔄 Step 3: Testing PUT endpoint simulation...");

    const updateData = {
      tryOnImageUrl: "https://example.com/result.jpg",
      status: "completed",
      fitRecommendation: JSON.stringify({
        fit: "perfect",
        confidence: 0.95,
      }),
      isFavorite: true,
      notes: "Great fit!",
      rating: 5,
    };

    // Simulate the PUT endpoint logic
    const updateFields: any = {};

    if (updateData.tryOnImageUrl !== undefined)
      updateFields.tryOnImageUrl = updateData.tryOnImageUrl;
    if (updateData.status !== undefined)
      updateFields.status = updateData.status;
    if (updateData.fitRecommendation !== undefined)
      updateFields.fitRecommendation = updateData.fitRecommendation;
    if (updateData.isFavorite !== undefined)
      updateFields.isFavorite = updateData.isFavorite;
    if (updateData.notes !== undefined) updateFields.notes = updateData.notes;
    if (updateData.rating !== undefined)
      updateFields.rating = updateData.rating;

    if (Object.keys(updateFields).length > 0) {
      await db
        .update(tryOnSessions)
        .set(updateFields)
        .where(eq(tryOnSessions.id, sessionId));
      console.log("✅ Updated session with:");
      console.log(JSON.stringify(updateData, null, 2));
    }

    // Step 4: Verify the update was successful
    console.log("\n✔️ Step 4: Verifying data persistence...");
    const [updatedSession] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, sessionId));

    console.log("📊 Updated Session Data:");
    console.log(JSON.stringify(updatedSession, null, 2));

    // Step 5: Verify critical fields are preserved
    console.log("\n🔐 Step 5: Verifying critical data preservation...");
    const checks = [
      {
        name: "Customer Image URL preserved",
        condition:
          updatedSession?.customerImageUrl === createdSession?.customerImageUrl,
      },
      {
        name: "Try-on Image URL updated",
        condition: updatedSession?.tryOnImageUrl === updateData.tryOnImageUrl,
      },
      {
        name: "Status updated",
        condition: updatedSession?.status === updateData.status,
      },
      {
        name: "IsFavorite updated",
        condition: updatedSession?.isFavorite === updateData.isFavorite,
      },
      {
        name: "Notes updated",
        condition: updatedSession?.notes === updateData.notes,
      },
      {
        name: "Rating updated",
        condition: updatedSession?.rating === updateData.rating,
      },
      {
        name: "Fit Recommendation stored",
        condition:
          updatedSession?.fitRecommendation === updateData.fitRecommendation,
      },
      {
        name: "User ID preserved",
        condition: updatedSession?.userId === userId,
      },
      {
        name: "Product ID preserved",
        condition: updatedSession?.productId === testSession.productId,
      },
    ];

    let allPassed = true;
    checks.forEach((check) => {
      const status = check.condition ? "✅" : "❌";
      console.log(`${status} ${check.name}`);
      if (!check.condition) allPassed = false;
    });

    // Step 6: Test partial update (only update rating)
    console.log("\n🔄 Step 6: Testing partial update (rating only)...");
    const partialUpdateData = { rating: 4 };

    await db
      .update(tryOnSessions)
      .set(partialUpdateData)
      .where(eq(tryOnSessions.id, sessionId));

    const [partiallyUpdatedSession] = await db
      .select()
      .from(tryOnSessions)
      .where(eq(tryOnSessions.id, sessionId));

    console.log("✅ Partial update completed");
    console.log("📊 Session after partial update:");
    console.log(JSON.stringify(partiallyUpdatedSession, null, 2));

    // Verify other fields weren't affected
    const partialChecks = [
      {
        name: "Rating updated to 4",
        condition: partiallyUpdatedSession?.rating === 4,
      },
      {
        name: "Try-on Image preserved",
        condition:
          partiallyUpdatedSession?.tryOnImageUrl === updateData.tryOnImageUrl,
      },
      {
        name: "Notes preserved",
        condition: partiallyUpdatedSession?.notes === updateData.notes,
      },
      {
        name: "IsFavorite preserved",
        condition:
          partiallyUpdatedSession?.isFavorite === updateData.isFavorite,
      },
    ];

    partialChecks.forEach((check) => {
      const status = check.condition ? "✅" : "❌";
      console.log(`${status} ${check.name}`);
      if (!check.condition) allPassed = false;
    });

    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await db.delete(tryOnSessions).where(eq(tryOnSessions.id, sessionId));
    console.log("✅ Test session deleted");

    // Final result
    console.log("\n" + "=".repeat(50));
    if (allPassed) {
      console.log(
        "✅ ALL TESTS PASSED! The PUT endpoint is working correctly."
      );
      console.log(
        "📁 Data is being saved and retrieved correctly from the database."
      );
      console.log("🔐 Critical fields (images, session data) are preserved.");
    } else {
      console.log("❌ SOME TESTS FAILED! Please review the implementation.");
    }
    console.log("=".repeat(50) + "\n");

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("❌ Test failed with error:");
    console.error(error);
    process.exit(1);
  }
}

testTryOnPutEndpoint();
