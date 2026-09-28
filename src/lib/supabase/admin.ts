import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente ADMINISTRATIVO do Supabase (service_role).
// ATENÇÃO: ignora o Row Level Security. Use SOMENTE no servidor, nunca no
// navegador. É usado principalmente pelo webhook do WhatsApp, que precisa
// gravar dados sem uma sessão de usuário logado.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
