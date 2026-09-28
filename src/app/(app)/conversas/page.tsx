import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/Header";
import {
  ConversationList,
  type ConversationListItem,
} from "@/components/ConversationList";
import { ChatWindow } from "@/components/ChatWindow";
import type { Message } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ConversasPage({
  searchParams,
}: {
  searchParams: { c?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  // Lista de conversas com dados do contato
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, status, last_message, last_message_at, contact_id")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  const contactIds = (conversations || []).map((c) => c.contact_id);
  const { data: contacts } = contactIds.length
    ? await supabase
        .from("contacts")
        .select("id, name, phone")
        .in("id", contactIds)
    : { data: [] as { id: string; name: string; phone: string }[] };

  const contactMap = new Map(
    (contacts || []).map((c) => [c.id, c])
  );

  const items: ConversationListItem[] = (conversations || []).map((c) => {
    const contact = contactMap.get(c.contact_id);
    return {
      id: c.id,
      name: contact?.name || "",
      phone: contact?.phone || "",
      last_message: c.last_message || "",
      last_message_at: c.last_message_at,
      status: c.status as "bot" | "human",
    };
  });

  const selectedId = searchParams.c;
  let selected: ConversationListItem | undefined;
  let messages: Message[] = [];

  if (selectedId) {
    selected = items.find((i) => i.id === selectedId);
    if (selected) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedId)
        .order("created_at", { ascending: true })
        .limit(200);
      messages = (msgs as Message[]) || [];
    }
  }

  return (
    <div>
      <Header
        title="Conversas"
        subtitle="Acompanhe e assuma conversas quando precisar"
      />

      <div className="card grid h-[calc(100vh-220px)] grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
        {/* Lista */}
        <div
          className={`border-r border-gray-100 ${
            selected ? "hidden md:flex md:flex-col" : "flex flex-col"
          }`}
        >
          <ConversationList items={items} selectedId={selectedId} />
        </div>

        {/* Chat */}
        <div className={selected ? "flex flex-col" : "hidden md:flex md:flex-col"}>
          {selected ? (
            <ChatWindow
              conversationId={selected.id}
              contactName={selected.name}
              contactPhone={selected.phone}
              status={selected.status}
              messages={messages}
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-400">
              Selecione uma conversa para ver as mensagens.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
