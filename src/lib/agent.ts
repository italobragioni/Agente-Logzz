import type { SupabaseClient } from "@supabase/supabase-js";
import { generateAgentResponse } from "./openai";
import { lookupCep } from "./cep";
import { checkRegion } from "./delivery";
import {
  resolveWhatsappCredentials,
  sendWhatsappText,
  sendWhatsappImage,
} from "./whatsapp";
import { onlyDigits, safeLog, formatCurrency } from "./utils";
import type {
  OrderDraft,
  Product,
  ProductOffer,
  Faq,
  Objection,
  AgentSettings,
  WhatsappSettings,
} from "./types";

export interface InboundMessage {
  from: string; // telefone do cliente
  contactName: string;
  text: string;
  type: "text" | "image" | "audio";
  whatsappMessageId: string;
  mediaId?: string;
}

// Campos obrigatórios para confirmar um pedido
const REQUIRED_FIELDS: (keyof OrderDraft)[] = [
  "customer_name",
  "postal_code",
  "street",
  "number",
  "neighborhood",
  "city",
  "state",
  "offer_id",
  "quantity",
  "total",
  "payment_method",
];

function missingRequired(draft: OrderDraft): string[] {
  return REQUIRED_FIELDS.filter((f) => {
    const v = draft[f];
    return v === undefined || v === null || v === "";
  }).map(String);
}

