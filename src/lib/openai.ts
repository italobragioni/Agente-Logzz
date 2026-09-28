import OpenAI from "openai";
import { safeLog, formatCurrency } from "./utils";
import type {
  Product,
  ProductOffer,
  Faq,
  Objection,
  AgentSettings,
  OrderDraft,
  AgentResponse,
  Message,
} from "./types";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export interface GenerateInput {
  product: Product | null;
  offers: ProductOffer[];
  faqs: Faq[];
  objections: Objection[];
  agent: AgentSettings;
  orderDraft: OrderDraft;
  recentMessages: Pick<Message, "role" | "content" | "type">[];
  currentMessage: string;
  hasImages: boolean;
  // Nota do sistema sobre cobertura de entrega (calculada deterministicamente)
  deliveryNote?: string;
}

// Descreve o tamanho da resposta desejado
function lengthGuidance(len: string): string {
  switch (len) {
    case "Médias":
      return "Responda com mensagens de tamanho médio (2 a 4 frases).";
    case "Detalhadas":
      return "Você pode dar respostas mais detalhadas quando necessário, mas sem exageros.";
    case "Curtas":
    default:
      return "Responda com mensagens CURTAS (1 a 2 frases). É uma conversa de WhatsApp.";
  }
}

function toneGuidance(agent: AgentSettings): string {
  if (agent.tone === "Personalizado" && agent.custom_tone?.trim()) {
    return `Tom de voz: ${agent.custom_tone.trim()}`;
  }
  return `Tom de voz: ${agent.tone || "Amigável"}`;
}

