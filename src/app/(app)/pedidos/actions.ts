"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  note?: string
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("user_id", user.id);

  if (error) return { error: "Não foi possível atualizar o status." };

  await supabase.from("order_status_history").insert({
    user_id: user.id,
    order_id: orderId,
    status,
    note: note || "Status alterado manualmente pelo painel.",
  });

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  return { ok: true };
}
