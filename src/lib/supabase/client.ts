"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente do Supabase para uso no NAVEGADOR (componentes client).
// Usa apenas as chaves públicas — nenhum segredo aqui.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