// Monta o prompt do sistema com TODO o contexto do negócio.
function buildSystemPrompt(input: GenerateInput): string {
  const { product, offers, faqs, objections, agent, orderDraft } = input;

  const parts: string[] = [];

  parts.push(agent.personality?.trim() || "");
  parts.push("");
  parts.push(toneGuidance(agent));
  parts.push(lengthGuidance(agent.response_length));

  if (agent.extra_instructions?.trim()) {
    parts.push("\nInstruções adicionais do lojista:");
    parts.push(agent.extra_instructions.trim());
  }
  if (agent.closing_rules?.trim()) {
    parts.push("\nRegras de fechamento:");
    parts.push(agent.closing_rules.trim());
  }

  // ---- Produto ----
  parts.push("\n===== INFORMAÇÕES DO PRODUTO =====");
  if (!product) {
    parts.push(
      "Nenhum produto cadastrado ainda. Se o cliente perguntar sobre o produto, diga que vai verificar com um atendente humano."
    );
  } else {
    parts.push(`Nome: ${product.name || "(não informado)"}`);
    if (product.description) parts.push(`Descrição: ${product.description}`);
    if (product.benefits) parts.push(`Benefícios: ${product.benefits}`);
    if (product.features) parts.push(`Características: ${product.features}`);
    if (product.usage_instructions)
      parts.push(`Modo de uso: ${product.usage_instructions}`);
    if (product.target_audience)
      parts.push(`Indicado para: ${product.target_audience}`);
    if (product.not_for) parts.push(`Não indicado para: ${product.not_for}`);
    if (product.warranty) parts.push(`Garantia: ${product.warranty}`);
    if (product.notes) parts.push(`Observações: ${product.notes}`);
    if (product.regular_price != null)
      parts.push(`Preço normal: ${formatCurrency(product.regular_price)}`);
    if (product.promo_price != null)
      parts.push(`Preço promocional: ${formatCurrency(product.promo_price)}`);
    if (product.current_offer)
      parts.push(`Oferta atual: ${product.current_offer}`);

    // Ofertas
    if (offers.length > 0) {
      parts.push("\nOfertas disponíveis (use EXATAMENTE estes valores):");
      offers.forEach((o) => {
        parts.push(
          `- id=${o.id} | ${o.label || `${o.quantity} unidade(s)`} | ${o.quantity} unidade(s) por ${formatCurrency(
            o.price
          )}`
        );
      });
    }

    // Entrega
    parts.push("\n----- ENTREGA -----");
    if (product.delivery_estimate)
      parts.push(`Prazo estimado de entrega: ${product.delivery_estimate}`);
    if (product.regions) parts.push(`Regiões atendidas: ${product.regions}`);
    if (product.states) parts.push(`Estados atendidos: ${product.states}`);
    if (product.cities) parts.push(`Cidades atendidas: ${product.cities}`);
    parts.push(
      "IMPORTANTE: Nunca diga que entregamos em uma região que não esteja listada acima. Se não houver regiões cadastradas, e o cliente perguntar, diga que vai confirmar a disponibilidade para a região dele."
    );

    // Pagamento / COD
    parts.push("\n----- PAGAMENTO -----");
    parts.push(`Formas de pagamento na entrega: ${product.payment_methods}`);
    parts.push(
      `Pagamento na entrega (Cash on Delivery): ${product.cash_on_delivery ? "SIM" : "NÃO"}`
    );
    parts.push(
      `Pagamento antecipado obrigatório: ${product.requires_upfront_payment ? "SIM" : "NÃO"}`
    );
    if (product.cash_on_delivery && product.payment_message) {
      parts.push(
        `Mensagem padrão sobre pagamento (use quando for relevante, sem repetir sempre): "${product.payment_message}"`
      );
    }
  }

  // ---- FAQ ----
  if (faqs.length > 0) {
    parts.push("\n===== PERGUNTAS FREQUENTES =====");
    faqs.forEach((f) => {
      if (f.question || f.answer)
        parts.push(`P: ${f.question}\nR: ${f.answer}`);
    });
  }

  // ---- Objeções ----
  if (objections.length > 0) {
    parts.push("\n===== OBJEÇÕES E RESPOSTAS RECOMENDADAS =====");
    objections.forEach((o) => {
      if (o.objection || o.answer)
        parts.push(`Objeção: ${o.objection}\nResposta recomendada: ${o.answer}`);
    });
  }

  // ---- Estado do pedido em andamento ----
  parts.push("\n===== PEDIDO EM ANDAMENTO (dados já coletados) =====");
  const draftEntries = Object.entries(orderDraft || {}).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (draftEntries.length === 0) {
    parts.push("Nenhum dado coletado ainda.");
  } else {
    draftEntries.forEach(([k, v]) => parts.push(`- ${k}: ${v}`));
  }

  // ---- Nota de cobertura de entrega ----
  if (input.deliveryNote) {
    parts.push("\n===== VERIFICAÇÃO DE ENTREGA (sistema) =====");
    parts.push(input.deliveryNote);
  }

  // ---- Regras do fluxo COD ----
  parts.push("\n===== REGRAS DO FLUXO DE VENDA (COD) =====");
  parts.push(
    `- Fluxo natural: receber o cliente, entender interesse e dúvidas, apresentar benefícios relevantes, informar preço/oferta, responder objeções, e (quando fizer sentido) perguntar se deseja fazer o pedido. Não faça um interrogatório robótico.`
  );
  parts.push(
    `- Para COLETAR dados do pedido, peça UM dado por vez, de forma natural. Comece pelo CEP quando o cliente aceitar fazer o pedido.`
  );
  parts.push(
    `- Ao receber um CEP, o sistema consulta o endereço automaticamente. Depois pergunte apenas o que faltar (ex: número da casa, complemento).`
  );
  parts.push(
    `- NUNCA marque um pedido como confirmado só porque o cliente disse "quero". Só confirme após: oferta definida, quantidade definida, valor definido, forma de pagamento definida, endereço completo, região validada e o cliente confirmar explicitamente o resumo final.`
  );
  parts.push(
    `- Antes de confirmar, mostre um RESUMO (produto, quantidade, total, endereço, forma de pagamento, "pagamento na entrega") e pergunte se está tudo certo.`
  );

  // ---- Como usar o campo "action" ----
  parts.push("\n===== COMO PREENCHER O CAMPO action =====");
  parts.push(`- "none": conversa normal, nenhuma ação especial.`);
  parts.push(
    `- "send_product_image": quando o cliente pedir para ver foto do produto (${
      input.hasImages ? "há imagens cadastradas" : "NÃO há imagens cadastradas — nesse caso não use esta ação"
    }).`
  );
  parts.push(`- "start_order": quando o cliente aceitar iniciar o pedido.`);
  parts.push(
    `- "collect_postal_code", "collect_name", "collect_address_number", "collect_complement", "collect_reference", "collect_payment_method": quando estiver pedindo aquele dado específico.`
  );
  parts.push(
    `- "confirm_order": quando você acabou de mostrar o resumo e está aguardando o "sim" do cliente.`
  );
  parts.push(
    `- "create_order": SOMENTE quando o cliente confirmou explicitamente o resumo final E todos os dados obrigatórios estão preenchidos. Preencha order_data com todos os dados.`
  );
  parts.push(
    `- "handoff_to_human": quando o cliente pedir para falar com um humano, ou você não souber responder algo importante.`
  );

  parts.push(
    "\nSempre atualize o campo order_data com quaisquer dados novos que o cliente informar nesta mensagem (nome, número, complemento, oferta escolhida, quantidade, forma de pagamento etc.), mesmo que a ação seja none. Liste em missing_fields o que ainda falta para fechar o pedido."
  );
  parts.push(
    "Para offer_id, use exatamente um dos ids listados nas ofertas. quantity e unit_price/total devem bater com a oferta escolhida."
  );

  return parts.filter((p) => p !== null && p !== undefined).join("\n");
}