// Processa uma mensagem recebida do WhatsApp para um usuário específico.
// Usa o cliente admin (service_role), pois roda sem sessão de usuário.
export async function processInboundMessage(
  admin: SupabaseClient,
  userId: string,
  whatsappSettings: WhatsappSettings | null,
  inbound: InboundMessage
): Promise<void> {
  const phone = onlyDigits(inbound.from);

  // ---- 1. Localiza ou cria o contato ----
  let { data: contact } = await admin
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .eq("phone", phone)
    .maybeSingle();

  if (!contact) {
    const { data: created } = await admin
      .from("contacts")
      .insert({ user_id: userId, phone, name: inbound.contactName || "" })
      .select("*")
      .single();
    contact = created;
    safeLog("Contato criado", phone);
  } else if (inbound.contactName && contact.name !== inbound.contactName) {
    await admin
      .from("contacts")
      .update({ name: inbound.contactName })
      .eq("id", contact.id);
  }
  if (!contact) {
    safeLog("Falha ao criar/localizar contato");
    return;
  }
  safeLog("Contato localizado", contact.id);

  // ---- 2. Localiza ou cria a conversa ----
  let { data: conversation } = await admin
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("contact_id", contact.id)
    .maybeSingle();

  if (!conversation) {
    const { data: created } = await admin
      .from("conversations")
      .insert({
        user_id: userId,
        contact_id: contact.id,
        status: "bot",
        order_draft: {},
      })
      .select("*")
      .single();
    conversation = created;
    safeLog("Conversa criada", conversation?.id);
  }
  if (!conversation) {
    safeLog("Falha ao criar/localizar conversa");
    return;
  }
  safeLog("Conversa localizada", conversation.id);

  // ---- 3. Evita duplicidade (webhooks podem ser reenviados) ----
  if (inbound.whatsappMessageId) {
    const { data: existing } = await admin
      .from("messages")
      .select("id")
      .eq("whatsapp_message_id", inbound.whatsappMessageId)
      .maybeSingle();
    if (existing) {
      safeLog("Mensagem duplicada ignorada", inbound.whatsappMessageId);
      return;
    }
  }

  // ---- 4. Salva a mensagem recebida ----
  const { error: insErr } = await admin.from("messages").insert({
    user_id: userId,
    conversation_id: conversation.id,
    role: "customer",
    type: inbound.type,
    content: inbound.text || "",
    whatsapp_message_id: inbound.whatsappMessageId || null,
  });
  // Se deu conflito no índice único, é duplicata: para aqui.
  if (insErr) {
    safeLog("Mensagem já processada (conflito) ", insErr.code);
    return;
  }
  safeLog("Mensagem recebida salva");

  const previewText =
    inbound.type === "text"
      ? inbound.text
      : inbound.type === "image"
        ? "📷 Imagem"
        : "🎤 Áudio";

  await admin
    .from("conversations")
    .update({
      last_message: previewText,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversation.id);

  // ---- 5. Se a conversa está com atendente humano, não chama a IA ----
  if (conversation.status === "human") {
    safeLog("Conversa em atendimento humano — IA não responde");
    return;
  }

  // ---- 6. Carrega configurações do agente ----
  const { data: agent } = await admin
    .from("agent_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!agent || !agent.agent_active) {
    safeLog("Agente desativado — não responde automaticamente");
    return;
  }

  // Só respondemos automaticamente a mensagens de texto no MVP.
  if (inbound.type !== "text" || !inbound.text.trim()) {
    safeLog("Mensagem não-texto: armazenada, sem resposta automática (MVP)");
    return;
  }

  // ---- 7. Carrega contexto do produto ----
  const { data: product } = await admin
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let offers: ProductOffer[] = [];
  let faqs: Faq[] = [];
  let objections: Objection[] = [];
  let hasImages = false;
  let firstImageUrl = "";

  if (product) {
    const [offersRes, faqsRes, objRes, imgRes] = await Promise.all([
      admin
        .from("product_offers")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true }),
      admin
        .from("faqs")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
      admin
        .from("objections")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
      admin
        .from("product_images")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order", { ascending: true }),
    ]);
    offers = offersRes.data || [];
    faqs = faqsRes.data || [];
    objections = objRes.data || [];
    hasImages = (imgRes.data?.length || 0) > 0;
    firstImageUrl = imgRes.data?.[0]?.public_url || "";
  }

  // ---- 8. Histórico recente (últimas 20 mensagens) ----
  const { data: recent } = await admin
    .from("messages")
    .select("role, content, type")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const recentMessages = (recent || []).reverse();
  // Remove a última (mensagem atual do cliente) do histórico, pois vai separada
  if (recentMessages.length > 0) recentMessages.pop();

  // ---- 9. Pré-processamento de CEP (determinístico) ----
  let draft: OrderDraft = { ...(conversation.order_draft || {}) };
  draft.customer_phone = phone;

  const digits = onlyDigits(inbound.text);
  const cepCandidate = digits.length === 8 ? digits : "";

  let deliveryNote = "";

  if (cepCandidate && (!draft.street || draft.postal_code !== cepCandidate)) {
    const cep = await lookupCep(cepCandidate);
    if (cep.found) {
      draft.postal_code = cep.postal_code;
      draft.street = cep.street || draft.street;
      draft.neighborhood = cep.neighborhood || draft.neighborhood;
      draft.city = cep.city || draft.city;
      draft.state = cep.state || draft.state;
      safeLog("CEP consultado com sucesso", cep.postal_code);
    } else {
      draft.postal_code = cepCandidate;
      deliveryNote =
        "O CEP informado não foi encontrado automaticamente. Peça o endereço manualmente (rua, bairro, cidade e estado).";
      safeLog("CEP não encontrado", cepCandidate);
    }
  }

  // ---- 10. Verificação de região (se já temos cidade/estado) ----
  if (product && (draft.city || draft.state)) {
    const region = checkRegion(product, draft.city, draft.state);
    if (region.covered) {
      deliveryNote =
        (deliveryNote ? deliveryNote + " " : "") +
        `A região informada (${draft.city || ""}${draft.state ? "/" + draft.state : ""}) É ATENDIDA. Pode prosseguir com o pedido.`;
    } else {
      deliveryNote =
        (deliveryNote ? deliveryNote + " " : "") +
        `A região informada (${draft.city || ""}${draft.state ? "/" + draft.state : ""}) NÃO É ATENDIDA. Informe educadamente que ainda não há entrega para essa região e NÃO confirme o pedido.`;
    }
  }

  // ---- 11. Chama a IA ----
  const ai = await generateAgentResponse({
    product: product as Product | null,
    offers,
    faqs,
    objections,
    agent: agent as AgentSettings,
    orderDraft: draft,
    recentMessages,
    currentMessage: inbound.text,
    hasImages,
    deliveryNote,
  });
  safeLog("Resposta da IA gerada", { intent: ai.intent, action: ai.action });

  // ---- 12. Mescla dados coletados pela IA no rascunho ----
  draft = mergeDraft(draft, ai.order_data, offers);

  // ---- 13. Resolve credenciais do WhatsApp ----
  const creds = resolveWhatsappCredentials(whatsappSettings);

  // ---- 14. Executa ações ----
  let handedOff = false;

  if (ai.action === "send_product_image" && firstImageUrl) {
    await sendWhatsappImage(creds, phone, firstImageUrl);
    safeLog("Imagem do produto enviada");
  }

  if (ai.action === "handoff_to_human") {
    await admin
      .from("conversations")
      .update({ status: "human" })
      .eq("id", conversation.id);
    handedOff = true;
    safeLog("Conversa encaminhada para atendimento humano");
  }

  // Criação do pedido — com validações rígidas
  if (ai.action === "create_order") {
    await tryCreateOrder(admin, {
      userId,
      conversationId: conversation.id,
      contactId: contact.id,
      product: product as Product | null,
      offers,
      draft,
    });
  }

  // ---- 15. Envia a resposta ao cliente ----
  const send = await sendWhatsappText(creds, phone, ai.message);
  if (!send.success) {
    safeLog("Falha ao enviar resposta ao cliente", send.error);
  } else {
    safeLog("Mensagem enviada ao cliente");
  }

  // ---- 16. Salva a resposta do agente ----
  await admin.from("messages").insert({
    user_id: userId,
    conversation_id: conversation.id,
    role: "agent",
    type: "text",
    content: ai.message,
    whatsapp_message_id: send.messageId || null,
  });

  // ---- 17. Atualiza conversa (rascunho + última mensagem) ----
  await admin
    .from("conversations")
    .update({
      order_draft: draft,
      last_message: ai.message,
      last_message_at: new Date().toISOString(),
      ...(handedOff ? { status: "human" } : {}),
    })
    .eq("id", conversation.id);

  safeLog("Rascunho do pedido atualizado");
}

