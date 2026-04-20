import { createBrowserClient } from "@supabase/ssr";

export const STUDY_USER_ID =
  process.env.NEXT_PUBLIC_STUDY_USER_ID ?? "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
