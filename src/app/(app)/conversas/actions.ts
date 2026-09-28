"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  resolveWhatsappCredentials,
  sendWhatsappText,
} from "@/lib/whatsapp";
import type { WhatsappSettings } from "@/lib/types";

async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id };
}

// Assumir conversa: o agente para de responder automaticamente.
export async function takeoverConversationAction(conversationId: string) {
  const { supabase, userId } = await getUser();
  if (!userId) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("conversations")
    .update({ status: "human" })
    .eq("id", conversationId)
    .eq("user_id", userId);
  if (error) return { error: "Não foi possível assumir a conversa." };
  revalidatePath("/conversas");
  return { ok: true };
}

// Devolver para o agente: a IA volta a atender.
export async function returnToBotAction(conversationId: string) {
  const { supabase, userId } = await getUser();
  if (!userId) return { error: "Sessão expirada." };
  const { error } = await supabase
    .from("conversations")
    .update({ status: "bot" })
    .eq("id", conversationId)
    .eq("user_id", userId);
  if (error) return { error: "Não foi possível devolver para o agente." };
  revalidatePath("/conversas");
  return { ok: true };
}

// Envio manual de mensagem pelo atendente humano.
export async function sendManualMessageAction(
  conversationId: string,
  text: string
) {
  const { supabase, userId } = await getUser();
  if (!userId) return { error: "Sessão expirada." };
  if (!text.trim()) return { error: "Digite uma mensagem." };

  // Descobre o contato/telefone
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, contact_id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!conversation) return { error: "Conversa não encontrada." };

  const { data: contact } = await supabase
    .from("contacts")
    .select("phone")
    .eq("id", conversation.contact_id)
    .maybeSingle();
  if (!contact) return { error: "Contato não encontrado." };

  // Credenciais do WhatsApp
  const { data: settings } = await supabase
    .from("whatsapp_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  const creds = resolveWhatsappCredentials(settings as WhatsappSettings);

  const send = await sendWhatsappText(creds, contact.phone, text);
  if (!send.success) {
    return { error: send.error || "Falha ao enviar mensagem pelo WhatsApp." };
  }

  await supabase.from("messages").insert({
    user_id: userId,
    conversation_id: conversationId,
    role: "human",
    type: "text",
    content: text,
    whatsapp_message_id: send.messageId || null,
  });

  await supabase
    .from("conversations")
    .update({
      last_message: text,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  revalidatePath("/conversas");
  return { ok: true };
}
