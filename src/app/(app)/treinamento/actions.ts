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

// ---- FAQs ----
export async function addFaqAction() {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("faqs")
    .insert({ user_id: userId, question: "", answer: "" });
  if (error) return { error: "Não foi possível adicionar." };
  revalidatePath("/treinamento");
  return { ok: true };
}

export async function updateFaqAction(
  id: string,
  data: { question: string; answer: string }
) {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("faqs")
    .update(data)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath("/treinamento");
  return { ok: true };
}

export async function deleteFaqAction(id: string) {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("faqs")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: "Não foi possível excluir." };
  revalidatePath("/treinamento");
  return { ok: true };
}

// ---- Objeções ----
export async function addObjectionAction() {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("objections")
    .insert({ user_id: userId, objection: "", answer: "" });
  if (error) return { error: "Não foi possível adicionar." };
  revalidatePath("/treinamento");
  return { ok: true };
}

export async function updateObjectionAction(
  id: string,
  data: { objection: string; answer: string }
) {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("objections")
    .update(data)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath("/treinamento");
  return { ok: true };
}

export async function deleteObjectionAction(id: string) {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("objections")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: "Não foi possível excluir." };
  revalidatePath("/treinamento");
  return { ok: true };
}

// ---- Configurações do agente ----
export async function saveAgentSettingsAction(formData: FormData) {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "Sessão expirada." };

  const payload = {
    personality: String(formData.get("personality") || ""),
    tone: String(formData.get("tone") || "Amigável"),
    custom_tone: String(formData.get("custom_tone") || ""),
    response_length: String(formData.get("response_length") || "Curtas"),
    closing_rules: String(formData.get("closing_rules") || ""),
    extra_instructions: String(formData.get("extra_instructions") || ""),
  };

  const { error } = await supabase
    .from("agent_settings")
    .update(payload)
    .eq("user_id", userId);

  if (error) return { error: "Não foi possível salvar as configurações." };
  revalidatePath("/treinamento");
  return { ok: true };
}