// Esquema da resposta estruturada (JSON Schema para structured output)
const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    message: { type: "string", description: "Texto para enviar ao cliente." },
    intent: {
      type: "string",
      enum: [
        "greeting",
        "product_question",
        "price_question",
        "delivery_question",
        "payment_question",
        "objection",
        "purchase_intent",
        "order_data",
        "order_confirmation",
        "cancel_intent",
        "human_request",
        "unknown",
      ],
    },
    action: {
      type: "string",
      enum: [
        "none",
        "send_product_image",
        "start_order",
        "collect_postal_code",
        "collect_name",
        "collect_address_number",
        "collect_complement",
        "collect_reference",
        "collect_payment_method",
        "confirm_order",
        "create_order",
        "handoff_to_human",
      ],
    },
    order_data: {
      type: "object",
      additionalProperties: false,
      properties: {
        customer_name: { type: ["string", "null"] },
        postal_code: { type: ["string", "null"] },
        street: { type: ["string", "null"] },
        number: { type: ["string", "null"] },
        complement: { type: ["string", "null"] },
        neighborhood: { type: ["string", "null"] },
        city: { type: ["string", "null"] },
        state: { type: ["string", "null"] },
        reference: { type: ["string", "null"] },
        offer_id: { type: ["string", "null"] },
        offer_label: { type: ["string", "null"] },
        quantity: { type: ["number", "null"] },
        unit_price: { type: ["number", "null"] },
        total: { type: ["number", "null"] },
        payment_method: { type: ["string", "null"] },
        notes: { type: ["string", "null"] },
      },
      required: [
        "customer_name",
        "postal_code",
        "street",
        "number",
        "complement",
        "neighborhood",
        "city",
        "state",
        "reference",
        "offer_id",
        "offer_label",
        "quantity",
        "unit_price",
        "total",
        "payment_method",
        "notes",
      ],
    },
    missing_fields: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["message", "intent", "action", "order_data", "missing_fields"],
} as const;

function fallbackResponse(): AgentResponse {
  return {
    message:
      "Desculpe, tive uma instabilidade aqui. Já vou chamar um atendente para te ajudar 😊",
    intent: "unknown",
    action: "handoff_to_human",
    order_data: {},
    missing_fields: [],
  };
}

// Limpa os campos nulos do order_data retornado pela IA
function cleanOrderData(raw: Record<string, unknown>): OrderDraft {
  const result: OrderDraft = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (v === null || v === undefined || v === "") continue;
    // @ts-expect-error atribuição dinâmica controlada
    result[k] = v;
  }
  return result;
}

// FUNÇÃO PRINCIPAL: gera a resposta do agente.
export async function generateAgentResponse(
  input: GenerateInput
): Promise<AgentResponse> {
  if (!process.env.OPENAI_API_KEY) {
    safeLog("OpenAI: chave ausente");
    return fallbackResponse();
  }

  const system = buildSystemPrompt(input);

  // Monta o histórico recente
  const history = input.recentMessages.map((m) => ({
    role: (m.role === "customer" ? "user" : "assistant") as "user" | "assistant",
    content:
      m.type !== "text" && !m.content
        ? `[cliente enviou ${m.type === "image" ? "uma imagem" : "um áudio"}]`
        : m.content || "",
  }));

  try {
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      temperature: 0.6,
      messages: [
        { role: "system", content: system },
        ...history,
        { role: "user", content: input.currentMessage },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agent_response",
          strict: true,
          schema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
        },
      },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return fallbackResponse();

    const parsed = JSON.parse(content);

    return {
      message: String(parsed.message || "").trim() || "😊",
      intent: parsed.intent || "unknown",
      action: parsed.action || "none",
      order_data: cleanOrderData(parsed.order_data || {}),
      missing_fields: Array.isArray(parsed.missing_fields)
        ? parsed.missing_fields
        : [],
    };
  } catch (err) {
    safeLog("OpenAI: erro ao gerar resposta", (err as Error)?.message);
    return fallbackResponse();
  }
}
