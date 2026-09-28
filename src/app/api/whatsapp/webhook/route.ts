import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processInboundMessage, type InboundMessage } from "@/lib/agent";
import { rateLimit } from "@/lib/ratelimit";
import { safeLog } from "@/lib/utils";
import type { WhatsappSettings } from "@/lib/types";

// O webhook precisa rodar no runtime Node (usa service_role e OpenAI SDK).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ==========================================================================
// GET — validação do webhook pela Meta
// ==========================================================================
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const expected = process.env.META_WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token && token === expected) {
    safeLog("Webhook verificado com sucesso pela Meta");
    return new NextResponse(challenge || "", { status: 200 });
  }

  safeLog("Falha na verificação do webhook (token inválido)");
  return new NextResponse("Forbidden", { status: 403 });
}

// ==========================================================================
// POST — recebimento de mensagens
// ==========================================================================
export async function POST(request: NextRequest) {
  // Responde 200 rápido para a Meta não reenviar; processa em seguida.
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) {
      return NextResponse.json({ ok: true });
    }

    const messages = value?.messages;
    // Ignora eventos que não são mensagens (ex: status de entrega)
    if (!messages || messages.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
    if (!phoneNumberId) {
      safeLog("Webhook sem phone_number_id");
      return NextResponse.json({ ok: true });
    }

    // Rate limit por número de origem
    const rl = rateLimit(`wa:${phoneNumberId}`, 60, 60_000);
    if (!rl.allowed) {
      safeLog("Rate limit atingido para", phoneNumberId);
      return NextResponse.json({ ok: true });
    }

    const admin = createAdminClient();

    // Descobre o usuário dono deste número
    const { data: settings } = await admin
      .from("whatsapp_settings")
      .select("*")
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

    let userId: string | undefined = settings?.user_id;
    let whatsappSettings: WhatsappSettings | null =
      (settings as WhatsappSettings) || null;

    // Fallback MVP: se ninguém cadastrou este número no app, mas ele bate com
    // a variável de ambiente, usa o primeiro (e único) usuário cadastrado.
    if (!userId && phoneNumberId === process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
      const { data: firstProfile } = await admin
        .from("profiles")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      userId = firstProfile?.id;
    }

    if (!userId) {
      safeLog("Nenhum usuário associado ao número", phoneNumberId);
      return NextResponse.json({ ok: true });
    }

    const contacts = value?.contacts || [];
    const contactName = contacts?.[0]?.profile?.name || "";

    // Processa cada mensagem recebida
    for (const msg of messages) {
      const type: string = msg?.type || "text";
      let text = "";
      let mediaId: string | undefined;
      let normalizedType: "text" | "image" | "audio" = "text";

      if (type === "text") {
        text = msg?.text?.body || "";
        normalizedType = "text";
      } else if (type === "image") {
        text = msg?.image?.caption || "";
        mediaId = msg?.image?.id;
        normalizedType = "image";
      } else if (type === "audio") {
        mediaId = msg?.audio?.id;
        normalizedType = "audio";
      } else {
        // Tipo desconhecido: registra como texto vazio, não quebra.
        normalizedType = "text";
        text = "";
      }

      const inbound: InboundMessage = {
        from: msg?.from || "",
        contactName,
        text,
        type: normalizedType,
        whatsappMessageId: msg?.id || "",
        mediaId,
      };

      if (!inbound.from) continue;

      // Processa (await para garantir execução no ambiente serverless)
      await processInboundMessage(admin, userId, whatsappSettings, inbound);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Nunca deixa o webhook quebrar: sempre responde 200.
    safeLog("Erro no processamento do webhook", (err as Error)?.message);
    return NextResponse.json({ ok: true });
  }
}
