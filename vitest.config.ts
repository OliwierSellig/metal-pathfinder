import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom environment for DOM testing
    environment: "jsdom",

    // Global setup files
    setupFiles: ["./tests/setup.ts"],

    // Include test files
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}", "tests/**/*.{test,spec}.{js,ts,jsx,tsx}"],

    // Exclude files
    exclude: ["node_modules", "dist", ".astro", "tests/e2e/**/*"],

    // Global test configurations
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "dist/",
        ".astro/",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "src/env.d.ts",
        "src/types.ts",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Watch configuration
    watch: true,

    // UI mode
    ui: false,

    // TypeScript checking
    typecheck: {
      checker: "tsc",
      include: ["src/**/*.{test,spec}.{ts,tsx}", "tests/**/*.{test,spec}.{ts,tsx}"],
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
