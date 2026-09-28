"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id };
}

// Garante que exista um produto para o usuário e retorna seu id.
export async function ensureProduct(): Promise<{ productId?: string; error?: string }> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) return { productId: existing.id };

  const { data: created, error } = await supabase
    .from("products")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error || !created) return { error: "Não foi possível criar o produto." };
  return { productId: created.id };
}

function num(value: FormDataEntryValue | null): number | null {
  const s = String(value ?? "").replace(",", ".").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function saveProductAction(productId: string, formData: FormData) {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };

  const payload = {
    name: String(formData.get("name") || ""),
    description: String(formData.get("description") || ""),
    regular_price: num(formData.get("regular_price")),
    promo_price: num(formData.get("promo_price")),
    current_offer: String(formData.get("current_offer") || ""),
    benefits: String(formData.get("benefits") || ""),
    features: String(formData.get("features") || ""),
    usage_instructions: String(formData.get("usage_instructions") || ""),
    target_audience: String(formData.get("target_audience") || ""),
    not_for: String(formData.get("not_for") || ""),
    notes: String(formData.get("notes") || ""),
    warranty: String(formData.get("warranty") || ""),
    delivery_estimate: String(formData.get("delivery_estimate") || ""),
    regions: String(formData.get("regions") || ""),
    states: String(formData.get("states") || ""),
    cities: String(formData.get("cities") || ""),
    payment_methods: String(formData.get("payment_methods") || ""),
    requires_upfront_payment: formData.get("requires_upfront_payment") === "on",
    cash_on_delivery: formData.get("cash_on_delivery") === "on",
    payment_message: String(formData.get("payment_message") || ""),
  };

  const { error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId)
    .eq("user_id", userId);

  if (error) return { error: "Não foi possível salvar o produto." };

  revalidatePath("/produto");
  return { ok: true };
}

// ---- Ofertas ----
export async function addOfferAction(productId: string) {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };

  const { count } = await supabase
    .from("product_offers")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase.from("product_offers").insert({
    user_id: userId,
    product_id: productId,
    label: "",
    quantity: 1,
    price: 0,
    sort_order: count ?? 0,
  });
  if (error) return { error: "Não foi possível adicionar a oferta." };

  revalidatePath("/produto");
  return { ok: true };
}

export async function updateOfferAction(
  offerId: string,
  data: { label: string; quantity: number; price: number }
) {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("product_offers")
    .update({
      label: data.label,
      quantity: data.quantity,
      price: data.price,
    })
    .eq("id", offerId)
    .eq("user_id", userId);

  if (error) return { error: "Não foi possível salvar a oferta." };
  revalidatePath("/produto");
  return { ok: true };
}

export async function deleteOfferAction(offerId: string) {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };

  const { error } = await supabase
    .from("product_offers")
    .delete()
    .eq("id", offerId)
    .eq("user_id", userId);

  if (error) return { error: "Não foi possível excluir a oferta." };
  revalidatePath("/produto");
  return { ok: true };
}

// ---- Imagens ----
// A imagem é enviada ao Storage pelo navegador; aqui só registramos no banco.
export async function addProductImageAction(
  productId: string,
  storagePath: string,
  publicUrl: string
) {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase.from("product_images").insert({
    user_id: userId,
    product_id: productId,
    storage_path: storagePath,
    public_url: publicUrl,
    sort_order: count ?? 0,
  });
  if (error) return { error: "Não foi possível salvar a imagem." };

  revalidatePath("/produto");
  return { ok: true };
}

export async function deleteProductImageAction(
  imageId: string,
  storagePath: string
) {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };

  await supabase.storage.from("product-images").remove([storagePath]);

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("user_id", userId);

  if (error) return { error: "Não foi possível excluir a imagem." };
  revalidatePath("/produto");
  return { ok: true };
}
