import { safeLog } from "./utils";
import type { WhatsappSettings } from "./types";

const GRAPH_VERSION = "v21.0";

interface WhatsappCredentials {
  accessToken: string;
  phoneNumberId: string;
}

// Monta as credenciais do WhatsApp.
// Prioridade: valores salvos no banco (por usuário) > variáveis de ambiente.
// Tokens NUNCA vão para o navegador — esta função roda apenas no servidor.
export function resolveWhatsappCredentials(
  settings?: Partial<WhatsappSettings> | null
): WhatsappCredentials {
  const accessToken =
    (settings?.access_token && settings.access_token.trim()) ||
    process.env.META_WHATSAPP_ACCESS_TOKEN ||
    "";
  const phoneNumberId =
    (settings?.phone_number_id && settings.phone_number_id.trim()) ||
    process.env.META_WHATSAPP_PHONE_NUMBER_ID ||
    "";

  return { accessToken, phoneNumberId };
}

export function hasWhatsappCredentials(
  settings?: Partial<WhatsappSettings> | null
): boolean {
  const { accessToken, phoneNumberId } = resolveWhatsappCredentials(settings);
  return Boolean(accessToken && phoneNumberId);
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Envia uma mensagem de texto pelo WhatsApp Cloud API.
export async function sendWhatsappText(
  creds: WhatsappCredentials,
  to: string,
  text: string
): Promise<SendResult> {
  if (!creds.accessToken || !creds.phoneNumberId) {
    return { success: false, error: "Credenciais do WhatsApp ausentes." };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${creds.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: text.slice(0, 4096) },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      safeLog("WhatsApp: erro ao enviar texto", data?.error?.message);
      return {
        success: false,
        error: data?.error?.message || "Erro ao enviar mensagem.",
      };
    }

    return {
      success: true,
      messageId: data?.messages?.[0]?.id,
    };
  } catch (err) {
    safeLog("WhatsApp: exceção ao enviar texto", (err as Error)?.message);
    return { success: false, error: "Falha de rede ao enviar mensagem." };
  }
}

// Envia uma imagem (por URL pública) pelo WhatsApp Cloud API.
export async function sendWhatsappImage(
  creds: WhatsappCredentials,
  to: string,
  imageUrl: string,
  caption?: string
): Promise<SendResult> {
  if (!creds.accessToken || !creds.phoneNumberId) {
    return { success: false, error: "Credenciais do WhatsApp ausentes." };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${creds.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "image",
          image: { link: imageUrl, caption: caption?.slice(0, 1024) },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      safeLog("WhatsApp: erro ao enviar imagem", data?.error?.message);
      return {
        success: false,
        error: data?.error?.message || "Erro ao enviar imagem.",
      };
    }

    return { success: true, messageId: data?.messages?.[0]?.id };
  } catch (err) {
    safeLog("WhatsApp: exceção ao enviar imagem", (err as Error)?.message);
    return { success: false, error: "Falha de rede ao enviar imagem." };
  }
}
