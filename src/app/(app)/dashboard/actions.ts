"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleAgentAction(active: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("agent_settings")
    .update({ agent_active: active })
    .eq("user_id", user.id);

  if (error) return { error: "Não foi possível atualizar o agente." };

  revalidatePath("/dashboard");
  return { ok: true };
}
