// ==========================================================================
// Tipos compartilhados da aplicação
// ==========================================================================

export type OrderStatus =
  | "draft"
  | "awaiting_confirmation"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "failed_delivery";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Rascunho",
  awaiting_confirmation: "Aguardando confirmação",
  confirmed: "Confirmado",
  processing: "Em processamento",
  shipped: "Enviado",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Cancelado",
  failed_delivery: "Entrega não realizada",
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "draft",
  "awaiting_confirmation",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "failed_delivery",
];

export type ConversationStatus = "bot" | "human";

export type MessageRole = "customer" | "agent" | "human";
export type MessageType = "text" | "image" | "audio";

export type AgentIntent =
  | "greeting"
  | "product_question"
  | "price_question"
  | "delivery_question"
  | "payment_question"
  | "objection"
  | "purchase_intent"
  | "order_data"
  | "order_confirmation"
  | "cancel_intent"
  | "human_request"
  | "unknown";

export type AgentAction =
  | "none"
  | "send_product_image"
  | "start_order"
  | "collect_postal_code"
  | "collect_name"
  | "collect_address_number"
  | "collect_complement"
  | "collect_reference"
  | "collect_payment_method"
  | "confirm_order"
  | "create_order"
  | "handoff_to_human";

// Estado do pedido em andamento (salvo em conversations.order_draft)
export interface OrderDraft {
  customer_name?: string;
  customer_phone?: string;
  postal_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  reference?: string;
  offer_id?: string;
  offer_label?: string;
  quantity?: number;
  unit_price?: number;
  total?: number;
  payment_method?: string;
  notes?: string;
}

// Saída estruturada da IA
export interface AgentResponse {
  message: string;
  intent: AgentIntent;
  action: AgentAction;
  order_data: OrderDraft;
  missing_fields: string[];
}

// ---- Tipos de linhas do banco (parciais, o que usamos no código) ----------

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string;
  regular_price: number | null;
  promo_price: number | null;
  current_offer: string;
  benefits: string;
  features: string;
  usage_instructions: string;
  target_audience: string;
  not_for: string;
  notes: string;
  warranty: string;
  delivery_estimate: string;
  regions: string;
  states: string;
  cities: string;
  payment_methods: string;
  requires_upfront_payment: boolean;
  cash_on_delivery: boolean;
  payment_message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductOffer {
  id: string;
  user_id: string;
  product_id: string;
  label: string;
  quantity: number;
  price: number;
  sort_order: number;
}

export interface ProductImage {
  id: string;
  user_id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  sort_order: number;
}

export interface Faq {
  id: string;
  user_id: string;
  product_id: string | null;
  question: string;
  answer: string;
  sort_order: number;
}

export interface Objection {
  id: string;
  user_id: string;
  product_id: string | null;
  objection: string;
  answer: string;
  sort_order: number;
}

export interface AgentSettings {
  user_id: string;
  agent_active: boolean;
  personality: string;
  tone: string;
  custom_tone: string;
  response_length: string;
  closing_rules: string;
  extra_instructions: string;
}

export interface WhatsappSettings {
  user_id: string;
  phone_number_id: string;
  business_account_id: string;
  display_phone_number: string;
  access_token: string;
  verify_token: string;
  connected: boolean;
}

export interface Contact {
  id: string;
  user_id: string;
  phone: string;
  name: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  contact_id: string;
  status: ConversationStatus;
  last_message: string;
  last_message_at: string | null;
  order_draft: OrderDraft;
}

export interface Message {
  id: string;
  user_id: string;
  conversation_id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  media_url: string;
  whatsapp_message_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  conversation_id: string | null;
  contact_id: string | null;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  postal_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  reference: string;
  subtotal: number;
  shipping_price: number;
  total: number;
  payment_method: string;
  payment_type: string;
  status: OrderStatus;
  customer_confirmed: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}
