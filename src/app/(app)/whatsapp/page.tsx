import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import { WhatsAppStatus } from "@/components/WhatsAppStatus";
import { hasWhatsappCredentials } from "@/lib/whatsapp";
import type { WhatsappSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WhatsappPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const { data: settings } = await supabase
    .from("whatsapp_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const wa = (settings as WhatsappSettings) || ({} as WhatsappSettings);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://seu-projeto.vercel.app";
  const webhookUrl = `${appUrl}/api/whatsapp/webhook`;

  const connected =
    hasWhatsappCredentials(wa) && Boolean(wa.phone_number_id);
  const hasEnvToken = Boolean(process.env.META_WHATSAPP_ACCESS_TOKEN);

  return (
    <div>
      <Header
        title="WhatsApp"
        subtitle="Conecte seu número do WhatsApp Cloud API oficial da Meta"
      />
      <WhatsAppStatus
        settings={wa}
        webhookUrl={webhookUrl}
        connected={connected}
        hasEnvToken={hasEnvToken}
      />
    </div>
  );
}
