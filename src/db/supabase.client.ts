import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Test user ID for development purposes
// This user must exist in auth.users table
export const TEST_USER_ID = "d9d5061b-a83f-4b4b-8979-39e570a9971a" as const;
