import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { AgentToggle } from "@/components/AgentToggle";
import { hasWhatsappCredentials } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [
    agentRes,
    waRes,
    conversationsRes,
    contactsRes,
    ordersRes,
    ordersTodayRes,
    ordersWaitingRes,
  ] = await Promise.all([
    supabase.from("agent_settings").select("agent_active").eq("user_id", userId).maybeSingle(),
    supabase.from("whatsapp_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfToday()),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["confirmed", "awaiting_confirmation"]),
  ]);

  const agentActive = agentRes.data?.agent_active ?? false;
  const waSettings = waRes.data;
  // "Conectado" = há credenciais (por usuário ou por ambiente) E o usuário
  // preencheu o Phone Number ID no app.
  const whatsappConnected =
    hasWhatsappCredentials(waSettings) &&
    Boolean(waSettings?.phone_number_id || process.env.META_WHATSAPP_PHONE_NUMBER_ID);

  const conversations = conversationsRes.count ?? 0;
  const contacts = contactsRes.count ?? 0;
  const orders = ordersRes.count ?? 0;
  const ordersToday = ordersTodayRes.count ?? 0;
  const ordersWaiting = ordersWaitingRes.count ?? 0;

  const conversionRate =
    conversations > 0 ? Math.round((orders / conversations) * 100) : 0;

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Visão geral do seu agente de vendas"
        action={<AgentToggle active={agentActive} />}
      />

      {/* Status */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-gray-500">Status do agente</p>
            <p
              className={`mt-1 text-xl font-bold ${
                agentActive ? "text-brand-600" : "text-gray-400"
              }`}
            >
              {agentActive ? "ATIVO" : "DESATIVADO"}
            </p>
          </div>
          <span
            className={`h-3 w-3 rounded-full ${
              agentActive ? "bg-brand-500" : "bg-gray-300"
            }`}
          />
        </div>

        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Status do WhatsApp
            </p>
            <p
              className={`mt-1 text-xl font-bold ${
                whatsappConnected ? "text-brand-600" : "text-gray-400"
              }`}
            >
              {whatsappConnected ? "CONECTADO" : "DESCONECTADO"}
            </p>
          </div>
          {!whatsappConnected && (
            <Link href="/whatsapp" className="btn-secondary text-xs">
              Conectar
            </Link>
          )}
          {whatsappConnected && (
            <span className="h-3 w-3 rounded-full bg-brand-500" />
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Conversas" value={conversations} />
        <StatCard label="Contatos" value={contacts} />
        <StatCard label="Pedidos" value={orders} accent="brand" />
        <StatCard label="Pedidos hoje" value={ordersToday} />
        <StatCard
          label="Aguardando processamento"
          value={ordersWaiting}
          accent="amber"
        />
        <StatCard
          label="Taxa de conversão"
          value={`${conversionRate}%`}
          hint="Conversas que viraram pedidos"
          accent="brand"
        />
      </div>

      {!whatsappConnected && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-800">
            Seu WhatsApp ainda não está conectado
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Vá até a página{" "}
            <Link href="/whatsapp" className="font-semibold underline">
              WhatsApp
            </Link>{" "}
            para conectar seu número e começar a receber mensagens.
          </p>
        </div>
      )}
    </div>
  );
}
