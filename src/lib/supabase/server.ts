import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente do Supabase para uso no SERVIDOR (Server Components, Server Actions,
// Route Handlers). Respeita a sessão do usuário logado via cookies.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: any }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // O método setAll pode falhar quando chamado de um Server Component.
            // Isso é seguro de ignorar quando o middleware já renova a sessão.
          }
        },
      },
    }
  );
}
