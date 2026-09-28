"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveProfileAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const payload = {
    full_name: String(formData.get("full_name") || ""),
    business_name: String(formData.get("business_name") || ""),
  };

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id);

  if (error) return { error: "Não foi possível salvar o perfil." };

  revalidatePath("/configuracoes");
  return { ok: true };
}
