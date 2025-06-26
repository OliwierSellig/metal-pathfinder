async function globalTeardown() {
  console.log("🧹 Starting global teardown for Playwright tests");

  try {
    // Clean up any global resources
    // For example: close database connections, clean test data, etc.

    // If you have any test data cleanup, add it here
    console.log("🗑️  Cleaning up test data...");

    // You can add database cleanup, file cleanup, etc. here
  } catch (error) {
    console.error("❌ Global teardown failed:", error);
    // Don't throw here, as we want tests to finish gracefully
  }

  console.log("✅ Global teardown completed successfully");
}

export default globalTeardown;
