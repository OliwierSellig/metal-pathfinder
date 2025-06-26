import { chromium } from "@playwright/test";
import type { FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global setup for Playwright tests");

  // Ensure test environment is set up properly
  process.env.NODE_ENV = "test";

  // Launch browser for any pre-test setup if needed
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the development server to be ready
    console.log("⏳ Waiting for development server to be ready...");
    await page.goto(config.webServer?.url || "http://localhost:4321", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    console.log("✅ Development server is ready");

    // You can add any global authentication or data setup here
    // For example, creating test users, seeding database, etc.
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }

  console.log("✅ Global setup completed successfully");
}

export default globalSetup;
