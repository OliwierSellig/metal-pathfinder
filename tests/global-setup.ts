import { chromium } from "@playwright/test";
import type { FullConfig } from "@playwright/test";
import { config } from "dotenv";
import { testDb } from "./utils/test-db-helper";

// Load test environment variables
config({ path: ".env.test" });

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global setup for Playwright tests");

  // Ensure test environment is set up properly
  process.env.NODE_ENV = "test";

  try {
    // Clean test database before running tests
    const testUserId = process.env.E2E_USERNAME_ID || "ff5f16c8-d72b-4078-a946-4ab3cffba27e";
    console.log("🧹 Cleaning test database...");
    await testDb.cleanUserData(testUserId);
    console.log("✅ Test database cleaned");

    // Launch browser for authentication setup
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Wait for the development server to be ready
      console.log("⏳ Waiting for development server to be ready...");
      await page.goto(config.webServer?.url || "http://localhost:3000", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      console.log("✅ Development server is ready");

      // Set up authentication for tests
      console.log("🔐 Setting up test authentication...");

      // Mock authenticated session by setting up session cookies/storage
      // This simulates a logged-in user without going through actual auth flow
      await page.evaluate(() => {
        // Set test user data that middleware will recognize
        localStorage.setItem("test-authenticated", "true");
      });

      // Try to navigate to a protected page to verify auth works
      await page.goto(`${config.webServer?.url || "http://localhost:3000"}/discover`);

      // If we get redirected to login, that means auth setup didn't work
      const currentUrl = page.url();
      if (currentUrl.includes("/login")) {
        console.warn("⚠️  Authentication setup may need adjustment - redirected to login");
      } else {
        console.log("✅ Authentication setup successful");
      }

      // Verify test database connection
      console.log("🔍 Verifying test database connection...");
      const libraryTracks = await testDb.getUserLibrary(testUserId);
      console.log(`✅ Test database connection verified (found ${libraryTracks.length} tracks in library)`);
    } catch (error) {
      console.error("❌ Global setup failed:", error);
      throw error;
    } finally {
      await context.close();
      await browser.close();
    }
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  }

  console.log("✅ Global setup completed successfully");
}

export default globalSetup;
