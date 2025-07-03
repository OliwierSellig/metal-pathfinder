// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: "https://metal-pathfinder.pages.dev", // This will be replaced with actual domain
  integrations: [react(), sitemap()],
  server: {
    port: 3000,
    host: "0.0.0.0", // Listen on all interfaces including 127.0.0.1
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Use react-dom/server.edge instead of react-dom/server.browser for React 19.
      // Without this, MessageChannel from node:worker_threads needs to be polyfilled.
      alias: import.meta.env.PROD
        ? {
            "react-dom/server": "react-dom/server.edge",
          }
        : undefined,
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  experimental: { session: true },
});
