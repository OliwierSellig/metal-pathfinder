import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Load test environment variables from .env.test
config({ path: ".env.test" });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",

  /* Run tests in files in parallel */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [["html"], ["github"]] : [["list"], ["html", { open: "never" }]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Capture screenshot after each test failure */
    screenshot: "only-on-failure",

    /* Capture video on failure */
    video: "retain-on-failure",

    /* Browser context options */
    contextOptions: {
      // Ensures tests start with a clean state
      storageState: undefined,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Browser context configuration for test isolation
        contextOptions: {
          // Clear all storage before each test
          storageState: undefined,
        },
        // Create a new browser context for each test
        launchOptions: {
          args: ["--disable-blink-features=AutomationControlled"],
        },
      },
    },

    /* API Testing project */
    {
      name: "api",
      testDir: "./tests/api",
      use: {
        baseURL: "http://localhost:3000",
        extraHTTPHeaders: {
          Accept: "application/json",
        },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "NODE_ENV=test bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: "test",
      // Pass test environment variables to the dev server
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_PUBLIC_KEY: process.env.SUPABASE_PUBLIC_KEY || "",
      E2E_USERNAME_ID: process.env.E2E_USERNAME_ID || "",
      E2E_USERNAME: process.env.E2E_USERNAME || "",
      E2E_PASSWORD: process.env.E2E_PASSWORD || "",
    },
  },

  /* Global setup and teardown */
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",

  /* Test timeout */
  timeout: 30 * 1000,
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 5000,

    /* Screenshot comparison configuration */
    toHaveScreenshot: {
      threshold: 0.1,
    },
  },

  /* Output directory for test artifacts */
  outputDir: "test-results/",
});
