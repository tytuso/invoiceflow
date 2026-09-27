"use client";

import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dpmajonvvhopjnupgfpq.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_64LPWeBCLp_4yxDvB5XGiw_rwcFcgO7";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}
