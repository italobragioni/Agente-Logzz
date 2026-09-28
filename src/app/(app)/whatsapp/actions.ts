"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveWhatsappAction(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada." };

  const phone_number_id = String(formData.get("phone_number_id") || "").trim();
  const business_account_id = String(
    formData.get("business_account_id") || ""
  ).trim();
  const verify_token = String(formData.get("verify_token") || "").trim();
  const access_token = String(formData.get("access_token") || "").trim();
  const display_phone_number = String(
    formData.get("display_phone_number") || ""
  ).trim();

  // Considera conectado quando há Phone Number ID.
  const connected = Boolean(phone_number_id);

  // Só atualiza access_token se o usuário digitou algo (evita apagar por engano).
  const payload: Record<string, unknown> = {
    phone_number_id,
    business_account_id,
    verify_token,
    display_phone_number,
    connected,
  };
  if (access_token) {
    payload.access_token = access_token;
  }

  const { error } = await supabase
    .from("whatsapp_settings")
    .update(payload)
    .eq("user_id", user.id);

  if (error) return { error: "Não foi possível salvar as configurações." };

  revalidatePath("/whatsapp");
  revalidatePath("/dashboard");
  return { ok: true };
}
