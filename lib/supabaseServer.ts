import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr"; // or whatever you're already using

export async function createSupabaseServerClient() {
  const cookieStore = await cookies(); // ✅ now it's the real cookie object

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            return cookieStore.get(name)?.value;
          } catch {
            return undefined;
          }
        },

        set(name, value, options) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // ignore on server
          }
        },
        remove(name, options) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          } catch {
            // ignore
          }
        },
      },
    }
  );
}
