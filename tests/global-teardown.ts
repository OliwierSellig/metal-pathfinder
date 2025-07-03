import { config } from "dotenv";
import { testDb } from "./utils/test-db-helper";

// Load test environment variables
config({ path: ".env.test" });

async function globalTeardown() {
  console.log("🧹 Starting global teardown for Playwright tests");

  try {
    // Clean test database after running tests
    const testUserId = process.env.E2E_USERNAME_ID || "ff5f16c8-d72b-4078-a946-4ab3cffba27e";
    console.log("🧹 Cleaning test database...");
    await testDb.cleanUserData(testUserId);
    console.log("✅ Test database cleaned");
  } catch (error) {
    console.error("❌ Global teardown failed:", error);
    // Don't throw - we don't want to fail tests because of cleanup issues
  }

  console.log("✅ Global teardown completed");
}

export default globalTeardown;
