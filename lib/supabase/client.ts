import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/database.types";

export function createClient() {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        storageKey: "sb-auth-token",
      },
    },
  );

  // Handle auth state changes and refresh token errors
  client.auth.onAuthStateChange(async (event, session) => {
    // Refresh the page on sign out or token refresh errors
    if (event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
      // Allow the app to handle the state change
      if (!session) {
        // Session ended, this is expected
      }
    }
  });

  return client;
}
