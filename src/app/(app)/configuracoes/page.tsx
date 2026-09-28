import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return (
    <div>
      <Header title="Configurações" subtitle="Sua conta e preferências" />

      <div className="space-y-6">
        <ProfileForm
          fullName={profile?.full_name || ""}
          businessName={profile?.business_name || ""}
          email={user?.email || ""}
        />

        <div className="card p-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Atalhos
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link href="/produto" className="btn-secondary justify-start">
              📦 Editar produto e ofertas
            </Link>
            <Link href="/treinamento" className="btn-secondary justify-start">
              🎓 Treinar o agente
            </Link>
            <Link href="/whatsapp" className="btn-secondary justify-start">
              💬 Conectar WhatsApp
            </Link>
            <Link href="/dashboard" className="btn-secondary justify-start">
              📊 Ativar / desativar agente
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            Sobre segurança
          </h2>
          <p className="text-sm text-gray-500">
            Seus dados são isolados por conta (cada usuário só enxerga os
            próprios produtos, contatos, conversas e pedidos). Tokens sensíveis
            (OpenAI e WhatsApp) ficam no servidor e nunca são expostos no
            navegador.
          </p>
        </div>
      </div>
    </div>
  );
}
