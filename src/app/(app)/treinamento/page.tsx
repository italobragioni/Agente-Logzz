import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { FAQManager } from "@/components/FAQManager";
import { ObjectionManager } from "@/components/ObjectionManager";
import { AgentSettings } from "@/components/AgentSettings";
import type {
  Faq,
  Objection,
  AgentSettings as AgentSettingsType,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TreinamentoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [{ data: faqs }, { data: objections }, { data: agent }] =
    await Promise.all([
      supabase
        .from("faqs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("objections")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("agent_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  return (
    <div>
      <Header
        title="Treinamento"
        subtitle="Ensine o agente a responder e vender do seu jeito"
      />

      <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
        As informações do produto (preço, ofertas, entrega, pagamento) ficam na
        página{" "}
        <Link href="/produto" className="font-semibold underline">
          Produto
        </Link>
        . Aqui você configura perguntas, objeções e o comportamento do agente.
      </div>

      <div className="space-y-6">
        <FAQManager faqs={(faqs as Faq[]) || []} />
        <ObjectionManager objections={(objections as Objection[]) || []} />
        {agent && <AgentSettings settings={agent as AgentSettingsType} />}
      </div>
    </div>
  );
}
