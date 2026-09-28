import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { OrderDetails } from "@/components/OrderDetails";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PedidoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!order) notFound();

  const [{ data: items }, { data: history }] = await Promise.all([
    supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_status_history")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <Header
        title="Detalhe do pedido"
        subtitle="Veja e atualize as informações do pedido"
        action={
          <Link href="/pedidos" className="btn-secondary">
            ← Voltar
          </Link>
        }
      />
      <OrderDetails
        order={order as Order}
        items={(items as any) || []}
        history={(history as any) || []}
        conversationId={order.conversation_id}
      />
    </div>
  );
}
