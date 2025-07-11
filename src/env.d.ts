/// <reference types="astro/client" />
/// <reference types="vitest/globals" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly SPOTIFY_CLIENT_ID: string;
  readonly SPOTIFY_CLIENT_SECRET: string;
  readonly OPENAI_API_KEY: string;
  readonly ENABLE_MOCK_MODE?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
