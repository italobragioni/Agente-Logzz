import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { OrderList } from "@/components/OrderList";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Header title="Pedidos" subtitle="Todos os pedidos criados pelo agente" />
      <OrderList orders={(orders as Order[]) || []} />
    </div>
  );
}