// Mescla os dados novos da IA no rascunho, recalculando valores pela oferta.
function mergeDraft(
  current: OrderDraft,
  incoming: OrderDraft,
  offers: ProductOffer[]
): OrderDraft {
  const merged: OrderDraft = { ...current };

  for (const [k, v] of Object.entries(incoming)) {
    if (v === undefined || v === null || v === "") continue;
    // @ts-expect-error atribuição dinâmica controlada
    merged[k] = v;
  }

  // Se uma oferta foi escolhida, recalcula valores a partir do cadastro (fonte da verdade)
  if (merged.offer_id) {
    const offer = offers.find((o) => o.id === merged.offer_id);
    if (offer) {
      merged.offer_label = offer.label || `${offer.quantity} unidade(s)`;
      merged.quantity = offer.quantity;
      merged.unit_price = offer.price;
      merged.total = offer.price;
    }
  }

  return merged;
}

// Cria o pedido apenas quando TODAS as regras são satisfeitas.
async function tryCreateOrder(
  admin: SupabaseClient,
  args: {
    userId: string;
    conversationId: string;
    contactId: string;
    product: Product | null;
    offers: ProductOffer[];
    draft: OrderDraft;
  }
): Promise<void> {
  const { userId, conversationId, contactId, product, offers, draft } = args;

  // Não cria pedido duplicado para a mesma conversa se já houver um confirmado
  const { data: existingOrder } = await admin
    .from("orders")
    .select("id")
    .eq("conversation_id", conversationId)
    .in("status", ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"])
    .maybeSingle();
  if (existingOrder) {
    safeLog("Pedido já existe para esta conversa — não recria");
    return;
  }

  // Valida campos obrigatórios
  const missing = missingRequired(draft);
  if (missing.length > 0) {
    safeLog("create_order bloqueado: campos faltando", missing);
    return;
  }

  // Valida região
  if (product) {
    const region = checkRegion(product, draft.city, draft.state);
    if (!region.covered) {
      safeLog("create_order bloqueado: região não atendida");
      return;
    }
  }

  const offer = offers.find((o) => o.id === draft.offer_id);
  const quantity = draft.quantity || offer?.quantity || 1;
  const unitPrice = draft.unit_price ?? offer?.price ?? 0;
  const total = draft.total ?? offer?.price ?? 0;

  // Cria o pedido como CONFIRMADO
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      contact_id: contactId,
      customer_name: draft.customer_name || "",
      customer_phone: draft.customer_phone || "",
      postal_code: draft.postal_code || "",
      street: draft.street || "",
      number: draft.number || "",
      complement: draft.complement || "",
      neighborhood: draft.neighborhood || "",
      city: draft.city || "",
      state: draft.state || "",
      reference: draft.reference || "",
      subtotal: total,
      shipping_price: 0,
      total,
      payment_method: draft.payment_method || "",
      payment_type: "cash_on_delivery",
      status: "confirmed",
      customer_confirmed: true,
      notes: draft.notes || "",
    })
    .select("*")
    .single();

  if (orderErr || !order) {
    safeLog("Erro ao criar pedido", orderErr?.message);
    return;
  }

  // Item do pedido
  await admin.from("order_items").insert({
    user_id: userId,
    order_id: order.id,
    product_id: product?.id || null,
    offer_id: offer?.id || null,
    product_name: product?.name || "",
    offer_label: draft.offer_label || offer?.label || "",
    quantity,
    unit_price: unitPrice,
    total_price: total,
  });

  // Histórico de status
  await admin.from("order_status_history").insert({
    user_id: userId,
    order_id: order.id,
    status: "confirmed",
    note: "Pedido confirmado pelo cliente no WhatsApp.",
  });

  safeLog(
    "Pedido CONFIRMADO criado",
    `${order.id} — ${formatCurrency(total)}`
  );
}
